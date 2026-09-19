import type {
  ApiResponse,
  ApiSuccessResponse,
  SessionData,
  CreateRoomData,
  LeaveRoomData,
} from "@/types/api";
import type { GameType, Room } from "@/types/game";
import { API_BASE_URL } from "@/lib/config";

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string | null;

  constructor(statusCode: number, message: string, errorCode: string | null = null) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiClientError(
      0,
      "Unable to connect to the game server. Please check your connection.",
      "NETWORK_ERROR"
    );
  }

  let envelope: ApiResponse<T>;
  try {
    envelope = await res.json();
  } catch {
    throw new ApiClientError(
      res.status,
      res.statusText || "Unexpected response from server.",
      "UNEXPECTED_RESPONSE"
    );
  }

  if (!envelope.success || res.status >= 400) {
    throw new ApiClientError(
      envelope.status_code || res.status,
      envelope.message || "An unexpected error occurred.",
      envelope.error_code || null
    );
  }

  return (envelope as ApiSuccessResponse<T>).data;
}

export const api = {
  // Session: Create or restore session
  createOrRestoreSession: async (name?: string): Promise<SessionData> => {
    const body = name?.trim() ? JSON.stringify({ name: name.trim() }) : undefined;
    return request<SessionData>("/api/v1/session", {
      method: "POST",
      body,
    });
  },

  // Room: Create a new room
  createRoom: async (gameType: GameType, rounds?: number): Promise<CreateRoomData> => {
    const payload: { gameType: GameType; rounds?: number } = { gameType };
    if (gameType === "ROCK_PAPER_SCISSORS" && Number.isInteger(rounds)) {
      payload.rounds = rounds;
    }

    return request<CreateRoomData>("/api/v1/rooms", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Room: Join an existing room
  joinRoom: async (code: string): Promise<Room> => {
    const sanitizedCode = encodeURIComponent(code.trim().toUpperCase());
    return request<Room>(`/api/v1/rooms/${sanitizedCode}/join`, {
      method: "POST",
    });
  },

  // Room: Get current active room (returns null if 404 NOT_IN_ROOM)
  getCurrentRoom: async (): Promise<Room | null> => {
    try {
      return await request<Room>("/api/v1/rooms/current", {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiClientError && (err.statusCode === 404 || err.errorCode === "NOT_IN_ROOM")) {
        return null;
      }
      throw err;
    }
  },

  // Room: Leave current active room
  leaveCurrentRoom: async (): Promise<LeaveRoomData> => {
    return request<LeaveRoomData>("/api/v1/rooms/current", {
      method: "DELETE",
    });
  },
};
