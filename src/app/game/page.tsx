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
  if (!choice) return "—";
  return choice.charAt(0) + choice.slice(1).toLowerCase();
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        ...style,
      }}
    >
      {children}
    </div>
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
        const timeout = window.setTimeout(() => setSelectedRpsChoice(nextChoice), 0);
        return () => window.clearTimeout(timeout);
      }
    } else if (gameStatus === "COUNTDOWN" && !rps?.myChoice) {
      const timeout = window.setTimeout(() => setSelectedRpsChoice(null), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [gameStatus, isRpsGame, rps?.myChoice, selectedRpsChoice]);

  useEffect(() => {
    if (countdown !== null && countdown !== lastCountdownRef.current) {
      playGameSound("countdown");
      lastCountdownRef.current = countdown;
    }
    if (countdown === null) lastCountdownRef.current = null;
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
    if (success) router.replace("/home");
  };

  const me = players.find((p) => p.playerId === playerId) ?? null;
  const opponent = players.find((p) => p.playerId !== playerId) ?? null;
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
  const currentPlayerDisplayName = me?.name || "You";
  const opponentDisplayName = opponent?.name || "Opponent";

  const dismissToast = useCallback(() => {
    if (error) clearError();
    if (rematchFeedbackMessage) clearRematchFeedback();
  }, [clearError, clearRematchFeedback, error, rematchFeedbackMessage]);

  const resultTitle = useMemo(() => {
    if (!isFinished) return "";
    if (winner === "DRAW" || winReason === "DRAW") return "It's a Draw";
    if (winner === playerId) return isRpsGame ? "Match Won! 🏆" : "You Won! 🎉";
    if (winner) return isRpsGame ? "Match Lost" : "You Lost";
    return "";
  }, [isFinished, winner, playerId, winReason, isRpsGame]);

  const resultSubtitle = useMemo(() => {
    if (!isFinished) return "";
    if (winner === "DRAW" || winReason === "DRAW") return "The match ended in a draw.";
    if (winner === playerId) return isRpsGame ? "You won the match!" : "Great game!";
    if (winner) return isRpsGame ? `${opponentDisplayName} won the match.` : `${opponentDisplayName} took the win.`;
    return "";
  }, [isFinished, winner, playerId, winReason, isRpsGame, opponentDisplayName]);

  useEffect(() => {
    if (!isRpsGame) return;
    if (rps?.roundResult?.winnerPlayerId === playerId) playGameSound("round-win");
    else if (rps?.roundResult?.isDraw) playGameSound("round-draw");
    else if (rps?.roundResult?.winnerPlayerId && rps.roundResult.winnerPlayerId !== playerId) playGameSound("round-loss");
  }, [isRpsGame, playerId, rps?.roundResult]);

  useEffect(() => {
    if (!isRpsGame || !room || gameStatus !== "FINISHED") return;
    if (room.totalRounds && room.currentRound === room.totalRounds) {
      if (room.winnerPlayerId === "DRAW") playGameSound("match-draw");
      else if (room.winnerPlayerId === playerId) playGameSound("match-win");
      else if (room.winnerPlayerId) playGameSound("match-loss");
    }
  }, [isRpsGame, room, gameStatus, playerId]);

  useEffect(() => {
    if (!isRpsGame || gameStatus !== "FINISHED") return;
    if (room?.totalRounds && room.currentRound !== room.totalRounds) {
      const timeout = window.setTimeout(() => playGameSound("rematch"), 350);
      return () => window.clearTimeout(timeout);
    }
  }, [gameStatus, isRpsGame, room?.currentRound, room?.totalRounds]);

  if (isSessionLoading || isLoadingRoom || !room) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--fg-muted)" }}>
          <Spinner />
          <span>Loading match…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-4 animate-fade-up">

        {/* ── Top bar ── */}
        <Card className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black text-white"
              style={{
                background: isRpsGame
                  ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {isRpsGame ? "✂️" : "❌"}
            </div>
            <div>
              <p className="label-tag">Match</p>
              <h1 className="text-base font-black" style={{ color: "var(--fg)" }}>
                {isRpsGame ? "Rock Paper Scissors" : "Tic-Tac-Toe"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--fg-muted)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              <span style={{ color: "var(--fg)" }}>{room.code}</span>
              <span>{copyCodeState ? "✓" : "⎘"}</span>
            </button>
          </div>
        </Card>

        {/* ── Connection warning ── */}
        {opponentDisconnectedMessage && (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-medium"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "var(--amber)",
            }}
          >
            ⚠️ {opponentDisconnectedMessage}
          </div>
        )}
        {(!isSocketConnected || !isOpponentConnected) && !opponentDisconnectedMessage && (
          <div
            className="rounded-2xl px-4 py-3 text-sm font-medium"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "var(--amber)",
            }}
          >
            ⚠️ {isSocketConnected ? "Waiting for opponent to reconnect…" : "Reconnecting to server…"}
          </div>
        )}

        {/* ══════════════════════ XO GAME ══════════════════════ */}
        {!isRpsGame && (
          <>
            {/* Player vs Player scores + turn */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                {/* Me */}
                <div className="flex-1 text-center">
                  <div
                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    {me?.name?.charAt(0).toUpperCase() || "Y"}
                  </div>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--fg-muted)" }}>{currentPlayerDisplayName}</p>
                  <p className="text-2xl font-black mt-0.5" style={{ color: "var(--fg)" }}>{myRoomScore}</p>
                </div>

                {/* Turn indicator in the middle */}
                <div className="text-center px-3">
                  {gameStatus === "PLAYING" ? (
                    <div
                      className="rounded-2xl px-3 py-2 text-xs font-bold"
                      style={{
                        background: isMyTurn ? "var(--accent-soft)" : "var(--bg-raised)",
                        border: `1.5px solid ${isMyTurn ? "var(--accent-border)" : "var(--border)"}`,
                        color: isMyTurn ? "var(--accent)" : "var(--fg-muted)",
                      }}
                    >
                      {isMyTurn ? "Your turn" : "Opponent's turn"}
                    </div>
                  ) : isFinished ? (
                    <div
                      className="rounded-2xl px-3 py-2 text-xs font-bold"
                      style={{
                        background: winner === playerId
                          ? "rgba(16,185,129,0.12)"
                          : winner === "DRAW" || winReason === "DRAW"
                            ? "var(--bg-raised)"
                            : "rgba(239,68,68,0.1)",
                        border: `1.5px solid ${winner === playerId ? "rgba(16,185,129,0.4)" : winner === "DRAW" || winReason === "DRAW" ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
                        color: winner === playerId ? "var(--green)" : winner === "DRAW" || winReason === "DRAW" ? "var(--fg-muted)" : "var(--red)",
                      }}
                    >
                      {resultTitle}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold" style={{ color: "var(--fg-subtle)" }}>vs</div>
                  )}
                </div>

                {/* Opponent */}
                <div className="flex-1 text-center">
                  <div
                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{ background: "linear-gradient(135deg, #64748b, #475569)" }}
                  >
                    {opponent?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--fg-muted)" }}>{opponentDisplayName}</p>
                  <p className="text-2xl font-black mt-0.5" style={{ color: "var(--fg)" }}>{opponentRoomScore}</p>
                </div>
              </div>

              {/* Turn timer */}
              {gameStatus === "PLAYING" && isMyTurn && room.turnTimeRemaining !== undefined && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div
                    className="h-1.5 rounded-full overflow-hidden flex-1 max-w-[200px]"
                    style={{ background: "var(--bg-sunken)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(room.turnTimeRemaining / 30) * 100}%`,
                        background: room.turnTimeRemaining <= 5
                          ? "var(--red)"
                          : room.turnTimeRemaining <= 10
                            ? "var(--amber)"
                            : "var(--accent)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--fg-muted)" }}>
                    {room.turnTimeRemaining}s
                  </span>
                </div>
              )}
            </Card>

            {/* Board */}
            <Card className="p-4">
              <Board
                board={board}
                disabled={gameStatus !== "PLAYING" || !isMyTurn}
                onCellClick={handleCellClick}
                winningCells={winningCells}
              />

              {/* Result overlay inside board card when finished */}
              {isFinished && resultTitle && (
                <div className="mt-4 rounded-2xl px-4 py-3 text-center" style={{
                  background: winner === playerId
                    ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))"
                    : winner === "DRAW" || winReason === "DRAW"
                      ? "var(--bg-raised)"
                      : "rgba(239,68,68,0.06)",
                  border: `1px solid ${winner === playerId ? "rgba(16,185,129,0.3)" : winner === "DRAW" || winReason === "DRAW" ? "var(--border)" : "rgba(239,68,68,0.2)"}`,
                }}>
                  <p className="text-lg font-black" style={{ color: "var(--fg)" }}>{resultTitle}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{resultSubtitle}</p>
                </div>
              )}
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 rounded-2xl"
                onClick={handleLeaveGame}
                disabled={isLeaving}
                isLoading={isLeaving}
              >
                ← Leave
              </Button>
              {isFinished && winner !== null && (
                <Button
                  type="button"
                  className="flex-1 rounded-2xl"
                  onClick={() => requestRematch()}
                >
                  Rematch 🔄
                </Button>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════ RPS GAME ══════════════════════ */}
        {isRpsGame && (
          <>
            {/* Scoreboard */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="label-tag">Round</p>
                  <h2 className="text-lg font-black" style={{ color: "var(--fg)" }}>
                    {currentRoundNumber} <span style={{ color: "var(--fg-muted)" }}>/ {finalRpsRound}</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { label: currentPlayerDisplayName, score: myRoomScore, accent: "var(--accent)" },
                    { label: "Draws", score: myStats.draws, accent: "var(--fg-muted)" },
                    { label: opponentDisplayName, score: opponentRoomScore, accent: "#64748b" },
                  ].map(({ label, score, accent }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center rounded-2xl px-3 py-2 min-w-[56px]"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[52px]" style={{ color: "var(--fg-muted)" }}>{label}</span>
                      <span className="text-xl font-black mt-0.5" style={{ color: accent }}>{score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Round progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-sunken)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(currentRoundNumber / finalRpsRound) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                  }}
                />
              </div>
            </Card>

            {/* Countdown */}
            {gameStatus === "COUNTDOWN" && countdown !== null && (
              <Card className="py-8 text-center animate-pop">
                <p className="label-tag mb-2">Round starting</p>
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl font-black animate-pulse-soft"
                  style={{
                    background: "var(--accent-soft)",
                    border: "3px solid var(--accent-border)",
                    color: "var(--accent)",
                    boxShadow: "var(--shadow-glow)",
                  }}
                >
                  {countdown}
                </div>
              </Card>
            )}

            {/* Round result */}
            {gameStatus === "FINISHED" && room.totalRounds && room.currentRound !== room.totalRounds && (
              <Card className="p-5 animate-pop" style={{
                background: rps?.roundResult?.winnerPlayerId === playerId
                  ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))"
                  : "var(--bg-surface)",
                border: `1px solid ${rps?.roundResult?.winnerPlayerId === playerId ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
              }}>
                <p className="label-tag">Round {currentRoundNumber} Result</p>
                <h3 className="mt-1 text-xl font-black" style={{ color: "var(--fg)" }}>
                  {rps?.roundResult?.isDraw
                    ? "Round Draw 🤝"
                    : rps?.roundResult?.winnerPlayerId === playerId
                      ? "You won the round! 🎯"
                      : "Opponent won the round"}
                </h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: currentPlayerDisplayName, score: myRoomScore },
                    { label: "Draws", score: myStats.draws },
                    { label: opponentDisplayName, score: opponentRoomScore },
                  ].map(({ label, score }) => (
                    <div key={label} className="rounded-2xl p-3 text-center" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{label}</div>
                      <div className="text-xl font-black mt-1" style={{ color: "var(--fg)" }}>{score}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Final match result */}
            {gameStatus === "FINISHED" && room.totalRounds && room.currentRound === room.totalRounds && (
              <Card className="p-6 text-center animate-pop" style={{
                background: winner === playerId
                  ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))"
                  : winner === "DRAW" || winReason === "DRAW"
                    ? "var(--bg-surface)"
                    : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))",
                border: `1px solid ${winner === playerId ? "rgba(16,185,129,0.3)" : winner === "DRAW" || winReason === "DRAW" ? "var(--border)" : "rgba(239,68,68,0.2)"}`,
              }}>
                <p className="label-tag mb-2">Final Result</p>
                <h3 className="text-3xl font-black" style={{ color: "var(--fg)" }}>{resultTitle || "Match Complete"}</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>{resultSubtitle}</p>
              </Card>
            )}

            {/* RPS choice picker */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="label-tag">Your Move</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    {gameStatus === "PLAYING"
                      ? rps?.myChoice ? "Choice submitted ✓" : "Choose wisely…"
                      : "Round complete"}
                  </p>
                </div>
                {rps?.opponentHasChosen && !rps.roundResult && (
                  <div
                    className="rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--green)" }}
                  >
                    Opponent ready ✓
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {RPS_CHOICES.map(({ value, label, emoji }) => {
                  const isSelected = (selectedRpsChoice ?? rps?.myChoice) === value;
                  const isDisabled = Boolean(rps?.myChoice) || gameStatus !== "PLAYING";
                  const opponentChose = rps?.roundResult?.playerChoices[opponent?.playerId ?? ""] === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRpsChoice(value)}
                      disabled={isDisabled}
                      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 transition-all duration-200 focus-visible:outline-none"
                      style={{
                        background: isSelected
                          ? "var(--accent-soft)"
                          : "var(--bg-raised)",
                        border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        boxShadow: isSelected ? "0 4px 16px var(--accent-glow)" : "var(--shadow-sm)",
                        cursor: isDisabled ? "default" : "pointer",
                        opacity: isDisabled && !isSelected ? 0.6 : 1,
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      <span className="text-3xl">{emoji}</span>
                      <span className="text-sm font-bold" style={{ color: isSelected ? "var(--accent)" : "var(--fg)" }}>{label}</span>
                      {isSelected && (
                        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                          Selected
                        </span>
                      )}
                      {opponentChose && rps?.roundResult && (
                        <span
                          className="absolute -top-1.5 -right-1.5 rounded-full text-[9px] font-bold px-1.5 py-0.5"
                          style={{ background: "#64748b", color: "#fff" }}
                        >
                          Opp
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Opponent status / round result row */}
              {rps?.roundResult && (
                <div
                  className="mt-4 rounded-2xl px-4 py-3 text-sm"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>Round outcome</span>
                    <span className="font-bold" style={{ color: rps.roundResult.isDraw ? "var(--fg-muted)" : rps.roundResult.winnerPlayerId === playerId ? "var(--green)" : "var(--red)" }}>
                      {rps.roundResult.isDraw ? "Draw" : rps.roundResult.winnerPlayerId === playerId ? "You won" : "Opponent won"}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Round history */}
            {(room.rpsRoundHistory?.length ?? 0) > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="label-tag">Round History</p>
                  <span className="text-xs font-semibold" style={{ color: "var(--fg-subtle)" }}>
                    {room.rpsRoundHistory?.length ?? 0} rounds
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(room.rpsRoundHistory ?? []).map((entry) => {
                    const myChoice = entry.playerChoices[playerId ?? ""] ?? null;
                    const oppChoice = entry.playerChoices[opponent?.playerId ?? ""] ?? null;
                    const resultLabel = entry.isDraw ? "Draw" : entry.winnerPlayerId === playerId ? "Won" : entry.winnerPlayerId ? "Lost" : "—";
                    const resultColor = entry.isDraw ? "var(--fg-muted)" : entry.winnerPlayerId === playerId ? "var(--green)" : "var(--red)";
                    return (
                      <div
                        key={entry.round}
                        className="flex items-center gap-3 rounded-xl px-3 py-2"
                        style={{ background: "var(--bg-raised)" }}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                          style={{ background: "var(--bg-sunken)", color: "var(--fg-muted)" }}
                        >
                          {entry.round}
                        </span>
                        <span className="flex-1 text-sm" style={{ color: "var(--fg)" }}>
                          {getRpsSummaryLabel(myChoice)} vs {getRpsSummaryLabel(oppChoice)}
                        </span>
                        <span
                          className="text-xs font-bold rounded-full px-2 py-0.5"
                          style={{
                            background: `${resultColor}18`,
                            border: `1px solid ${resultColor}40`,
                            color: resultColor,
                          }}
                        >
                          {resultLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Match over — rematch / leave */}
            {gameStatus === "FINISHED" && room.totalRounds && room.currentRound === room.totalRounds && (
              <div className="flex gap-3">
                <Button type="button" className="flex-1 rounded-2xl" onClick={() => requestRematch()}>
                  Rematch 🔄
                </Button>
                <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={handleLeaveGame}>
                  Leave
                </Button>
              </div>
            )}
            {!(gameStatus === "FINISHED" && room.totalRounds && room.currentRound === room.totalRounds) && (
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-2xl"
                onClick={handleLeaveGame}
                disabled={isLeaving}
                isLoading={isLeaving}
              >
                ← Leave Game
              </Button>
            )}
          </>
        )}

        {/* ── Rematch dialog ── */}
        {rematchRequestedBy && gameStatus === "REMATCH_PENDING" && (
          <Card className="p-5 animate-pop">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                style={{ background: "var(--accent-soft)", border: "1.5px solid var(--accent-border)" }}
              >
                🔄
              </div>
              <div>
                <p className="font-black" style={{ color: "var(--fg)" }}>Rematch requested</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {rematchRequestedBy === playerId
                    ? "Waiting for opponent to accept…"
                    : `${opponentDisplayName} wants a rematch!`}
                </p>
              </div>
            </div>
            {rematchRequestedBy !== playerId && (
              <div className="flex gap-3">
                <Button type="button" className="flex-1 rounded-2xl" onClick={acceptRematch}>
                  Accept ✓
                </Button>
                <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={declineRematch}>
                  Decline
                </Button>
              </div>
            )}
          </Card>
        )}

        {toastMessage && <Toast message={toastMessage} type={toastType} duration={5000} onClose={dismissToast} />}
      </div>
    </main>
  );
}
