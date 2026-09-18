"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Button } from "@/components/ui/Button";

// Valid room-code alphabet (backend definition: no O, 0, I, 1)
const VALID_ROOM_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*$/;

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
  const {
    room,
    isLoadingRoom,
    error: roomError,
    createRoom,
    joinRoom,
    clearError,
  } = useRoom();

  const [joinCode, setJoinCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [, startTransition] = useTransition();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isSessionLoading && (!isInitialized || !name?.trim())) {
      startTransition(() => {
        router.replace("/session");
      });
    }
  }, [isInitialized, isSessionLoading, name, router]);

  // Route based on room status
  useEffect(() => {
    if (room) {
      if (room.gameStatus === "WAITING") {
        startTransition(() => { router.push("/waiting"); });
      } else if (
        room.gameStatus === "COUNTDOWN" ||
        room.gameStatus === "PLAYING" ||
        room.gameStatus === "FINISHED"
      ) {
        startTransition(() => { router.push("/game"); });
      }
    }
  }, [room, router]);

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    clearError();
    const rawVal = e.target.value.toUpperCase();
    if (VALID_ROOM_CODE_REGEX.test(rawVal) && rawVal.length <= 5) {
      setJoinCode(rawVal);
    }
  };

  const handleCreateRoom = async () => {
    setLocalError(null);
    clearError();
    setIsCreating(true);
    const code = await createRoom();
    setIsCreating(false);
    if (code) {
      startTransition(() => { router.push("/waiting"); });
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedCode = joinCode.trim().toUpperCase();
    if (trimmedCode.length !== 5) {
      setLocalError("Room code must be exactly 5 characters.");
      return;
    }

    setIsJoining(true);
    const joined = await joinRoom(trimmedCode);
    setIsJoining(false);

    if (joined) {
      startTransition(() => {
        if (joined.gameStatus === "WAITING") {
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
      <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <Spinner />
          <span>Loading session…</span>
        </div>
      </main>
    );
  }

  const initial = name?.charAt(0).toUpperCase();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm shadow-indigo-900/25 shrink-0">
            {initial || " "}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Welcome back</p>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              {name}
            </h1>
          </div>
        </div>

        {/* Action cards */}
        <div className="flex flex-col gap-3">

          {/* Create Game */}
          <button
            id="create-game-btn"
            type="button"
            disabled={isJoining || isLoadingRoom || isCreating}
            onClick={handleCreateRoom}
            className="group w-full text-left p-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl shadow-sm shadow-indigo-900/20 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-base font-bold">
                  {isCreating ? "Creating room…" : "Create Game"}
                </span>
                <span className="text-sm text-indigo-200">
                  Start a new room and invite a friend
                </span>
              </div>
              {isCreating ? (
                <span className="shrink-0 opacity-70">
                  <Spinner />
                </span>
              ) : (
                <svg
                  className="w-5 h-5 shrink-0 text-indigo-300 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
          </button>

          {/* Join Game — expandable */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => {
                setShowJoin((v) => !v);
                setLocalError(null);
                clearError();
              }}
              disabled={isCreating || isLoadingRoom}
              className="w-full text-left p-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Join Game
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Enter a room code to jump in
                  </span>
                </div>
                <svg
                  className={[
                    "w-5 h-5 shrink-0 text-zinc-400 transition-transform duration-200",
                    showJoin ? "rotate-180" : "",
                  ].join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Inline join form */}
            {showJoin && (
              <form
                onSubmit={handleJoinRoom}
                className="px-5 pb-5 pt-4 flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="room-code-input"
                    className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500"
                  >
                    Room Code
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    maxLength={5}
                    placeholder="ABCDE"
                    value={joinCode}
                    onChange={handleRoomCodeChange}
                    disabled={isJoining || isCreating}
                    autoComplete="off"
                    autoFocus
                    spellCheck={false}
                    className="h-14 w-full text-center font-mono text-2xl font-bold tracking-[0.3em] uppercase rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 disabled:opacity-50 transition-all"
                  />
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center">
                    5-character alphanumeric code
                  </p>
                </div>

                {activeError && (
                  <div
                    id="join-error-message"
                    className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 text-xs font-medium text-red-700 dark:text-red-400 text-center"
                  >
                    {activeError}
                  </div>
                )}

                <Button
                  id="join-game-btn"
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  isLoading={isJoining}
                  disabled={joinCode.trim().length !== 5 || isCreating || isLoadingRoom}
                >
                  Join Room
                </Button>
              </form>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
