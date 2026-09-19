"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Board } from "@/components/game/Board";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { playGameSound } from "@/lib/sound";
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

function formatRpsLabel(value: RpsChoice | null): string {
  if (!value) return "—";
  return `${value.charAt(0)}${value.slice(1).toLowerCase()}`;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
    countdown,
    rps,
    isSocketConnected,
    isOpponentConnected,
    opponentDisconnectedMessage,
    rematchRequestedBy,
    rematchFeedbackMessage,
    isLoadingRoom,
    error,
    clearError,
    clearRematchFeedback,
    makeMove,
    submitRpsChoice,
    leaveRoom,
    restoreRoom,
    requestRematch,
    acceptRematch,
    declineRematch,
  } = useRoom();

  const [isLeaving, setIsLeaving] = useState(false);
  const [selectedRpsChoice, setSelectedRpsChoice] = useState<RpsChoice | null>(null);
  const [copyCodeState, setCopyCodeState] = useState(false);
  const lastCountdownRef = useRef<number | null>(null);
  const lastRoundRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSessionLoading && (!isInitialized || !name?.trim())) {
      router.replace("/session");
    }
  }, [isInitialized, isSessionLoading, name, router]);

  useEffect(() => {
    if (isInitialized && !isSessionLoading && !room) {
      void (async () => {
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

  const activeGameType: GameType = room?.gameType ?? gameType ?? "TIC_TAC_TOE";
  const isRpsGame = activeGameType === "ROCK_PAPER_SCISSORS";

  useEffect(() => {
    if (!isRpsGame) return;
    if (gameStatus === "PLAYING") {
      const nextChoice = rps?.myChoice ?? null;
      if (selectedRpsChoice !== nextChoice) {
        const timeout = window.setTimeout(() => {
          setSelectedRpsChoice(nextChoice);
        }, 0);
        return () => window.clearTimeout(timeout);
      }
    } else if (gameStatus === "COUNTDOWN" && !rps?.myChoice) {
      const timeout = window.setTimeout(() => {
        setSelectedRpsChoice(null);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [gameStatus, isRpsGame, rps?.myChoice, selectedRpsChoice]);

  useEffect(() => {
    if (countdown !== null && countdown !== lastCountdownRef.current) {
      playGameSound("countdown");
      lastCountdownRef.current = countdown;
    }
    if (countdown === null) {
      lastCountdownRef.current = null;
    }
  }, [countdown]);

  useEffect(() => {
    if (!isRpsGame || !room?.currentRound) return;
    if (gameStatus === "PLAYING" && lastRoundRef.current !== null && lastRoundRef.current !== room.currentRound) {
      playGameSound("rematch");
    }
    if (gameStatus === "PLAYING" || gameStatus === "FINISHED") {
      lastRoundRef.current = room.currentRound;
    }
  }, [gameStatus, isRpsGame, room?.currentRound]);

  const handleCellClick = useCallback((index: number) => {
    if (gameStatus !== "PLAYING") return;
    if (currentTurn !== playerId) return;
    playGameSound("cell");
    makeMove(index);
  }, [gameStatus, currentTurn, playerId, makeMove]);

  const handleRpsChoice = useCallback((choice: RpsChoice) => {
    if (gameStatus !== "PLAYING") return;
    if (selectedRpsChoice || rps?.myChoice) return;
    playGameSound("select");
    setSelectedRpsChoice(choice);
    submitRpsChoice(choice);
  }, [gameStatus, rps?.myChoice, selectedRpsChoice, submitRpsChoice]);

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

  const handleRequestRematch = () => {
    requestRematch();
  };

  const me = players.find((player) => player.playerId === playerId) ?? null;
  const opponent = players.find((player) => player.playerId !== playerId) ?? null;
  const isMyTurn = gameStatus === "PLAYING" && currentTurn === playerId;
  const isFinished = gameStatus === "FINISHED" || gameStatus === "REMATCH_PENDING";
  const winningCells = isFinished && winReason !== "DRAW" ? getVisualWinningCells(board) : [];
  const toastMessage = error ?? rematchFeedbackMessage ?? null;
  const toastType: "success" | "error" | "info" | "warning" = error ? "error" : "info";

  const myRoomScore = room?.playerScores?.[playerId ?? ""] ?? 0;
  const opponentRoomScore = room?.playerScores?.[opponent?.playerId ?? ""] ?? 0;
  const finalRpsRound = room?.totalRounds ?? 1;
  const currentRoundNumber = Math.max(1, room?.currentRound ?? 1);

  const myStats = room?.rpsStats?.[playerId ?? ""] ?? { roundsWon: 0, draws: 0, roundsPlayed: 0 };
  const dismissToast = useCallback(() => {
    if (error) {
      clearError();
    }
    if (rematchFeedbackMessage) {
      clearRematchFeedback();
    }
  }, [clearError, clearRematchFeedback, error, rematchFeedbackMessage]);

  const resultTitle = useMemo(() => {
    if (!isFinished) return "";
    if (winner === "DRAW" || winReason === "DRAW") {
      return "MATCH DRAW";
    }
    if (winner === playerId) {
      return isRpsGame ? "MATCH COMPLETE" : "You won";
    }
    if (winner) {
      return isRpsGame ? "MATCH COMPLETE" : "You lost";
    }
    return "";
  }, [isFinished, winner, playerId, winReason, isRpsGame]);

  const resultSubtitle = useMemo(() => {
    if (!isFinished) return "";
    if (winner === "DRAW" || winReason === "DRAW") {
      return "The match ended in a draw.";
    }
    if (winner === playerId) {
      return isRpsGame ? "You won the match!" : "Great game!";
    }
    if (winner) {
      return isRpsGame ? `${opponent?.name || "Opponent"} won the match.` : `${opponent?.name || "Opponent"} took the win.`;
    }
    return "";
  }, [isFinished, winner, playerId, winReason, isRpsGame, opponent?.name]);

  useEffect(() => {
    if (!isRpsGame) return;
    if (rps?.roundResult && rps.roundResult.winnerPlayerId === playerId) {
      playGameSound("round-win");
    } else if (rps?.roundResult && rps.roundResult.isDraw) {
      playGameSound("round-draw");
    } else if (rps?.roundResult && rps.roundResult.winnerPlayerId && rps.roundResult.winnerPlayerId !== playerId) {
      playGameSound("round-loss");
    }
  }, [isRpsGame, playerId, rps?.roundResult]);

  useEffect(() => {
    if (!isRpsGame || !room || gameStatus !== "FINISHED") return;
    if (room.totalRounds && room.currentRound === room.totalRounds) {
      if (room.winnerPlayerId === "DRAW") {
        playGameSound("match-draw");
      } else if (room.winnerPlayerId === playerId) {
        playGameSound("match-win");
      } else if (room.winnerPlayerId) {
        playGameSound("match-loss");
      }
    }
  }, [isRpsGame, room, gameStatus, playerId]);

  useEffect(() => {
    if (!isRpsGame || gameStatus !== "FINISHED") return;
    if (room?.totalRounds && room.currentRound !== room.totalRounds) {
      const timeout = window.setTimeout(() => {
        playGameSound("rematch");
      }, 350);
      return () => window.clearTimeout(timeout);
    }
  }, [gameStatus, isRpsGame, room?.currentRound, room?.totalRounds]);

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

  const currentPlayerDisplayName = me?.name || "You";
  const opponentDisplayName = opponent?.name || "Opponent";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-5">
        <header className="flex flex-col gap-3 rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Match</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.05em] text-zinc-900 dark:text-zinc-50">{isRpsGame ? "Rock Paper Scissors" : "Tic-Tac-Toe"}</h1>
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

        {!isRpsGame && (
          <div className="grid gap-4 md:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-4">
              <Board
                board={board}
                disabled={gameStatus !== "PLAYING" || !isMyTurn}
                onCellClick={handleCellClick}
                winningCells={winningCells}
              />
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.4rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Turn</p>
                <div className="mt-2 text-lg font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">
                  {gameStatus === "PLAYING" ? (isMyTurn ? "Your turn" : `${opponent?.name || "Opponent"}'s turn`) : resultTitle || "Waiting"}
                </div>
                <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {gameStatus === "PLAYING" ? `Time left: ${Math.max(0, currentTurn === playerId ? (room.turnTimeRemaining ?? 0) : 0)}s` : resultSubtitle || "Game ready"}
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Game result</p>
                <div className="mt-2 text-xl font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">{resultTitle || "In progress"}</div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{resultSubtitle || "Make your move."}</p>
              </div>
            </aside>
          </div>
        )}

        {isRpsGame && (
          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Current Round</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-zinc-900 dark:text-zinc-50">
                    ROUND {currentRoundNumber} OF {finalRpsRound}
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm sm:min-w-[260px]">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">You</div>
                    <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-50">{myRoomScore}</div>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Draws</div>
                    <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-50">{myStats.draws}</div>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Opponent</div>
                    <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-50">{opponentRoomScore}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Complete Match Score</p>
                  <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">{currentPlayerDisplayName} vs {opponentDisplayName}</h3>
                </div>
                <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{room.totalRounds ?? 1} rounds</div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">You</div>
                  <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-50">{myRoomScore}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Draws</div>
                  <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-50">{myStats.draws}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Opponent</div>
                  <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-50">{opponentRoomScore}</div>
                </div>
              </div>
            </div>

            {gameStatus === "COUNTDOWN" && countdown !== null && (
              <div className="rounded-[1.6rem] border border-indigo-200 bg-indigo-50 px-5 py-4 text-center dark:border-indigo-900 dark:bg-indigo-950/30">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Round countdown</div>
                <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-indigo-700 dark:text-indigo-300">{countdown}</div>
              </div>
            )}

            {gameStatus === "FINISHED" && room.totalRounds && room.currentRound !== room.totalRounds && (
              <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Round complete</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-zinc-900 dark:text-zinc-50">ROUND {currentRoundNumber} COMPLETE</h3>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {rps?.roundResult?.isDraw ? "Round draw." : rps?.roundResult?.winnerPlayerId === playerId ? `${currentPlayerDisplayName} wins the round` : `${opponentDisplayName} wins the round`}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    [currentPlayerDisplayName, myRoomScore],
                    ["Draws", myStats.draws],
                    [opponentDisplayName, opponentRoomScore],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 dark:border-emerald-800 dark:bg-zinc-900">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
                      <div className="mt-1 text-xl font-black text-zinc-900 dark:text-zinc-50">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gameStatus === "FINISHED" && room.totalRounds && room.currentRound === room.totalRounds && (
              <div className="rounded-[1.6rem] border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">Final result</p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.06em] text-zinc-900 dark:text-zinc-50">{resultTitle || "MATCH COMPLETE"}</h3>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{resultSubtitle}</p>
              </div>
            )}

            <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Choose your move</div>
                {rps?.myChoice && (
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Submitted
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {RPS_CHOICES.map(({ value, label, emoji }) => {
                  const isSelected = (selectedRpsChoice ?? rps?.myChoice) === value;
                  const isDisabled = Boolean(rps?.myChoice) || gameStatus !== "PLAYING";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRpsChoice(value)}
                      disabled={isDisabled}
                      className={[
                        "relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-150",
                        isSelected
                          ? "border-indigo-300 bg-indigo-50 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/40"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                        isDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div className="text-3xl" aria-hidden="true">{emoji}</div>
                      <div className="mt-2 text-lg font-black text-zinc-900 dark:text-zinc-50">{label}</div>
                      {isSelected && (
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">Selected</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Opponent</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {rps?.roundResult ? `${formatRpsLabel(rps.roundResult.playerChoices[opponent?.playerId ?? ""] ?? null)}` : rps?.opponentHasChosen ? "Opponent has chosen ✓" : "Waiting for opponent"}
                  </span>
                </div>
                {rps?.roundResult && (
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {rps.roundResult.isDraw ? "Round draw." : `${rps.roundResult.winnerPlayerId === playerId ? currentPlayerDisplayName : opponentDisplayName} won the round.`}
                  </div>
                )}
              </div>
            </div>

            {(room.rpsRoundHistory?.length ?? 0) > 0 && (
              <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">History</p>
                    <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">Round history</h3>
                  </div>
                  <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{room.rpsRoundHistory?.length ?? 0} rounds</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                    <thead>
                      <tr className="text-zinc-500 dark:text-zinc-400">
                        <th className="px-2 py-1 font-semibold">Round</th>
                        <th className="px-2 py-1 font-semibold">You</th>
                        <th className="px-2 py-1 font-semibold">Opponent</th>
                        <th className="px-2 py-1 font-semibold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(room.rpsRoundHistory ?? []).map((entry) => {
                        const myChoice = entry.playerChoices[playerId ?? ""] ?? null;
                        const oppChoice = entry.playerChoices[opponent?.playerId ?? ""] ?? null;
                        const resultLabel = entry.isDraw ? "Draw" : entry.winnerPlayerId === playerId ? "You" : entry.winnerPlayerId ? "Opponent" : "—";
                        return (
                          <tr key={entry.round} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/80">
                            <td className="rounded-l-xl px-2 py-2 font-semibold text-zinc-900 dark:text-zinc-50">{entry.round}</td>
                            <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">{getRpsSummaryLabel(myChoice)}</td>
                            <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">{getRpsSummaryLabel(oppChoice)}</td>
                            <td className="rounded-r-xl px-2 py-2 font-semibold text-zinc-900 dark:text-zinc-50">{resultLabel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {gameStatus === "FINISHED" && room.totalRounds && room.currentRound === room.totalRounds && (
              <div className="flex flex-col gap-3 rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row">
                <Button type="button" className="flex-1 rounded-2xl" onClick={handleRequestRematch}>
                  Rematch
                </Button>
                <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={handleLeaveGame}>
                  Leave Room
                </Button>
              </div>
            )}
          </div>
        )}

        {!isRpsGame && (
          <div className="flex flex-col gap-3 rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={handleLeaveGame} disabled={isLeaving} isLoading={isLeaving}>
              Leave Room
            </Button>
          </div>
        )}

        {rematchRequestedBy && gameStatus === "REMATCH_PENDING" && (
          <div className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="text-lg font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">Rematch requested</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {rematchRequestedBy === playerId ? "Waiting for the other player to accept." : `${opponent?.name || "Opponent"} wants a rematch.`}
            </p>
            {rematchRequestedBy !== playerId && (
              <div className="mt-4 flex gap-3">
                <Button type="button" className="flex-1 rounded-2xl" onClick={acceptRematch}>Accept rematch</Button>
                <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={declineRematch}>Decline</Button>
              </div>
            )}
          </div>
        )}

        {(!isSocketConnected || !isOpponentConnected) && !opponentDisconnectedMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {isSocketConnected ? "Waiting for opponent to reconnect..." : "Reconnecting to server..."}
          </div>
        )}

        {toastMessage && <Toast message={toastMessage} type={toastType} duration={5000} onClose={dismissToast} />}
      </div>
    </main>
  );
}
