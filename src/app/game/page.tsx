"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Board } from "@/components/game/Board";
import { CountdownOverlay } from "@/components/game/CountdownOverlay";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { PlayerCard } from "@/components/game/PlayerCard";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import type { BoardState } from "@/types/game";

// ─── Visual-only helper to find winning cells from final board ─────────────
// This is NEVER used to determine the winner — backend is authoritative.
// Used only to highlight winning cells in the UI after backend reports FINISHED.
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getVisualWinningCells(board: BoardState): number[] {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return [];
}

// ─── Small spinner ─────────────────────────────────────────────────────────
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Copy icon ─────────────────────────────────────────────────────────────
function CopyIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export default function GamePage() {
  const router = useRouter();
  const { playerId, isInitialized, isLoading: isSessionLoading } = useSession();
  const {
    room,
    board,
    gameStatus,
    players,
    currentTurn,
    winner,
    winReason,
    turnTimeRemaining,
    countdown,
    isSocketConnected,
    isOpponentConnected,
    opponentDisconnectedMessage,
    rematchRequestedBy,
    rematchFeedbackMessage,
    isLoadingRoom,
    error,
    makeMove,
    leaveRoom,
    restoreRoom,
    requestRematch,
    acceptRematch,
    declineRematch,
    clearRematchFeedback,
    clearError,
  } = useRoom();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info" | "warning">("info");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [, startTransition] = useTransition();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isSessionLoading && !isInitialized) {
      startTransition(() => {
        router.replace("/session");
      });
    }
  }, [isInitialized, isSessionLoading, router]);

  // Restore room or redirect to /home
  useEffect(() => {
    if (isInitialized && !isSessionLoading && !room) {
      (async () => {
        const restored = await restoreRoom();
        if (!restored) {
          startTransition(() => {
            router.replace("/home");
          });
        }
      })();
    }
  }, [isInitialized, isSessionLoading, room, restoreRoom, router]);

  // If room drops back to WAITING, navigate to waiting room
  useEffect(() => {
    if (room && gameStatus === "WAITING") {
      startTransition(() => {
        router.replace("/waiting");
      });
    }
  }, [room, gameStatus, router]);

  // Error → toast; no room → redirect home
  useEffect(() => {
    if (error) {
      setToastMessage(error);
      setToastType("error");
      if (!room) {
        startTransition(() => {
          router.replace("/home");
        });
      }
    }
  }, [error, room, router]);

  // Rematch feedback toast
  useEffect(() => {
    if (rematchFeedbackMessage) {
      setToastMessage(rematchFeedbackMessage);
      setToastType("info");
      clearRematchFeedback();
    }
  }, [rematchFeedbackMessage, clearRematchFeedback]);

  // Reset rematch requesting state when backend confirms
  useEffect(() => {
    if (rematchRequestedBy === playerId) {
      setIsRequestingRematch(false);
    }
  }, [rematchRequestedBy, playerId]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameStatus !== "PLAYING") return;
      if (currentTurn !== playerId) return;
      makeMove(index);
    },
    [gameStatus, currentTurn, playerId, makeMove]
  );

  const handleCopyCode = async () => {
    if (!room?.code) return;
    try {
      await navigator.clipboard.writeText(room.code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = room.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleLeaveGame = async () => {
    setIsLeaving(true);
    const success = await leaveRoom();
    setIsLeaving(false);
    if (success) {
      startTransition(() => {
        router.replace("/home");
      });
    }
  };

  const handlePlayAgain = () => {
    setIsRequestingRematch(true);
    requestRematch();
  };

  // Loading / no room
  if (isSessionLoading || isLoadingRoom || !room) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <Spinner />
          <span>Loading match…</span>
        </div>
      </main>
    );
  }

  // ─── Derive UI state ─────────────────────────────────────────────────────
  const me = players.find((p) => p.playerId === playerId) ?? null;
  const opponent = players.find((p) => p.playerId !== playerId) ?? null;

  const isMyTurn = gameStatus === "PLAYING" && currentTurn === playerId;
  const isFinished = gameStatus === "FINISHED" || gameStatus === "REMATCH_PENDING";
  const isPlaying = gameStatus === "PLAYING";

  // Visual-only winning cells — derived from authoritative board when game is done
  const winningCells =
    isFinished && winReason !== "DRAW" ? getVisualWinningCells(board) : [];

  // Result labels
  let resultTitle = "";
  let resultSubtitle = "";
  let resultEmoji = "";
  if (isFinished) {
    if (winner === "DRAW" || winReason === "DRAW") {
      resultTitle = "It's a Draw";
      resultSubtitle = "Nobody wins this time.";
      resultEmoji = "🤝";
    } else if (winner === playerId) {
      resultTitle = "You Won";
      resultSubtitle =
        winReason === "ABANDONMENT"
          ? "Opponent left the match."
          : "Great game!";
      resultEmoji = "🏆";
    } else {
      resultTitle = "You Lost";
      resultSubtitle =
        winReason === "ABANDONMENT"
          ? "You left the match."
          : `${opponent?.name || "Opponent"} wins this round.`;
      resultEmoji = "😤";
    }
  }

  const hasRequestedRematch = rematchRequestedBy === playerId;
  const opponentRequestedRematch =
    rematchRequestedBy !== null && rematchRequestedBy !== playerId;

  // PlayerCard data
  const meCardInfo = me
    ? {
        name: me.name,
        symbol: me.symbol,
        isConnected: true,
        isYou: true,
        isActive: isMyTurn,
      }
    : null;

  const opponentCardInfo = opponent
    ? {
        name: opponent.name,
        symbol: opponent.symbol,
        isConnected: isOpponentConnected,
        isYou: false,
        isActive: isPlaying && currentTurn === opponent.playerId,
      }
    : null;

  return (
    <main className="flex-1 flex flex-col p-3 sm:p-4 min-h-screen max-w-lg mx-auto w-full">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between py-2 mb-3 border-b border-zinc-200/70 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-black text-base tracking-tight text-zinc-900 dark:text-zinc-50">
            Tic-Tac-Toe
          </span>
          {/* Room code pill */}
          <button
            onClick={handleCopyCode}
            aria-label={`Copy room code ${room.code}`}
            title="Copy room code"
            className="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {codeCopied ? (
              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
            ) : (
              <>
                <span>{room.code}</span>
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                  <CopyIcon />
                </span>
              </>
            )}
          </button>
        </div>

        {/* Socket status */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span
            className={[
              "w-2 h-2 rounded-full",
              isSocketConnected
                ? "bg-emerald-500"
                : "bg-red-500 animate-pulse",
            ].join(" ")}
            aria-label={isSocketConnected ? "Connected" : "Connecting"}
          />
          <span className="hidden sm:inline text-[11px]">
            {isSocketConnected ? "Live" : "Reconnecting…"}
          </span>
        </div>
      </header>

      {/* ── Disconnect Banner ───────────────────────────────────────────── */}
      {opponentDisconnectedMessage && !isFinished && (
        <div className="mb-3 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-medium">{opponentDisconnectedMessage}</span>
        </div>
      )}

      {/* ── Player Cards ────────────────────────────────────────────────── */}
      <div className="mb-3">
        <PlayerCard
          me={meCardInfo}
          opponent={opponentCardInfo}
          gameStatus={gameStatus}
        />
      </div>

      {/* ── Turn Indicator (during active play) ─────────────────────────── */}
      {isPlaying && (
        <div className="mb-2">
          <TurnIndicator
            isMyTurn={isMyTurn}
            opponentName={opponent?.name || "Opponent"}
            timeRemaining={turnTimeRemaining}
          />
        </div>
      )}

      {/* ── Board ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center flex-1 py-2">
        <Board
          board={board}
          disabled={!isMyTurn || isFinished || !isOpponentConnected}
          onCellClick={handleCellClick}
          mySymbol={me?.symbol}
          winningCells={winningCells}
        />
      </div>

      {/* ── Result & Rematch Section ─────────────────────────────────────── */}
      {isFinished && (
        <div className="mt-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col items-center gap-4">
          {/* Result */}
          <div className="flex flex-col items-center text-center gap-1">
            <span className="text-3xl leading-none" role="img" aria-label={resultTitle}>
              {resultEmoji}
            </span>
            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              {resultTitle}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {resultSubtitle}
            </p>
          </div>

          {/* Rematch CTA */}
          <div className="w-full flex flex-col gap-2">
            {opponentRequestedRematch ? (
              // Opponent wants a rematch
              <div className="flex flex-col gap-2.5 w-full">
                <p className="text-sm font-semibold text-center text-emerald-700 dark:text-emerald-400">
                  {opponent?.name || "Opponent"} wants to play again!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    id="accept-rematch-btn"
                    size="md"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    onClick={acceptRematch}
                  >
                    Accept
                  </Button>
                  <Button
                    id="decline-rematch-btn"
                    variant="danger"
                    size="md"
                    className="w-full"
                    onClick={declineRematch}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ) : hasRequestedRematch ? (
              // We requested a rematch, waiting
              <div className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <Spinner className="h-4 w-4" />
                <span>Waiting for opponent to accept…</span>
              </div>
            ) : (
              // Default: offer Play Again / Exit
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  id="play-again-btn"
                  size="md"
                  className="w-full"
                  isLoading={isRequestingRematch}
                  onClick={handlePlayAgain}
                >
                  Play Again
                </Button>
                <Button
                  id="exit-btn"
                  variant="outline"
                  size="md"
                  className="w-full"
                  isLoading={isLeaving}
                  onClick={handleLeaveGame}
                >
                  Exit
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer (active match) ────────────────────────────────────────── */}
      {!isFinished && (
        <footer className="mt-3 flex items-center justify-between pb-1">
          <Button
            id="leave-match-btn"
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 px-2"
            isLoading={isLeaving}
            onClick={handleLeaveGame}
          >
            Leave Match
          </Button>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[160px]">
            Playing as {me?.name}
          </span>
        </footer>
      )}

      {/* ── Countdown Overlay ───────────────────────────────────────────── */}
      {countdown !== null && countdown >= 0 && (
        <CountdownOverlay count={countdown} />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => {
          setToastMessage(null);
          clearError();
        }}
      />
    </main>
  );
}
