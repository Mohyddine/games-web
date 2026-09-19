import type { GameStatus, GameType } from "./game";

export interface ApiSuccessResponse<T> {
  success: true;
  status_code: number;
  message: string;
  error: false;
  error_code: null;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  status_code: number;
  message: string;
  error: true;
  error_code: string;
  data: null;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface SessionData {
  playerId: string;
  name: string;
}

export interface CreateRoomData {
  code: string;
  gameType: GameType;
  gameStatus: GameStatus;
  totalRounds?: number | null;
}

export interface LeaveRoomData {
  left: boolean;
  roomDeleted: boolean;
}
