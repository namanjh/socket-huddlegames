# HuddleGames — Socket Server

**socket-huddlegames** is a lightweight Node.js backend for managing real-time multiplayer gameplay using **Socket.IO**. It acts as the game coordinator for all rooms, players, and events.

---

## 🧩 Responsibilities

- Creating and joining game rooms
- Broadcasting game state updates
- Managing player turns
- Handling user disconnects and re-joins
- Supporting multiple game types

---

## 🛠 Tech Stack

- **Node.js**
- **Socket.IO**
- **Express** (optional for health routes)
- **TypeScript (planned)**

---

## 🔄 Socket Events

| Event | Description |
|-------|-------------|
| `join-room` | Player joins a specific game room |
| `player-update` | Update player list or status |
| `game-started` | Game has officially begun |
| `next-turn` | Turn passed to next player or team |
| `submit-action` | Player submits input (guess, drawing, etc.) |
| `game-ended` | Game concludes |

---

## 🌱 Planned Improvements

- Add Redis persistence layer
- Add REST API for diagnostics and room snapshots
- Enable game replays (state dump)
