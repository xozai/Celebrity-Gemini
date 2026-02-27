import { Socket } from "socket.io-client";
import { RoomState, User } from "../types";
import { motion } from "motion/react";

export function Lobby({
  room,
  user,
  socket,
}: {
  room: RoomState;
  user: User;
  socket: Socket;
}) {
  const handleJoinTeam = (team: 1 | 2) => {
    socket.emit("join_team", { roomId: room.id, team });
  };

  const handleStartSubmitting = () => {
    socket.emit("start_submitting", { roomId: room.id });
  };

  const team1 = room.users.filter((u) => u.team === 1);
  const team2 = room.users.filter((u) => u.team === 2);
  const unassigned = room.users.filter((u) => !u.team);

  const canStart =
    user.isHost &&
    team1.length > 0 &&
    team2.length > 0 &&
    unassigned.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-6 pt-12"
    >
      <div className="text-center mb-12">
        <h2 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-2">
          Room Code
        </h2>
        <div className="text-6xl font-mono font-bold tracking-widest text-stone-900 bg-white inline-block px-8 py-4 rounded-2xl shadow-sm border border-stone-200">
          {room.id}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Team 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-emerald-600">Team 1</h3>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
              {team1.length} players
            </span>
          </div>
          <div className="space-y-2 mb-6 min-h-[100px]">
            {team1.map((u) => (
              <div
                key={u.id}
                className="px-4 py-3 bg-stone-50 rounded-xl flex items-center justify-between"
              >
                <span className="font-medium">
                  {u.name} {u.id === user.id ? "(You)" : ""}
                </span>
                {u.isHost && (
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => handleJoinTeam(1)}
            disabled={user.team === 1}
            className="w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          >
            {user.team === 1 ? "Joined Team 1" : "Join Team 1"}
          </button>
        </div>

        {/* Team 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-indigo-600">Team 2</h3>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
              {team2.length} players
            </span>
          </div>
          <div className="space-y-2 mb-6 min-h-[100px]">
            {team2.map((u) => (
              <div
                key={u.id}
                className="px-4 py-3 bg-stone-50 rounded-xl flex items-center justify-between"
              >
                <span className="font-medium">
                  {u.name} {u.id === user.id ? "(You)" : ""}
                </span>
                {u.isHost && (
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => handleJoinTeam(2)}
            disabled={user.team === 2}
            className="w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          >
            {user.team === 2 ? "Joined Team 2" : "Join Team 2"}
          </button>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="text-center mb-12">
          <h4 className="text-sm font-bold tracking-widest text-stone-500 uppercase mb-4">
            Unassigned Players
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            {unassigned.map((u) => (
              <span
                key={u.id}
                className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium"
              >
                {u.name} {u.id === user.id ? "(You)" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {user.isHost ? (
        <div className="text-center">
          <button
            onClick={handleStartSubmitting}
            disabled={!canStart}
            className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Start Game
          </button>
          {!canStart && (
            <p className="text-stone-500 mt-4 text-sm">
              All players must join a team to start.
            </p>
          )}
        </div>
      ) : (
        <div className="text-center text-stone-500 font-medium animate-pulse">
          Waiting for host to start...
        </div>
      )}
    </motion.div>
  );
}
