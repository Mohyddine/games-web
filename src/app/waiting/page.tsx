"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useRoom } from "@/context/RoomContext";
import { Button } from "@/components/ui/Button";

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

export default function WaitingPage() {
  const router = useRouter();
  const { playerId, name, isInitialized, isLoading: isSessionLoading } = useSession();
  const { room, isLoadingRoom, restoreRoom, leaveRoom } = useRoom();

  const [isLeaving, setIsLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasCheckedRoom, setHasCheckedRoom] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!isSessionLoading && (!isInitialized || !name?.trim())) {
      startTransition(() => router.replace("/session"));
    }
  }, [isInitialized, isSessionLoading, name, router]);

  useEffect(() => {
    if (room && (room.gameStatus === "COUNTDOWN" || room.gameStatus === "PLAYING")) {
      startTransition(() => router.replace("/game"));
    }
  }, [room, router]);

  useEffect(() => {
    if (isInitialized && !isSessionLoading) {
      (async () => {
        if (!room) {
          const activeRoom = await restoreRoom();
          setHasCheckedRoom(true);
          if (!activeRoom) {
            startTransition(() => router.replace("/home"));
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
      startTransition(() => router.replace("/home"));
    }
  };

  if (isSessionLoading || !hasCheckedRoom || isLoadingRoom) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Spinner />
          <span>Loading room…</span>
        </div>
      </main>
    );
  }

  if (!room) return null;

  const currentPlayer = room.players.find((player) => player.playerId === playerId);
  const isHost = currentPlayer?.isCreator ?? false;
  const spacedCode = room.code.split("").join("  ");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Lobby</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-zinc-900 dark:text-zinc-50">Waiting for opponent</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Share the code below and get ready to play.</p>
        </div>

        <div className="relative flex items-center justify-center">
          <span className="absolute h-16 w-16 rounded-full bg-indigo-500/10 animate-pulse" />
          <span className="absolute h-12 w-12 rounded-full bg-indigo-500/15 animate-pulse" style={{ animationDelay: "250ms" }} />
          <span className="relative h-4 w-4 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/30" />
        </div>

        <div className="rounded-[1.8rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_var(--shadow)] backdrop-blur-xl">
          <div className="mb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Room code</p>
            <div id="room-code-display" className="mt-3 font-mono text-[2.1rem] font-black tracking-[0.22em] text-zinc-900 dark:text-zinc-50">
              {spacedCode}
            </div>
          </div>

          <button
            id="copy-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-[1.8rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Players</p>
            <span className="text-xs text-zinc-500">{room.players.length}/2</span>
          </div>

          <div className="space-y-2">
            {room.players.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={[
                    "h-2.5 w-2.5 rounded-full",
                    player.connected ? "bg-emerald-500" : "bg-amber-500",
                  ].join(" ")}
                  />
                  <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {player.displayName || player.name}
                  </span>
                  {player.playerId === playerId && (
                    <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      You
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-zinc-500">
                  {player.isCreator ? (isHost ? "Host" : "Host") : "Guest"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={handleLeaveRoom}
            disabled={isLeaving}
            isLoading={isLeaving}
          >
            Leave room
          </Button>
        </div>
      </div>
    </main>
  );
}
