"use client";

import React, { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Button } from "@/components/ui/Button";
import type { GameType } from "@/types/game";

const VALID_ROOM_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*$/;

const GAME_OPTIONS: Array<{
  id: GameType;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  glow: string;
}> = [
  {
    id: "TIC_TAC_TOE",
    title: "XO",
    subtitle: "Tic-Tac-Toe",
    icon: "/xo-game.svg",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glow: "rgba(99,102,241,0.3)",
  },
  {
    id: "ROCK_PAPER_SCISSORS",
    title: "RPS",
    subtitle: "Rock Paper Scissors",
    icon: "/rps-game.svg",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    glow: "rgba(245,158,11,0.3)",
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
      <main className="flex min-h-screen flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--fg-muted)" }}>
          <Spinner />
          <span>Loading session…</span>
        </div>
      </main>
    );
  }

  const selectedOption = GAME_OPTIONS.find((g) => g.id === selectedGame)!;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-4 animate-fade-up">

        {/* Profile header */}
        <div
          className="flex items-center gap-4 rounded-3xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Avatar */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              boxShadow: "0 4px 12px var(--accent-glow)",
            }}
          >
            {name?.charAt(0).toUpperCase() || "G"}
          </div>
          <div className="min-w-0">
            <p className="label-tag">Welcome back</p>
            <h1 className="mt-0.5 truncate text-lg font-extrabold" style={{ color: "var(--fg)" }}>
              {name}
            </h1>
          </div>
          {/* Online indicator */}
          <div className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>Online</span>
          </div>
        </div>

        {/* Game selector */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="mb-4">
            <p className="label-tag">Select game</p>
            <h2 className="mt-1 text-xl font-black" style={{ color: "var(--fg)" }}>
              Choose your battle
            </h2>
          </div>

          {/* Game cards — app icon style */}
          <div className="grid grid-cols-2 gap-3">
            {GAME_OPTIONS.map((option, i) => {
              const isSelected = selectedGame === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedGame(option.id)}
                  className={`group relative overflow-hidden rounded-2xl p-1 transition-all duration-300 cursor-pointer focus-visible:outline-none animate-fade-up`}
                  style={{
                    animationDelay: `${i * 60}ms`,
                    border: isSelected
                      ? `2px solid var(--accent)`
                      : "2px solid var(--border)",
                    boxShadow: isSelected
                      ? `0 8px 24px ${option.glow}, var(--shadow-md)`
                      : "var(--shadow-sm)",
                    background: isSelected ? "var(--accent-soft)" : "var(--bg-raised)",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  {/* Game image — app icon style */}
                  <div
                    className="relative h-28 w-full overflow-hidden rounded-xl"
                    style={{ background: isSelected ? option.gradient : "var(--bg-sunken)" }}
                  >
                    <Image
                      src={option.icon}
                      width={512}
                      height={512}
                      alt={option.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="px-1 pt-2.5 pb-1.5 text-left">
                    <p className="text-base font-black" style={{ color: "var(--fg)" }}>{option.title}</p>
                    <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{option.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rounds selector for RPS */}
          {selectedGame === "ROCK_PAPER_SCISSORS" && (
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <label
                htmlFor="rps-rounds"
                className="block mb-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: "#d97706" }}
              >
                ⚡ Number of rounds
              </label>
              <select
                id="rps-rounds"
                value={selectedRounds}
                onChange={(event) => setSelectedRounds(Number(event.target.value))}
                className="input-base h-10 px-3 text-sm font-semibold"
                style={{
                  borderColor: "rgba(245,158,11,0.4)",
                  background: "var(--bg-surface)",
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((option) => (
                  <option key={option} value={option}>
                    {option} {option === 1 ? "round" : "rounds"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Create button */}
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
              🚀 Create Room
            </Button>
            {activeError && !showJoin && (
              <p role="alert" className="mt-3 text-sm font-medium" style={{ color: "var(--red)" }}>
                {activeError}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--fg-subtle)" }}>or join existing</span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          {/* Join section */}
          <div className="mt-4">
            {!showJoin ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-2xl"
                onClick={() => setShowJoin(true)}
              >
                🔑 Join with Room Code
              </Button>
            ) : (
              <form onSubmit={handleJoinRoom} className="space-y-3 animate-fade-up">
                <div>
                  <label
                    className="block mb-2 text-sm font-semibold"
                    htmlFor="join-code-input"
                    style={{ color: "var(--fg)" }}
                  >
                    Enter room code
                  </label>
                  <input
                    id="join-code-input"
                    value={joinCode}
                    onChange={handleRoomCodeChange}
                    inputMode="text"
                    maxLength={5}
                    placeholder="ABCDE"
                    className="input-base h-14 px-4 text-center text-2xl font-black tracking-[0.3em]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      borderColor: activeError ? "var(--red)" : undefined,
                    }}
                  />
                  {activeError && showJoin && (
                    <p role="alert" className="mt-2 text-sm font-medium" style={{ color: "var(--red)" }}>
                      {activeError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 rounded-2xl"
                    onClick={() => { setShowJoin(false); setJoinCode(""); clearError(); }}
                    disabled={isJoining}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-2xl"
                    disabled={joinCode.length !== 5 || isJoining || isLoadingRoom}
                    isLoading={isJoining}
                  >
                    Join Room
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
