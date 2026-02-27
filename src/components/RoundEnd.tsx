import { Socket } from "socket.io-client";
import { RoomState, User } from "../types";
import { motion } from "motion/react";

export function RoundEnd({
  room,
  user,
  socket,
}: {
  room: RoomState;
  user: User;
  socket: Socket;
}) {
  const handleNextRound = () => {
    socket.emit("next_round", { roomId: room.id });
  };

  const isGameOver = room.currentRound === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto p-6 pt-12"
    >
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 text-center">
        <h2 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-2">
          Round {room.currentRound} Complete
        </h2>
        <div className="text-4xl font-bold text-stone-900 mb-12">
          The bowl is empty!
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <div className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-2">
              Team 1
            </div>
            <div className="text-5xl font-bold text-emerald-700">
              {room.scores.team1}
            </div>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <div className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-2">
              Team 2
            </div>
            <div className="text-5xl font-bold text-indigo-700">
              {room.scores.team2}
            </div>
          </div>
        </div>

        {user.isHost ? (
          <button
            onClick={handleNextRound}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-sm text-lg"
          >
            {isGameOver ? "See Final Results" : "Start Next Round"}
          </button>
        ) : (
          <div className="text-stone-500 font-medium animate-pulse">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </motion.div>
  );
}
