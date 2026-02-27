import { useEffect, useState } from "react";
import { SocketProvider, useSocket } from "./SocketContext";
import { RoomState, User } from "./types";
import { Lobby } from "./components/Lobby";
import { Submitting } from "./components/Submitting";
import { Playing } from "./components/Playing";
import { RoundEnd } from "./components/RoundEnd";
import { GameOver } from "./components/GameOver";
import { motion, AnimatePresence } from "motion/react";

function GameApp() {
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("room_update", (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      const updatedUser = updatedRoom.users.find((u) => u.id === socket.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
    });

    return () => {
      socket.off("room_update");
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }
    socket?.emit("create_room", { userName }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
        setUser(response.user);
        setError("");
      } else {
        setError(response.error);
      }
    });
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!joinRoomId.trim()) {
      setError("Please enter a room code");
      return;
    }
    socket?.emit(
      "join_room",
      { roomId: joinRoomId.toUpperCase(), userName },
      (response: any) => {
        if (response.success) {
          setRoom(response.room);
          setUser(response.user);
          setError("");
        } else {
          setError(response.error);
        }
      }
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-pulse text-stone-500 font-medium">
          Connecting to server...
        </div>
      </div>
    );
  }

  if (!room || !user) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-stone-200"
        >
          <h1 className="text-4xl font-bold text-center mb-8 text-stone-900 tracking-tight">
            Celebrity
          </h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={handleCreateRoom}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-4"
              >
                Create New Game
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-stone-400 text-sm">
                  or join existing
                </span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all uppercase"
                  placeholder="Room Code"
                  maxLength={6}
                />
                <button
                  onClick={handleJoinRoom}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans">
      <AnimatePresence mode="wait">
        {room.status === "lobby" && (
          <Lobby key="lobby" room={room} user={user} socket={socket} />
        )}
        {room.status === "submitting" && (
          <Submitting key="submitting" room={room} user={user} socket={socket} />
        )}
        {room.status === "playing" && (
          <Playing key="playing" room={room} user={user} socket={socket} />
        )}
        {room.status === "round_end" && (
          <RoundEnd key="round_end" room={room} user={user} socket={socket} />
        )}
        {room.status === "game_over" && (
          <GameOver key="game_over" room={room} user={user} socket={socket} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <GameApp />
    </SocketProvider>
  );
}
