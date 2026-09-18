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

export interface RpsState {
  myChoice: RpsChoice | null;
  opponentChoice: RpsChoice | null;
  opponentHasChosen: boolean;
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
