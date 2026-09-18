"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Button } from "@/components/ui/Button";

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

export default function WaitingPage() {
  const router = useRouter();
  const { playerId, name, isInitialized, isLoading: isSessionLoading } = useSession();
  const { room, isLoadingRoom, restoreRoom, leaveRoom } = useRoom();

  const [isLeaving, setIsLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasCheckedRoom, setHasCheckedRoom] = useState(false);
  const [, startTransition] = useTransition();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isSessionLoading && !isInitialized) {
      startTransition(() => {
        router.replace("/session");
      });
    }
  }, [isInitialized, isSessionLoading, router]);

  // Automatically navigate to /game when countdown/match starts
  useEffect(() => {
    if (room && (room.gameStatus === "COUNTDOWN" || room.gameStatus === "PLAYING")) {
      startTransition(() => {
        router.replace("/game");
      });
    }
  }, [room, router]);

  // Restore room on initial mount if not yet populated
  useEffect(() => {
    if (isInitialized && !isSessionLoading) {
      (async () => {
        if (!room) {
          const activeRoom = await restoreRoom();
          setHasCheckedRoom(true);
          if (!activeRoom) {
            startTransition(() => {
              router.replace("/home");
            });
          }
        } else {
          setHasCheckedRoom(true);
        }
      })();
    }
  }, [isInitialized, isSessionLoading, room, restoreRoom, router]);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    const success = await leaveRoom();
    setIsLeaving(false);
    if (success) {
      startTransition(() => {
        router.replace("/home");
      });
    }
  };

  if (isSessionLoading || !hasCheckedRoom || isLoadingRoom) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <Spinner />
          <span>Loading room…</span>
        </div>
      </main>
    );
  }

  if (!room) return null;

  const currentPlayer = room.players.find((p) => p.playerId === playerId);
  const isHost = currentPlayer?.isCreator ?? false;

  // Render code with wider spacing
  const spacedCode = room.code.split("").join("  ");

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Waiting for opponent
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Share your code to invite a friend
          </p>
        </div>

        {/* Animated pulsing indicator */}
        <div className="relative flex items-center justify-center h-14 w-14">
          <span className="absolute w-14 h-14 rounded-full bg-indigo-500/10 animate-pulse-ring" />
          <span
            className="absolute w-10 h-10 rounded-full bg-indigo-500/15 animate-pulse-ring"
            style={{ animationDelay: "400ms" }}
          />
          <span className="relative w-4 h-4 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/40" />
        </div>

        {/* Room code card */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Room Code
          </span>

          <div
            id="room-code-display"
            className="font-mono text-4xl font-black tracking-[0.2em] text-zinc-900 dark:text-zinc-50 select-all leading-none"
          >
            {spacedCode}
          </div>

          <button
            id="copy-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 cursor-pointer"
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Players list */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Players ({room.players.length}/2)
          </span>

          <div className="flex flex-col gap-1.5">
            {room.players.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {p.displayName || p.name}
                  </span>
                  {p.playerId === playerId && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      You
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400 shrink-0">
                  {p.isCreator ? "Host" : "Guest"}
                </span>
              </div>
            ))}

            {room.players.length < 2 && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full border-2 border-zinc-300 dark:border-zinc-700 shrink-0" />
                  <span className="text-sm italic">Waiting for player 2…</span>
                </div>
                <span className="text-xs">Guest</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col items-center gap-3">
          <Button
            id="leave-game-btn"
            variant="danger"
            size="md"
            className="w-full"
            isLoading={isLeaving}
            onClick={handleLeaveRoom}
          >
            Leave Room
          </Button>

          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Playing as{" "}
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">{name}</span>
            {" · "}
            {isHost ? "Host" : "Guest"}
          </p>
        </div>
      </div>
    </main>
  );
}
