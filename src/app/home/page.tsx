"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Button } from "@/components/ui/Button";
import type { GameType } from "@/types/game";

const VALID_ROOM_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*$/;

const GAME_OPTIONS: Array<{
  id: GameType;
  title: string;
  accent: string;
}> = [
  {
    id: "TIC_TAC_TOE",
    title: "XO",
    accent: "from-indigo-500 to-indigo-600",
  },
  {
    id: "ROCK_PAPER_SCISSORS",
    title: "RPS",
    accent: "from-amber-500 to-orange-500",
  },
];

function GameIcon({ gameType, isSelected }: { gameType: GameType; isSelected: boolean }) {
  const stroke = isSelected ? "#f8fafc" : "#e2e8f0";

  if (gameType === "TIC_TAC_TOE") {
    return (
      <svg viewBox="0 0 96 96" className="h-16 w-16" aria-hidden="true">
        <g stroke={stroke} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M32 22L18 36M18 22L32 36" />
          <path d="M78 22L64 36M64 22L78 36" />
          <circle cx="48" cy="48" r="14" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className="h-16 w-16" aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 72l18-42 18 42H25Z" opacity="0.9" />
        <path d="M49 18h16l10 14-10 14H49L39 32l10-14Z" opacity="0.85" />
        <path d="M14 36h16l10 14-10 14H14L4 50l10-14Z" opacity="0.8" />
      </g>
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
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

export default function HomePage() {
  const router = useRouter();
  const { name, isInitialized, isLoading: isSessionLoading } = useSession();
  const { room, isLoadingRoom, error: roomError, createRoom, joinRoom, clearError } = useRoom();

  const [selectedGame, setSelectedGame] = useState<GameType>("TIC_TAC_TOE");
  const [selectedRounds, setSelectedRounds] = useState<number>(3);
  const [joinCode, setJoinCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!isSessionLoading && (!isInitialized || !name?.trim())) {
      startTransition(() => router.replace("/session"));
    }
  }, [isInitialized, isSessionLoading, name, router]);

  useEffect(() => {
    if (room) {
      if (room.gameStatus === "WAITING") {
        startTransition(() => router.push("/waiting"));
      } else if (
        room.gameStatus === "COUNTDOWN" ||
        room.gameStatus === "PLAYING" ||
        room.gameStatus === "FINISHED" ||
        room.gameStatus === "REMATCH_PENDING"
      ) {
        startTransition(() => router.push("/game"));
      }
    }
  }, [room, router]);

  const handleRoomCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    clearError();

    const rawValue = event.target.value.toUpperCase();
    if (VALID_ROOM_CODE_REGEX.test(rawValue) && rawValue.length <= 5) {
      setJoinCode(rawValue);
    }
  };

  const handleCreateRoom = async () => {
    setLocalError(null);
    clearError();
    setIsCreating(true);

    const code = await createRoom(
      selectedGame,
      selectedGame === "ROCK_PAPER_SCISSORS" ? selectedRounds : undefined
    );

    setIsCreating(false);
    if (code) {
      startTransition(() => router.push("/waiting"));
    }
  };

  const handleJoinRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedCode = joinCode.trim().toUpperCase();
    if (trimmedCode.length !== 5) {
      setLocalError("Room code must be exactly 5 characters.");
      return;
    }

    setIsJoining(true);
    const joinedRoom = await joinRoom(trimmedCode);
    setIsJoining(false);

    if (joinedRoom) {
      startTransition(() => {
        if (joinedRoom.gameStatus === "WAITING") {
          router.push("/waiting");
        } else {
          router.push("/game");
        }
      });
    }
  };

  const activeError = localError || roomError;

  if (isSessionLoading || !isInitialized) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Spinner />
          <span>Loading session…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6">
        <header className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_36px_var(--shadow)] backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black text-white shadow-lg shadow-indigo-500/20">
            {name?.charAt(0).toUpperCase() || "G"}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Welcome back</p>
            <h1 className="truncate text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{name}</h1>
          </div>
        </header>

        <section className="rounded-[1.7rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_40px_var(--shadow)] backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Game mode</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-zinc-900 dark:text-zinc-50">Choose a game</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {GAME_OPTIONS.map((option) => {
              const isSelected = selectedGame === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedGame(option.id)}
                  className={[
                    "group relative overflow-hidden rounded-[1.8rem] border p-3 text-left transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-transparent bg-[linear-gradient(135deg,rgba(91,92,230,0.16),rgba(168,85,247,0.12))] shadow-[0_18px_32px_rgba(91,92,230,0.18)] ring-2 ring-indigo-500/30"
                      : "border-[var(--border)] bg-[rgba(255,255,255,0.45)] hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(15,23,42,0.6)] dark:hover:bg-[rgba(15,23,42,0.8)]",
                  ].join(" ")}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${option.accent}`} />
                  <div className="flex items-center justify-between">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${option.accent} shadow-lg shadow-indigo-900/10`}>
                      <GameIcon gameType={option.id} isSelected={isSelected} />
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/90 bg-white/20 text-[10px] font-bold text-slate-700 shadow-sm dark:border-zinc-800 dark:text-zinc-100">
                      {isSelected ? "✓" : ""}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-center text-lg font-black tracking-[-0.05em] text-zinc-900 dark:text-zinc-50">{option.title}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedGame === "ROCK_PAPER_SCISSORS" && (
            <div className="mt-4 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-3 shadow-sm dark:border-amber-900/80 dark:from-amber-950/20 dark:to-orange-950/10">
              <label htmlFor="rps-rounds" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Number of rounds
              </label>
              <select
                id="rps-rounds"
                value={selectedRounds}
                onChange={(event) => setSelectedRounds(Number(event.target.value))}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-base font-semibold text-zinc-900 outline-none ring-0 transition focus:border-amber-500 dark:border-amber-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-5">
            <Button
              id="create-game-btn"
              type="button"
              size="lg"
              className="w-full rounded-2xl"
              onClick={handleCreateRoom}
              disabled={isJoining || isLoadingRoom || isCreating}
              isLoading={isCreating}
            >
              Create room
            </Button>
            {activeError && !showJoin && (
              <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                {activeError}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            <span>or</span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          </div>

          <div className="mt-4">
            {!showJoin ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-2xl"
                onClick={() => setShowJoin(true)}
              >
                Join with room code
              </Button>
            ) : (
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="join-code-input">
                  Enter room code
                </label>
                <input
                  id="join-code-input"
                  value={joinCode}
                  onChange={handleRoomCodeChange}
                  inputMode="text"
                  maxLength={5}
                  placeholder="ABCDE"
                  className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-center text-lg font-bold tracking-[0.35em] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 rounded-2xl"
                    onClick={() => setShowJoin(false)}
                    disabled={isJoining}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-2xl"
                    disabled={joinCode.length !== 5 || isJoining || isLoadingRoom}
                    isLoading={isJoining}
                  >
                    Join room
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
