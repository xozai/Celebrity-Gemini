import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { RoomState, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

export function Playing({
  room,
  user,
  socket,
}: {
  room: RoomState;
  user: User;
  socket: Socket;
}) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!room.currentTurn?.isActive || !room.currentTurn.endTime) {
      setTimeLeft(60);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(
        0,
        Math.ceil((room.currentTurn!.endTime! - now) / 1000)
      );
      setTimeLeft(remaining);

      if (remaining === 0 && room.currentTurn?.actorId === user.id) {
        socket.emit("end_turn", { roomId: room.id });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [room.currentTurn?.isActive, room.currentTurn?.endTime, user.id, room.id, socket]);

  const handleStartTurn = () => {
    socket.emit("start_turn", { roomId: room.id });
  };

  const handleNextName = (guessed: boolean) => {
    socket.emit("next_name", { roomId: room.id, guessed });
  };

  const handleEndTurn = () => {
    socket.emit("end_turn", { roomId: room.id });
  };

  const isMyTurn = room.currentTurn?.actorId === user.id;
  const isMyTeamTurn = room.currentTurn?.team === user.team;
  const actor = room.users.find((u) => u.id === room.currentTurn?.actorId);
  const currentName = room.names.find(
    (n) => n.id === room.currentTurn?.currentNameId
  );

  const getRoundDescription = (round: number) => {
    switch (round) {
      case 1:
        return "Say anything except the name!";
      case 2:
        return "Say only ONE word!";
      case 3:
        return "Charades! No words or sounds!";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-6 pt-12"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-2">
            Round {room.currentRound}
          </h2>
          <div className="text-2xl font-bold text-stone-900">
            {getRoundDescription(room.currentRound)}
          </div>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 flex gap-8">
          <div className="text-center">
            <div className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-1">
              Team 1
            </div>
            <div className="text-3xl font-bold text-stone-900">
              {room.scores.team1}
            </div>
          </div>
          <div className="w-px bg-stone-200"></div>
          <div className="text-center">
            <div className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-1">
              Team 2
            </div>
            <div className="text-3xl font-bold text-stone-900">
              {room.scores.team2}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Bowl Status */}
        <div className="absolute top-6 right-6 bg-stone-100 px-4 py-2 rounded-full text-sm font-bold text-stone-600 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {room.bowl.length} left
        </div>

        {!room.currentTurn?.isActive ? (
          <div className="text-center">
            <h3 className="text-3xl font-bold text-stone-900 mb-4">
              {isMyTurn ? "It's your turn!" : `${actor?.name}'s turn`}
            </h3>
            <p className="text-stone-500 mb-8 text-lg">
              {isMyTurn
                ? "Get ready to make your team guess!"
                : isMyTeamTurn
                ? "Get ready to guess!"
                : "Watch the other team play."}
            </p>
            {isMyTurn && (
              <button
                onClick={handleStartTurn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 rounded-2xl font-bold text-2xl shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                Start Timer
              </button>
            )}
          </div>
        ) : (
          <div className="text-center w-full max-w-2xl">
            {/* Timer */}
            <div className="mb-12">
              <div
                className={`text-8xl font-mono font-bold tracking-tighter ${
                  timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-stone-900"
                }`}
              >
                {timeLeft}
              </div>
            </div>

            {isMyTurn ? (
              <div className="space-y-12">
                <div className="bg-stone-50 border-2 border-stone-200 p-12 rounded-3xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentName?.id || "empty"}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="text-5xl font-bold text-stone-900"
                    >
                      {currentName ? currentName.text : "Bowl is empty!"}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {currentName && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleNextName(false)}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-800 py-6 rounded-2xl font-bold text-xl transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleNextName(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-bold text-xl transition-colors shadow-sm"
                    >
                      Got It!
                    </button>
                  </div>
                )}
                <div className="pt-8">
                  <button
                    onClick={handleEndTurn}
                    className="text-stone-400 hover:text-stone-600 font-medium underline underline-offset-4"
                  >
                    End Turn Early
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-medium text-stone-600 mb-8">
                  {isMyTeamTurn ? "Guess the word!" : "Shhh... other team is playing"}
                </div>
                <div className="flex justify-center gap-4">
                  <div className="bg-stone-100 px-6 py-3 rounded-xl font-bold text-stone-500">
                    {room.currentTurn.guessedNames.length} Guessed
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
