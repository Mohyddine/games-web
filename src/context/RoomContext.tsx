"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type {
  Room,
  BoardState,
  GameStatus,
  WinReason,
  ClientPlayerInfo,
  RematchState,
  GameType,
  RpsChoice,
  RpsState,
} from "@/types/game";
import { api, ApiClientError } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useSession } from "./SessionContext";

interface RoomContextValue {
  // Authoritative State
  room: Room | null;
  gameType: GameType | null;
  board: BoardState;
  gameStatus: GameStatus | null;
  players: ClientPlayerInfo[];
  currentTurn: string | null;
  winner: string | "DRAW" | null;
  winReason: WinReason | null;
  turnTimeRemaining: number;
  countdown: number | null;
  rematch: RematchState | null;
  rps: RpsState | null;
  isSocketConnected: boolean;
  isOpponentConnected: boolean;
  opponentDisconnectedMessage: string | null;

  // Rematch Notification States
  rematchRequestedBy: string | null;
  rematchExpiresInMs: number | null;
  rematchFeedbackMessage: string | null;

  // Loading & Error States
  isLoadingRoom: boolean;
  error: string | null;

  // Actions
  createRoom: (gameType: GameType, rounds?: number) => Promise<string | null>;
  joinRoom: (code: string) => Promise<Room | null>;
  leaveRoom: () => Promise<boolean>;
  restoreRoom: () => Promise<Room | null>;
  makeMove: (cellIndex: number) => void;
  submitRpsChoice: (choice: RpsChoice) => void;
  requestRematch: () => void;
  acceptRematch: () => void;
  declineRematch: () => void;
  clearRematchFeedback: () => void;
  clearError: () => void;
  setRoom: (room: Room | null) => void;
}

const DEFAULT_BOARD: BoardState = [
  null, null, null,
  null, null, null,
  null, null, null,
];

const EMPTY_RPS_STATE: RpsState = {
  totalRounds: 1,
  currentRound: 1,
  myChoice: null,
  opponentChoice: null,
  opponentHasChosen: false,
  acceptingChoices: true,
  scores: {},
  stats: {},
  roundResult: null,
  matchWinnerPlayerId: null,
  roundHistory: [],
};

const RoomContext = createContext<RoomContextValue | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    playerId,
    name,
    isInitialized,
    isLoading: isSessionLoading,
    initSession,
  } = useSession();

  // Authoritative State
  const [room, setRoom] = useState<Room | null>(null);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [board, setBoard] = useState<BoardState>(DEFAULT_BOARD);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [players, setPlayers] = useState<ClientPlayerInfo[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | "DRAW" | null>(null);
  const [winReason, setWinReason] = useState<WinReason | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(30);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [rematch, setRematch] = useState<RematchState | null>(null);
  const [rps, setRps] = useState<RpsState | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [isOpponentConnected, setIsOpponentConnected] = useState<boolean>(true);
  const [opponentDisconnectedMessage, setOpponentDisconnectedMessage] = useState<string | null>(null);

  // Rematch Event States
  const [rematchRequestedBy, setRematchRequestedBy] = useState<string | null>(null);
  const [rematchExpiresInMs, setRematchExpiresInMs] = useState<number | null>(null);
  const [rematchFeedbackMessage, setRematchFeedbackMessage] = useState<string | null>(null);

  // Loading & Errors
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to access current room code synchronously in socket events
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearRematchFeedback = useCallback(() => {
    setRematchFeedbackMessage(null);
  }, []);

  // Sync state helper from a Room object
  const syncFromRoom = useCallback((r: Room | null) => {
    setRoom(r);
    setGameType(r?.gameType ?? null);
    if (r) {
      setBoard(r.board || DEFAULT_BOARD);
      setGameStatus(r.gameStatus);
      setWinner(r.winnerPlayerId || null);
      setWinReason(r.winReason || null);
      setCurrentTurn(r.currentTurn);
      setTurnTimeRemaining(r.turnTimeRemaining ?? 30);
      setRematch(r.rematch || null);
      setRps((prev) => (r.gameType === "ROCK_PAPER_SCISSORS" ? prev ?? EMPTY_RPS_STATE : null));

      if (r.rematch) {
        setRematchRequestedBy(r.rematch.requestedBy);
      } else if (r.gameStatus !== "REMATCH_PENDING") {
        setRematchRequestedBy(null);
        setRematchExpiresInMs(null);
      }

      // Convert RoomPlayer[] to ClientPlayerInfo[]
      const clientPlayers: ClientPlayerInfo[] = r.players.map((p) => ({
        playerId: p.playerId,
        name: p.displayName || p.name,
        symbol: p.symbol,
        isConnected: p.connected,
        isMyTurn: r.gameStatus === "PLAYING" && r.currentTurn === p.playerId,
      }));
      setPlayers(clientPlayers);

      // Opponent connection status
      const opp = r.players.find((p) => p.playerId !== playerId);
      if (opp) {
        setIsOpponentConnected(opp.connected);
        if (!opp.connected && (r.gameStatus === "COUNTDOWN" || r.gameStatus === "PLAYING")) {
          setOpponentDisconnectedMessage("Opponent disconnected. Waiting for reconnection...");
        } else {
          setOpponentDisconnectedMessage(null);
        }
      }
    } else {
      setBoard(DEFAULT_BOARD);
      setGameStatus(null);
      setPlayers([]);
      setCurrentTurn(null);
      setWinner(null);
      setWinReason(null);
      setTurnTimeRemaining(30);
      setCountdown(null);
      setRematch(null);
      setRps(null);
      setRematchRequestedBy(null);
      setRematchExpiresInMs(null);
      setIsOpponentConnected(true);
      setOpponentDisconnectedMessage(null);
    }
  }, [playerId]);

  // Restore active room from backend authoritatively via REST
  const restoreRoom = useCallback(async (): Promise<Room | null> => {
    setIsLoadingRoom(true);
    setError(null);
    try {
      const activeRoom = await api.getCurrentRoom();
      syncFromRoom(activeRoom);
      return activeRoom;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to restore game room.");
      }
      return null;
    } finally {
      setIsLoadingRoom(false);
    }
  }, [syncFromRoom]);

  // Create room flow: POST /api/v1/rooms then sync
  const createRoom = useCallback(async (selectedGameType: GameType, rounds?: number): Promise<string | null> => {
    setIsLoadingRoom(true);
    setError(null);
    try {
      let createData;
      try {
        createData = await api.createRoom(selectedGameType, rounds);
      } catch (err) {
        if (
          err instanceof ApiClientError &&
          err.errorCode === "UNAUTHORIZED" &&
          name?.trim()
        ) {
          const sessionRestored = await initSession(name);
          if (!sessionRestored) {
            throw err;
          }
          createData = await api.createRoom(selectedGameType, rounds);
        } else {
          throw err;
        }
      }
      const roomDetails = await api.getCurrentRoom();
      if (roomDetails) {
        syncFromRoom(roomDetails);
      } else {
        syncFromRoom({
          code: createData.code,
          gameType: createData.gameType,
          players: [],
          gameStatus: createData.gameStatus,
          createdAt: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000,
          board: DEFAULT_BOARD,
          currentTurn: null,
          turnTimeRemaining: 30,
          rematch: null,
        });
      }
      return createData.code;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while creating the room.");
      }
      return null;
    } finally {
      setIsLoadingRoom(false);
    }
  }, [initSession, name, syncFromRoom]);

  // Join room flow: POST /api/v1/rooms/:code/join
  const joinRoom = useCallback(async (code: string): Promise<Room | null> => {
    setIsLoadingRoom(true);
    setError(null);
    try {
      const joinedRoom = await api.joinRoom(code);
      syncFromRoom(joinedRoom);
      return joinedRoom;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while joining the room.");
      }
      return null;
    } finally {
      setIsLoadingRoom(false);
    }
  }, [syncFromRoom]);

  // Leave room flow: DELETE /api/v1/rooms/current
  const leaveRoom = useCallback(async (): Promise<boolean> => {
    setIsLoadingRoom(true);
    setError(null);
    try {
      await api.leaveCurrentRoom();
      syncFromRoom(null);
      return true;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to leave the room.");
      }
      return false;
    } finally {
      setIsLoadingRoom(false);
    }
  }, [syncFromRoom]);

  // Make move flow: client emits game:move
  const makeMove = useCallback((cellIndex: number) => {
    if (typeof cellIndex !== "number" || cellIndex < 0 || cellIndex > 8) return;
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("game:move", { cellIndex });
    }
  }, []);

  const submitRpsChoice = useCallback((choice: RpsChoice) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("game:rps:submit", { choice });
      setRps((prev) => ({
        ...(prev ?? EMPTY_RPS_STATE),
        myChoice: choice,
        opponentChoice: prev?.opponentChoice ?? null,
        opponentHasChosen: prev?.opponentHasChosen ?? false,
      }));
    }
  }, []);

  // Rematch actions
  const requestRematchAction = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("rematch:request");
    }
  }, []);

  const acceptRematchAction = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("rematch:accept");
    }
  }, []);

  const declineRematchAction = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("rematch:decline");
    }
  }, []);

  // REST restoration on session init
  useEffect(() => {
    let isMounted = true;
    if (isInitialized && !isSessionLoading) {
      (async () => {
        setIsLoadingRoom(true);
        try {
          const activeRoom = await api.getCurrentRoom();
          if (isMounted) {
            syncFromRoom(activeRoom);
          }
        } catch (err) {
          if (isMounted) {
            if (err instanceof ApiClientError) {
              setError(err.message);
            } else {
              setError("Failed to restore game room.");
            }
          }
        } finally {
          if (isMounted) {
            setIsLoadingRoom(false);
          }
        }
      })();
    } else if (!isInitialized && !isSessionLoading) {
      queueMicrotask(() => {
        if (isMounted) {
          syncFromRoom(null);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isInitialized, isSessionLoading, syncFromRoom]);

  // Socket.IO lifecycle & Real-Time Event Handlers
  useEffect(() => {
    if (!isInitialized || isSessionLoading) {
      return;
    }

    const socket = getSocket();

    const onConnect = () => {
      setIsSocketConnected(true);
      // If we have an active room code, associate socket with room:join
      const currentCode = roomRef.current?.code;
      if (currentCode) {
        socket.emit("room:join", { code: currentCode });
      }
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
    };

    const onConnectError = () => {
      setIsSocketConnected(false);
    };

    const onRoomJoined = (payload: { room: Room }) => {
      syncFromRoom(payload.room);
    };

    const onRoomUpdated = (payload: { room: Room }) => {
      syncFromRoom(payload.room);
    };

    const onRoomExpired = (payload: { code: string; message: string }) => {
      syncFromRoom(null);
      setError(payload.message || "Room expired due to inactivity.");
    };

    const onGameCountdown = (payload: { count: number }) => {
      setCountdown(payload.count);
      setGameStatus("COUNTDOWN");
      setRematch(null);
      setRematchRequestedBy(null);
      setRematchExpiresInMs(null);
    };

    const onGameState = (payload: {
      code: string;
      gameType: GameType;
      gameStatus: GameStatus;
      board: BoardState;
      players: ClientPlayerInfo[];
      currentTurn: string | null;
      winner: string | "DRAW" | null;
      turnTimeRemaining: number;
      connectionState: { allConnected: boolean };
      rematch: { requestedBy: string; expiresAt: number } | null;
      rps?: RpsState | null;
    }) => {
      setCountdown(null);
      setGameType(payload.gameType);
      setBoard(payload.board);
      setGameStatus(payload.gameStatus);
      setPlayers(payload.players);
      setCurrentTurn(payload.currentTurn);
      setWinner(payload.winner);
      setTurnTimeRemaining(payload.turnTimeRemaining);
      setRps(payload.rps ?? null);

      if (payload.rematch) {
        setRematch({
          requestedBy: payload.rematch.requestedBy,
          requestedAt: Date.now(),
          expiresAt: payload.rematch.expiresAt,
        });
        setRematchRequestedBy(payload.rematch.requestedBy);
      } else if (payload.gameStatus !== "REMATCH_PENDING") {
        setRematch(null);
        setRematchRequestedBy(null);
        setRematchExpiresInMs(null);
      }

      // Check if opponent is connected
      const opp = payload.players.find((p) => p.playerId !== playerId);
      if (opp) {
        setIsOpponentConnected(opp.isConnected);
        if (!opp.isConnected && payload.gameStatus === "PLAYING") {
          setOpponentDisconnectedMessage("Opponent disconnected. Waiting for reconnection...");
        } else {
          setOpponentDisconnectedMessage(null);
        }
      }

      // Update parent room state object
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gameType: payload.gameType,
          board: payload.board,
          gameStatus: payload.gameStatus,
          currentTurn: payload.currentTurn,
          winnerPlayerId: payload.winner,
          turnTimeRemaining: payload.turnTimeRemaining,
          rematch: payload.rematch
            ? {
                requestedBy: payload.rematch.requestedBy,
                requestedAt: Date.now(),
                expiresAt: payload.rematch.expiresAt,
              }
            : null,
        };
      });
    };

    const onGameFinished = (payload: {
      winner: string | "DRAW" | null;
      winReason: WinReason;
      room: Room;
    }) => {
      setWinner(payload.winner);
      setWinReason(payload.winReason);
      setGameStatus("FINISHED");
      syncFromRoom(payload.room);
      setOpponentDisconnectedMessage(null);
    };

    const onPlayerConnected = (payload: { playerId: string; name: string }) => {
      if (payload.playerId !== playerId) {
        setIsOpponentConnected(true);
        setOpponentDisconnectedMessage(null);
        setRematchFeedbackMessage(`${payload.name} reconnected.`);
      }
      setPlayers((prev) =>
        prev.map((p) => (p.playerId === payload.playerId ? { ...p, isConnected: true } : p))
      );
    };

    const onPlayerDisconnected = (payload: { playerId: string; name: string }) => {
      if (payload.playerId !== playerId) {
        setIsOpponentConnected(false);
        setOpponentDisconnectedMessage("Opponent disconnected. Waiting for reconnection...");
      }
      setPlayers((prev) =>
        prev.map((p) => (p.playerId === payload.playerId ? { ...p, isConnected: false } : p))
      );
    };

    const onPlayerLeft = (payload: {
      playerId: string;
      winnerPlayerId?: string | "DRAW" | null;
      winReason?: WinReason | null;
      room?: Room;
      roomDeleted?: boolean;
    }) => {
      if (payload.roomDeleted) {
        syncFromRoom(null);
        setError("Opponent left. Match ended and room was closed.");
      } else if (payload.room) {
        syncFromRoom(payload.room);
      } else if (payload.winnerPlayerId) {
        setWinner(payload.winnerPlayerId);
        setWinReason(payload.winReason || "ABANDONMENT");
        setGameStatus("FINISHED");
      }
      setOpponentDisconnectedMessage(null);
    };

    // Rematch Event Listeners
    const onRematchRequested = (payload: { requestedBy: string; expiresInMs: number }) => {
      setGameStatus("REMATCH_PENDING");
      setRematchRequestedBy(payload.requestedBy);
      setRematchExpiresInMs(payload.expiresInMs);
      setRematch({
        requestedBy: payload.requestedBy,
        requestedAt: Date.now(),
        expiresAt: Date.now() + payload.expiresInMs,
      });
    };

    const onRematchAccepted = () => {
      setRematchRequestedBy(null);
      setRematchExpiresInMs(null);
      setRematch(null);
      setRematchFeedbackMessage("Rematch accepted! Starting new match...");
    };

    const onRematchDeclined = () => {
      syncFromRoom(null);
      setError("Rematch was declined. Room has been closed.");
    };

    const onRematchExpired = () => {
      syncFromRoom(null);
      setError("Rematch request expired. Room has been closed.");
    };

    // Register listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:joined", onRoomJoined);
    socket.on("room:updated", onRoomUpdated);
    socket.on("room:expired", onRoomExpired);
    socket.on("game:countdown", onGameCountdown);
    socket.on("game:state", onGameState);
    socket.on("game:finished", onGameFinished);
    socket.on("player:connected", onPlayerConnected);
    socket.on("player:disconnected", onPlayerDisconnected);
    socket.on("player:left", onPlayerLeft);
    socket.on("rematch:requested", onRematchRequested);
    socket.on("rematch:accepted", onRematchAccepted);
    socket.on("rematch:declined", onRematchDeclined);
    socket.on("rematch:expired", onRematchExpired);

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    } else {
      setIsSocketConnected(true);
      if (roomRef.current?.code) {
        socket.emit("room:join", { code: roomRef.current.code });
      }
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room:joined", onRoomJoined);
      socket.off("room:updated", onRoomUpdated);
      socket.off("room:expired", onRoomExpired);
      socket.off("game:countdown", onGameCountdown);
      socket.off("game:state", onGameState);
      socket.off("game:finished", onGameFinished);
      socket.off("player:connected", onPlayerConnected);
      socket.off("player:disconnected", onPlayerDisconnected);
      socket.off("player:left", onPlayerLeft);
      socket.off("rematch:requested", onRematchRequested);
      socket.off("rematch:accepted", onRematchAccepted);
      socket.off("rematch:declined", onRematchDeclined);
      socket.off("rematch:expired", onRematchExpired);
    };
  }, [isInitialized, isSessionLoading, playerId, syncFromRoom]);

  // When room changes or is restored, emit room:join if socket is already connected
  useEffect(() => {
    const socket = getSocket();
    if (socket.connected && room?.code) {
      socket.emit("room:join", { code: room.code });
    }
  }, [room?.code]);

  return (
    <RoomContext.Provider
      value={{
        room,
        gameType,
        board,
        gameStatus,
        players,
        currentTurn,
        winner,
        winReason,
        turnTimeRemaining,
        countdown,
        rematch,
        rps,
        isSocketConnected,
        isOpponentConnected,
        opponentDisconnectedMessage,
        rematchRequestedBy,
        rematchExpiresInMs,
        rematchFeedbackMessage,
        isLoadingRoom,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        restoreRoom,
        makeMove,
        submitRpsChoice,
        requestRematch: requestRematchAction,
        acceptRematch: acceptRematchAction,
        declineRematch: declineRematchAction,
        clearRematchFeedback,
        clearError,
        setRoom: syncFromRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = (): RoomContextValue => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
