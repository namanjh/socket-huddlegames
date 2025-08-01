// socket-huddlegames/server.js

process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught Exception:', error);
});

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

// In-memory structure
// rooms: { roomCode: { [socket.id]: { player_id, player_name, team, is_admin } } }
const rooms = {};
const gameStates = {}; // { roomCode: { status, gameSlug, round, ... } }

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  // Player joins a room
  // The 'player' object now comes from the frontend, already containing team and is_admin
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

    // Emit players-update with the full player objects
    io.to(roomCode).emit('players-update', Object.values(rooms[roomCode]));
  });

  // Handle teams being assigned (triggered by frontend after "Start Game")
  socket.on('teams-assigned', ({ roomCode, players }) => {
    console.log(`🔄 Teams assigned in room ${roomCode}. Broadcasting update.`);
    // Update the in-memory players for this room with the new team assignments
    // This ensures the server's state is consistent with the database
    players.forEach(p => {
      const existingPlayer = Object.values(rooms[roomCode]).find(ep => ep.player_id === p.player_id);
      if (existingPlayer) {
        existingPlayer.team = p.team;
      }
    });
    io.to(roomCode).emit('players-update', Object.values(rooms[roomCode]));
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

        // If the room is empty, delete it
        if (Object.keys(rooms[roomCode]).length === 0) {
          console.log(`🗑️ Room ${roomCode} is empty and has been deleted.`);
          delete rooms[roomCode];
          delete gameStates[roomCode]; // Also clear game state if room is empty
        } else {
          // Broadcast updated players list if room still exists
          io.to(roomCode).emit('players-update', Object.values(rooms[roomCode]));
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
