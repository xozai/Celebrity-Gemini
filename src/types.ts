export type User = {
  id: string;
  name: string;
  team: 1 | 2 | null;
  isHost: boolean;
  ready: boolean;
};

export type Name = {
  id: string;
  text: string;
  submittedBy: string;
};

export type RoomState = {
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
