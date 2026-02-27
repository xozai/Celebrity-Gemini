import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";

// Types
type User = {
  id: string;
  name: string;
  team: 1 | 2 | null;
  isHost: boolean;
  ready: boolean;
};

type Name = {
  id: string;
  text: string;
  submittedBy: string;
};

type RoomState = {
  id: string;
  users: User[];
  status: "lobby" | "submitting" | "playing" | "round_end" | "game_over";
  names: Name[];
  bowl: string[]; // IDs of names currently in the bowl
  currentRound: 1 | 2 | 3;
  currentTurn: {
    team: 1 | 2;
    actorId: string | null;
    startTime: number | null;
    endTime: number | null;
    currentNameId: string | null;
    guessedNames: string[]; // IDs of names guessed this turn
    isActive: boolean;
  } | null;
  scores: { team1: number; team2: number };
  roundScores: { team1: number; team2: number }[];
  turnIndex: { team1: number; team2: number };
};

const rooms = new Map<string, RoomState>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create_room", ({ userName }, callback) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const user: User = {
        id: socket.id,
        name: userName,
        team: null,
        isHost: true,
        ready: false,
      };

      const room: RoomState = {
        id: roomId,
        users: [user],
        status: "lobby",
        names: [],
        bowl: [],
        currentRound: 1,
        currentTurn: null,
        scores: { team1: 0, team2: 0 },
        roundScores: [],
        turnIndex: { team1: 0, team2: 0 },
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      callback({ success: true, room, user });
    });

    socket.on("join_room", ({ roomId, userName }, callback) => {
      const room = rooms.get(roomId);
      if (!room) {
        return callback({ success: false, error: "Room not found" });
      }

      if (room.status !== "lobby") {
        return callback({ success: false, error: "Game already started" });
      }

      const user: User = {
        id: socket.id,
        name: userName,
        team: null,
        isHost: false,
        ready: false,
      };

      room.users.push(user);
      socket.join(roomId);
      io.to(roomId).emit("room_update", room);
      callback({ success: true, room, user });
    });

    socket.on("join_team", ({ roomId, team }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.id === socket.id);
      if (user) {
        user.team = team;
        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("start_submitting", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.id === socket.id);
      if (user && user.isHost) {
        room.status = "submitting";
        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("submit_names", ({ roomId, names }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.id === socket.id);
      if (user) {
        names.forEach((text: string) => {
          if (text.trim()) {
            room.names.push({
              id: uuidv4(),
              text: text.trim(),
              submittedBy: user.id,
            });
          }
        });
        user.ready = true;
        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("start_game", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.id === socket.id);
      if (user && user.isHost) {
        room.status = "playing";
        room.currentRound = 1;
        room.bowl = room.names.map((n) => n.id);
        
        // Shuffle bowl
        for (let i = room.bowl.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [room.bowl[i], room.bowl[j]] = [room.bowl[j], room.bowl[i]];
        }

        // Initialize turn
        const team1Users = room.users.filter(u => u.team === 1);
        const team2Users = room.users.filter(u => u.team === 2);
        
        // Random starting team
        const startingTeam = Math.random() > 0.5 ? 1 : 2;
        const startingActorId = startingTeam === 1 
          ? team1Users[0]?.id 
          : team2Users[0]?.id;

        room.currentTurn = {
          team: startingTeam,
          actorId: startingActorId || null,
          startTime: null,
          endTime: null,
          currentNameId: null,
          guessedNames: [],
          isActive: false,
        };

        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("start_turn", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || !room.currentTurn) return;

      if (room.currentTurn.actorId === socket.id && !room.currentTurn.isActive) {
        room.currentTurn.isActive = true;
        room.currentTurn.startTime = Date.now();
        room.currentTurn.endTime = Date.now() + 60000; // 60 seconds
        
        // Draw first name
        if (room.bowl.length > 0) {
          room.currentTurn.currentNameId = room.bowl.pop() || null;
        }

        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("next_name", ({ roomId, guessed }) => {
      const room = rooms.get(roomId);
      if (!room || !room.currentTurn || !room.currentTurn.isActive) return;

      if (room.currentTurn.actorId === socket.id) {
        if (guessed && room.currentTurn.currentNameId) {
          room.currentTurn.guessedNames.push(room.currentTurn.currentNameId);
          if (room.currentTurn.team === 1) room.scores.team1++;
          else room.scores.team2++;
        } else if (!guessed && room.currentTurn.currentNameId) {
          // Put back in bowl
          room.bowl.push(room.currentTurn.currentNameId);
          // Shuffle bowl
          for (let i = room.bowl.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.bowl[i], room.bowl[j]] = [room.bowl[j], room.bowl[i]];
          }
        }

        // Draw next name
        if (room.bowl.length > 0) {
          room.currentTurn.currentNameId = room.bowl.pop() || null;
        } else {
          room.currentTurn.currentNameId = null;
          // End turn automatically if bowl is empty
          endTurn(room);
        }

        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("end_turn", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || !room.currentTurn || !room.currentTurn.isActive) return;

      if (room.currentTurn.actorId === socket.id) {
        // If they had a name in hand, put it back
        if (room.currentTurn.currentNameId) {
          room.bowl.push(room.currentTurn.currentNameId);
          room.currentTurn.currentNameId = null;
        }
        endTurn(room);
        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("next_round", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "round_end") return;

      const user = room.users.find((u) => u.id === socket.id);
      if (user && user.isHost) {
        if (room.currentRound === 3) {
          room.status = "game_over";
        } else {
          room.currentRound++;
          room.status = "playing";
          room.bowl = room.names.map((n) => n.id);
          
          // Shuffle bowl
          for (let i = room.bowl.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.bowl[i], room.bowl[j]] = [room.bowl[j], room.bowl[i]];
          }

          // Next team starts
          const nextTeam = room.currentTurn?.team === 1 ? 2 : 1;
          const teamUsers = room.users.filter(u => u.team === nextTeam);
          const nextActorId = teamUsers[room.turnIndex[nextTeam === 1 ? 'team1' : 'team2'] % teamUsers.length]?.id;

          room.currentTurn = {
            team: nextTeam,
            actorId: nextActorId || null,
            startTime: null,
            endTime: null,
            currentNameId: null,
            guessedNames: [],
            isActive: false,
          };
        }
        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Handle user disconnect (optional: remove from room, handle host migration)
      for (const [roomId, room] of rooms.entries()) {
        const userIndex = room.users.findIndex(u => u.id === socket.id);
        if (userIndex !== -1) {
          const user = room.users[userIndex];
          // If they were the actor and active, end their turn
          if (room.currentTurn?.actorId === socket.id && room.currentTurn.isActive) {
             if (room.currentTurn.currentNameId) {
               room.bowl.push(room.currentTurn.currentNameId);
               room.currentTurn.currentNameId = null;
             }
             endTurn(room);
          }
          
          // Remove user
          room.users.splice(userIndex, 1);
          
          // If room empty, delete
          if (room.users.length === 0) {
            rooms.delete(roomId);
          } else {
            // If host left, assign new host
            if (user.isHost) {
              room.users[0].isHost = true;
            }
            io.to(roomId).emit("room_update", room);
          }
        }
      }
    });
  });

  function endTurn(room: RoomState) {
    if (!room.currentTurn) return;

    room.currentTurn.isActive = false;
    
    // Check if round is over
    if (room.bowl.length === 0 && !room.currentTurn.currentNameId) {
      room.status = "round_end";
      room.roundScores.push({ team1: room.scores.team1, team2: room.scores.team2 });
    } else {
      // Setup next turn
      const nextTeam = room.currentTurn.team === 1 ? 2 : 1;
      
      // Advance turn index for the team that just went
      if (room.currentTurn.team === 1) {
        room.turnIndex.team1++;
      } else {
        room.turnIndex.team2++;
      }

      const teamUsers = room.users.filter(u => u.team === nextTeam);
      const nextActorId = teamUsers[room.turnIndex[nextTeam === 1 ? 'team1' : 'team2'] % teamUsers.length]?.id;

      room.currentTurn = {
        team: nextTeam,
        actorId: nextActorId || null,
        startTime: null,
        endTime: null,
        currentNameId: null,
        guessedNames: [],
        isActive: false,
      };
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
