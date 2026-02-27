import { Socket } from "socket.io-client";
import { RoomState, User } from "../types";
import { motion } from "motion/react";

export function GameOver({
  room,
  user,
  socket,
}: {
  room: RoomState;
  user: User;
  socket: Socket;
}) {
  const team1Score = room.scores.team1;
  const team2Score = room.scores.team2;

  let winnerText = "It's a Tie!";
  let winnerColor = "text-stone-900";
  let winnerBg = "bg-stone-100";

  if (team1Score > team2Score) {
    winnerText = "Team 1 Wins!";
    winnerColor = "text-emerald-700";
    winnerBg = "bg-emerald-50 border-emerald-200";
  } else if (team2Score > team1Score) {
    winnerText = "Team 2 Wins!";
    winnerColor = "text-indigo-700";
    winnerBg = "bg-indigo-50 border-indigo-200";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto p-6 pt-12"
    >
      <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-stone-200 text-center relative overflow-hidden">
        {/* Confetti-like background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>

        <h2 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-4 relative z-10">
          Game Over
        </h2>
        
        <div className={`inline-block px-12 py-6 rounded-3xl border mb-16 relative z-10 ${winnerBg}`}>
          <div className={`text-6xl font-bold ${winnerColor}`}>
            {winnerText}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 relative z-10">
          <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200">
            <div className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-4">
              Team 1
            </div>
            <div className="text-7xl font-bold text-stone-900 mb-6">
              {team1Score}
            </div>
            <div className="space-y-2 text-stone-500 font-medium">
              <div>Round 1: {room.roundScores[0]?.team1 || 0}</div>
              <div>Round 2: {room.roundScores[1]?.team1 || 0}</div>
              <div>Round 3: {room.roundScores[2]?.team1 || 0}</div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200">
            <div className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-4">
              Team 2
            </div>
            <div className="text-7xl font-bold text-stone-900 mb-6">
              {team2Score}
            </div>
            <div className="space-y-2 text-stone-500 font-medium">
              <div>Round 1: {room.roundScores[0]?.team2 || 0}</div>
              <div>Round 2: {room.roundScores[1]?.team2 || 0}</div>
              <div>Round 3: {room.roundScores[2]?.team2 || 0}</div>
            </div>
          </div>
        </div>

        <div className="mt-16 relative z-10">
          <button
            onClick={() => window.location.reload()}
            className="text-stone-500 hover:text-stone-900 font-bold underline underline-offset-8 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
