"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Board } from "@/components/game/Board";
import { CountdownOverlay } from "@/components/game/CountdownOverlay";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { PlayerCard } from "@/components/game/PlayerCard";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { BoardState, GameType, RpsChoice } from "@/types/game";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const RPS_CHOICES: Array<{ value: RpsChoice; label: string; emoji: string }> = [
  { value: "ROCK", label: "Rock", emoji: "🪨" },
  { value: "PAPER", label: "Paper", emoji: "📄" },
  { value: "SCISSORS", label: "Scissors", emoji: "✂️" },
];

function getVisualWinningCells(board: BoardState): number[] {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }

  return [];
}

function getRpsSummaryLabel(choice: RpsChoice | null): string {
  if (!choice) return "No choice yet";
  return choice.charAt(0) + choice.slice(1).toLowerCase();
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
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

export default function GamePage() {
  const router = useRouter();
  const { playerId, name, isInitialized, isLoading: isSessionLoading } = useSession();
  const {
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
    rps,
    isSocketConnected,
    isOpponentConnected,
    opponentDisconnectedMessage,
    rematchRequestedBy,
    rematchFeedbackMessage,
    isLoadingRoom,
    error,
    makeMove,
    submitRpsChoice,
    leaveRoom,
    restoreRoom,
    requestRematch,
    acceptRematch,
    declineRematch,
  } = useRoom();

  const [isLeaving, setIsLeaving] = useState(false);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [copyCodeState, setCopyCodeState] = useState(false);
  const [selectedRpsChoice, setSelectedRpsChoice] = useState<RpsChoice | null>(null);

  useEffect(() => {
    if (!isSessionLoading && (!isInitialized || !name?.trim())) {
      router.replace("/session");
    }
  }, [isInitialized, isSessionLoading, name, router]);

  useEffect(() => {
    if (isInitialized && !isSessionLoading && !room) {
      (async () => {
        const restored = await restoreRoom();
        if (!restored) {
          router.replace("/home");
        }
      })();
    }
  }, [isInitialized, isSessionLoading, room, restoreRoom, router]);

  useEffect(() => {
    if (room && gameStatus === "WAITING") {
      router.replace("/waiting");
    }
  }, [room, gameStatus, router]);

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
      const textarea = document.createElement("textarea");
      textarea.value = room.code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopyCodeState(true);
    setTimeout(() => setCopyCodeState(false), 2000);
  };

  const handleLeaveGame = async () => {
    setIsLeaving(true);
    const success = await leaveRoom();
    setIsLeaving(false);

    if (success) {
      router.replace("/home");
    }
  };

  const handlePlayAgain = () => {
    setIsRequestingRematch(true);
    requestRematch();
  };

  const handleAcceptRematch = () => {
    acceptRematch();
  };

  const handleDeclineRematch = () => {
    declineRematch();
  };

  if (isSessionLoading || isLoadingRoom || !room) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Spinner />
          <span>Loading match…</span>
        </div>
      </main>
    );
  }

  const activeGameType: GameType = room.gameType ?? gameType ?? "TIC_TAC_TOE";
  const me = players.find((player) => player.playerId === playerId) ?? null;
  const opponent = players.find((player) => player.playerId !== playerId) ?? null;
  const isMyTurn = gameStatus === "PLAYING" && currentTurn === playerId;
  const isFinished = gameStatus === "FINISHED" || gameStatus === "REMATCH_PENDING";
  const isPlaying = gameStatus === "PLAYING";
  const winningCells = isFinished && winReason !== "DRAW" ? getVisualWinningCells(board) : [];

  const hasRequestedRematch = rematchRequestedBy === playerId;
  const opponentRequestedRematch = rematchRequestedBy !== null && rematchRequestedBy !== playerId;
  const toastMessage = error ?? rematchFeedbackMessage ?? null;
  const toastType: "success" | "error" | "info" | "warning" = error ? "error" : "info";

  let resultTitle = "";
  let resultSubtitle = "";
  let resultEmoji = "";

  if (isFinished) {
    if (winner === "DRAW" || winReason === "DRAW") {
      resultTitle = "It’s a draw";
      resultSubtitle = "Nobody wins this round.";
      resultEmoji = "🤝";
    } else if (winner === playerId) {
      resultTitle = "You won";
      resultSubtitle = winReason === "ABANDONMENT" ? "Opponent left the match." : "Great game!";
      resultEmoji = "🏆";
    } else if (winner) {
      resultTitle = "You lost";
      resultSubtitle = winReason === "ABANDONMENT" ? "You left the match." : `${opponent?.name || "Opponent"} took the win.`;
      resultEmoji = "😤";
    }
  }

  const isRpsGame = activeGameType === "ROCK_PAPER_SCISSORS";
  const gameHeaderText = isRpsGame ? "Rock Paper Scissors" : "Tic-Tac-Toe";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-5">
        <header className="flex flex-col gap-3 rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Match</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.05em] text-zinc-900 dark:text-zinc-50">{gameHeaderText}</h1>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {room.code}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {copyCodeState ? "Copied" : "Copy"}
            </button>
          </div>
        </header>

        {opponentDisconnectedMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {opponentDisconnectedMessage}
          </div>
        )}

        <PlayerCard me={{
          name: me?.name || "You",
          symbol: me?.symbol ?? null,
          isConnected: me?.isConnected ?? true,
          isYou: true,
          isActive: isMyTurn,
        }} opponent={{
          name: opponent?.name || "Waiting…",
          symbol: opponent?.symbol ?? null,
          isConnected: opponent?.isConnected ?? false,
          isYou: false,
          isActive: !isMyTurn && isPlaying,
        }} gameStatus={gameStatus} />

        {isRpsGame ? (
          <section className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Choice</p>
                <h2 className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-50">Choose your throw</h2>
              </div>
              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {rps?.myChoice ? `You: ${getRpsSummaryLabel(rps.myChoice)}` : "Awaiting choice"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {RPS_CHOICES.map(({ value, label, emoji }) => {
                const isSelected = (selectedRpsChoice ?? rps?.myChoice) === value;
                const disabled = Boolean(rps?.myChoice) || gameStatus !== "PLAYING";

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedRpsChoice(value);
                      submitRpsChoice(value);
                    }}
                    className={[
                      "rounded-2xl border p-4 text-center transition-all duration-150",
                      isSelected
                        ? "border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                    ].join(" ")}
                  >
                    <div className="text-3xl" aria-hidden="true">{emoji}</div>
                    <div className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">{label}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {rps?.opponentChoice ? (
                <>
                  Opponent chose <span className="font-semibold">{getRpsSummaryLabel(rps.opponentChoice)}</span>.
                </>
              ) : rps?.myChoice ? (
                "Waiting for opponent to choose…"
              ) : (
                "Your choice will be locked in once you submit."
              )}
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {!isFinished && (
              <TurnIndicator
                isMyTurn={isMyTurn}
                opponentName={opponent?.name || "Opponent"}
                timeRemaining={turnTimeRemaining}
              />
            )}

            <div className="rounded-[1.65rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <Board
                board={board}
                disabled={gameStatus !== "PLAYING" || !isMyTurn}
                onCellClick={handleCellClick}
                winningCells={winningCells}
              />
            </div>
          </div>
        )}

        {countdown !== null && (
          <CountdownOverlay count={countdown} />
        )}

        {isFinished && (
          <section className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Result</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">{resultEmoji || "🎉"}</span>
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">{resultTitle || "Match complete"}</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{resultSubtitle || "The room is ready for rematch."}</p>
                  </div>
                </div>
              </div>
            </div>

            {isRpsGame && (
              <div className="mt-4 grid gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">You</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {rps?.myChoice ? getRpsSummaryLabel(rps.myChoice) : "No choice"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Opponent</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {rps?.opponentChoice ? getRpsSummaryLabel(rps.opponentChoice) : "Waiting"}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {opponentRequestedRematch ? (
                <>
                  <Button type="button" onClick={handleAcceptRematch} className="flex-1 rounded-2xl">Accept rematch</Button>
                  <Button type="button" variant="outline" onClick={handleDeclineRematch} className="flex-1 rounded-2xl">Decline</Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handlePlayAgain}
                    className="flex-1 rounded-2xl"
                    disabled={isRequestingRematch || hasRequestedRematch}
                    isLoading={isRequestingRematch}
                  >
                    {hasRequestedRematch ? "Rematch requested" : "Play again"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleLeaveGame} className="flex-1 rounded-2xl" disabled={isLeaving} isLoading={isLeaving}>
                    Leave
                  </Button>
                </>
              )}
            </div>
          </section>
        )}

        {!isFinished && (
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={handleLeaveGame} className="rounded-2xl" disabled={isLeaving} isLoading={isLeaving}>
              Leave match
            </Button>
          </div>
        )}

        {!isSocketConnected && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            Reconnecting to the live room…
          </div>
        )}

        {isSocketConnected && !isOpponentConnected && !opponentDisconnectedMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            Opponent is offline.
          </div>
        )}
      </div>

      <Toast message={toastMessage} type={toastType} />
    </main>
  );
}
