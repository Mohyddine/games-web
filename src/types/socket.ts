import type { Room, GameStatus, BoardState, WinReason, ClientPlayerInfo } from "./game";

// Client-to-Server Events
export interface ClientToServerEvents {
  "room:join": (payload: { code: string }) => void;
  "room:leave": () => void;
  "game:move": (payload: { cellIndex: number }) => void;
  "rematch:request": () => void;
  "rematch:accept": () => void;
  "rematch:decline": () => void;
}

// Server-to-Client Events
export interface ServerToClientEvents {
  "room:joined": (payload: { room: Room }) => void;
  "room:updated": (payload: { room: Room }) => void;
  "room:expired": (payload: { code: string; message: string }) => void;
  "game:countdown": (payload: { count: number }) => void;
  "game:state": (payload: {
    code: string;
    gameStatus: GameStatus;
    board: BoardState;
    players: ClientPlayerInfo[];
    currentTurn: string | null;
    winner: string | "DRAW" | null;
    turnTimeRemaining: number;
    connectionState: {
      allConnected: boolean;
    };
    rematch: {
      requestedBy: string;
      expiresAt: number;
    } | null;
  }) => void;
  "game:finished": (payload: {
    winner: string | "DRAW" | null;
    winReason: WinReason;
    room: Room;
  }) => void;
  "player:connected": (payload: { playerId: string; name: string }) => void;
  "player:disconnected": (payload: { playerId: string; name: string }) => void;
  "player:left": (payload: {
    playerId: string;
    winnerPlayerId?: string | "DRAW" | null;
    winReason?: WinReason | null;
    room?: Room;
    roomDeleted?: boolean;
  }) => void;
  "rematch:requested": (payload: { requestedBy: string; expiresInMs: number }) => void;
  "rematch:accepted": (payload: { acceptedBy: string }) => void;
  "rematch:declined": (payload: { declinedBy: string }) => void;
  "rematch:expired": (payload: { code: string }) => void;
}
