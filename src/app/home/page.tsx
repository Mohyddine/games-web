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
  label: string;
  description: string;
  emoji: string;
  accent: string;
}> = [
  {
    id: "TIC_TAC_TOE",
    label: "Tic-Tac-Toe",
    description: "Classic 3x3 strategy showdown",
    emoji: "❌⭕",
    accent: "from-indigo-500 to-indigo-600",
  },
  {
    id: "ROCK_PAPER_SCISSORS",
    label: "Rock Paper Scissors",
    description: "Fast reaction match with hidden throws",
    emoji: "🪨✂️📄",
    accent: "from-amber-500 to-orange-500",
  },
];

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

    const code = await createRoom(selectedGame);

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
      <div className="w-full max-w-md space-y-6">
        <header className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-lg font-black text-white shadow-sm shadow-indigo-900/20">
            {name?.charAt(0).toUpperCase() || "G"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Welcome back</p>
            <h1 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">{name}</h1>
          </div>
        </header>

        <section className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Game mode</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">Choose a game</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {GAME_OPTIONS.map((option) => {
              const isSelected = selectedGame === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedGame(option.id)}
                  className={[
                    "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99] cursor-pointer",
                    isSelected
                      ? "border-indigo-200 bg-indigo-50 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${option.accent}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{option.emoji}</span>
                        <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{option.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{option.description}</p>
                    </div>
                    <span
                      className={[
                        "mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2",
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
                      ].join(" ")}
                    >
                      {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

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
              <p
                role="alert"
                className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {activeError}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
          <button
            type="button"
            onClick={() => {
              setShowJoin((current) => !current);
              setLocalError(null);
              clearError();
            }}
            className="flex w-full items-center justify-between gap-3 text-left"
            disabled={isCreating || isLoadingRoom}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Join existing</p>
              <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">Enter room code</h3>
            </div>
            <svg
              className={[
                "h-5 w-5 text-zinc-500 transition-transform duration-200",
                showJoin ? "rotate-180" : "",
              ].join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showJoin && (
            <form onSubmit={handleJoinRoom} className="mt-4 space-y-3">
              <input
                id="room-code-input"
                type="text"
                value={joinCode}
                onChange={handleRoomCodeChange}
                maxLength={5}
                placeholder="ABCDE"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-center text-2xl font-black tracking-[0.28em] text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                aria-label="Room code"
              />

              {activeError ? (
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{activeError}</p>
              ) : (
                <p className="text-xs text-zinc-500">Use the 5-character code shared by your opponent.</p>
              )}

              <Button
                id="join-game-btn"
                type="submit"
                size="lg"
                variant="secondary"
                className="w-full rounded-2xl"
                disabled={isCreating || isLoadingRoom || isJoining || joinCode.length !== 5}
                isLoading={isJoining}
              >
                Join room
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
