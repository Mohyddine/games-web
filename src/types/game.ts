export type PlayerSymbol = "X" | "O";
export type GameType = "TIC_TAC_TOE" | "ROCK_PAPER_SCISSORS";
export type RpsChoice = "ROCK" | "PAPER" | "SCISSORS";

export type CellValue = PlayerSymbol | null;

export type BoardState = [
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue
];

export type GameStatus =
  | "WAITING"
  | "COUNTDOWN"
  | "PLAYING"
  | "FINISHED"
  | "REMATCH_PENDING";

export type WinReason = "NORMAL" | "ABANDONMENT" | "DRAW";

export interface Session {
  playerId: string;
  name: string;
}

export interface Player {
  playerId: string;
  name: string;
  displayName: string;
  symbol: PlayerSymbol | null;
  isCreator: boolean;
  connected: boolean;
}

export interface RematchState {
  requestedBy: string;
  requestedAt: number;
  expiresAt: number;
}

export interface RpsPlayerStats {
  roundsWon: number;
  draws: number;
  roundsPlayed: number;
}

export interface RpsRoundResult {
  winnerPlayerId: string | null;
  isDraw: boolean;
  playerChoices: Partial<Record<string, RpsChoice>>;
}

export interface RpsRoundHistoryEntry {
  round: number;
  playerChoices: Record<string, RpsChoice>;
  winnerPlayerId: string | null;
  isDraw: boolean;
}

export interface RpsState {
  totalRounds: number;
  currentRound: number;
  myChoice: RpsChoice | null;
  opponentChoice: RpsChoice | null;
  opponentHasChosen: boolean;
  acceptingChoices: boolean;
  scores: Record<string, number>;
  stats: Record<string, RpsPlayerStats>;
  roundResult: RpsRoundResult | null;
  matchWinnerPlayerId: string | "DRAW" | null;
  roundHistory: RpsRoundHistoryEntry[];
}

export interface Room {
  code: string;
  gameType: GameType;
  players: Player[];
  gameStatus: GameStatus;
  createdAt: number;
  expiresAt: number;
  winnerPlayerId?: string | "DRAW" | null;
  winReason?: WinReason | null;
  board: BoardState;
  currentTurn: string | null;
  turnTimeRemaining: number;
  rematch: RematchState | null;
  totalRounds?: number | null;
  currentRound?: number;
  playerScores?: Record<string, number>;
  rpsStats?: Record<string, RpsPlayerStats>;
  roundResult?: RpsRoundResult | null;
  rpsRoundHistory?: RpsRoundHistoryEntry[];
}

export interface ClientPlayerInfo {
  playerId: string;
  name: string;
  symbol: PlayerSymbol | null;
  isConnected: boolean;
  isMyTurn: boolean;
}

export interface ClientGameState {
  code: string;
  gameType: GameType;
  gameStatus: GameStatus;
  board: BoardState;
  players: ClientPlayerInfo[];
  currentTurn: string | null;
  winner: string | "DRAW" | null;
  turnTimeRemaining: number;
  connectionState: {
    allConnected: boolean;
  };
  rematch: RematchState | null;
  rps: RpsState | null;
}
