import { useState } from "react";
import { Socket } from "socket.io-client";
import { RoomState, User } from "../types";
import { motion } from "motion/react";

export function Submitting({
  room,
  user,
  socket,
}: {
  room: RoomState;
  user: User;
  socket: Socket;
}) {
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names.some((n) => !n.trim())) return;
    socket.emit("submit_names", { roomId: room.id, names });
    setSubmitted(true);
  };

  const handleStartGame = () => {
    socket.emit("start_game", { roomId: room.id });
  };

  const allReady = room.users.every((u) => u.ready);
  const readyCount = room.users.filter((u) => u.ready).length;
  const totalUsers = room.users.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto p-6 pt-12"
    >
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <h2 className="text-3xl font-bold text-center mb-2 text-stone-900 tracking-tight">
          Submit Names
        </h2>
        <p className="text-center text-stone-500 mb-8">
          Write 3 names of celebrities, characters, or famous people.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {names.map((name, index) => (
              <div key={index}>
                <label className="block text-sm font-bold tracking-widest text-stone-500 uppercase mb-2">
                  Name {index + 1}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg"
                  placeholder={`e.g. Steve Jobs`}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={names.some((n) => !n.trim())}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-8"
            >
              Submit Names
            </button>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-2">
              Names Submitted!
            </h3>
            <p className="text-stone-500 mb-8">
              Waiting for others to finish...
            </p>

            <div className="bg-stone-50 rounded-2xl p-6 mb-8">
              <div className="text-4xl font-bold text-stone-900 mb-2">
                {readyCount} / {totalUsers}
              </div>
              <div className="text-sm font-bold tracking-widest text-stone-500 uppercase">
                Players Ready
              </div>
            </div>

            {user.isHost && (
              <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Start Playing
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
