// socket-huddlegames/server.js

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// In-memory structure
const rooms = {}         // { roomCode: { [socket.id]: player } }
const gameStates = {}    // { roomCode: { status, gameSlug, round, ... } }

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id)

  // Player joins a room
  socket.on('join-room', ({ roomCode, player }) => {
    socket.join(roomCode)

    if (!rooms[roomCode]) rooms[roomCode] = {}
    rooms[roomCode][socket.id] = player

    io.to(roomCode).emit('players-update', Object.values(rooms[roomCode]))
    console.log(`👥 ${player.player_name} joined ${roomCode}`)
  })

  // 🆕 Handle starting the game
  socket.on('start-game', ({ roomCode, gameSlug }) => {
    gameStates[roomCode] = {
      status: 'in-progress',
      gameSlug,
      round: 1,
    }

    io.to(roomCode).emit('game-started', {
      message: 'Game has started!',
      gameSlug,
      round: 1,
    })

    console.log(`🚀 Game started in room ${roomCode}`)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const roomCode in rooms) {
      if (rooms[roomCode][socket.id]) {
        console.log(`🔴 ${rooms[roomCode][socket.id].player_name} left ${roomCode}`)
        delete rooms[roomCode][socket.id]
        io.to(roomCode).emit('players-update', Object.values(rooms[roomCode]))
      }
    }
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on http://localhost:${PORT}`)
})
