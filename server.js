// socket-huddlegames/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = {};         // { roomCode: { [socket.id]: player } }
const gameStates = {};    // { roomCode: { status, gameSlug, round, ... } }

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  socket.on('join-room', ({ roomCode, player }) => {
    socket.join(roomCode);

    if (!rooms[roomCode]) {
      rooms[roomCode] = {};
      console.log(`🚪 Room ${roomCode} created.`);
    }

    // Store the player object directly as provided by the frontend
    rooms[roomCode][socket.id] = {
      ...player, // Spread the player object (includes player_id, player_name, team, is_admin)
      socket_id: socket.id // Add socket_id for easy reference
    };

    console.log(`👥 ${player.player_name} (${socket.id}) joined room ${roomCode} on Team ${player.team}`);

    const currentPlayersInRoom = Object.values(rooms[roomCode]);
    console.log('DEBUG: Emitting players-update with:', currentPlayersInRoom);

    // Emit players-update with the full player objects
    io.to(roomCode).emit('players-update', currentPlayersInRoom);
  });

  // 🆕 Handle starting the game
  socket.on('start-game', ({ roomCode, gameSlug }) => {
    gameStates[roomCode] = {
      status: 'in-progress',
      gameSlug,
      round: 1,
    };

    io.to(roomCode).emit('game-started', {
      message: 'Game has started!',
      gameSlug,
      round: 1,
    });

    console.log(`🚀 Game started in room ${roomCode}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
    for (const roomCode in rooms) {
      if (rooms[roomCode][socket.id]) {
        const { player_name } = rooms[roomCode][socket.id];
        console.log(`🔴 ${player_name} left ${roomCode}`);
        delete rooms[roomCode][socket.id];

        if (Object.keys(rooms[roomCode]).length === 0) {
          delete rooms[roomCode];
          delete gameStates[roomCode]; // Also clear game state if room is empty
        } else {
          const currentPlayersInRoom = Object.values(rooms[roomCode]);
          io.to(roomCode).emit('players-update', currentPlayersInRoom);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on http://localhost:${PORT}`);
});
