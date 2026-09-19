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
      <main className="flex min-h-screen flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--fg-muted)" }}>
          <Spinner />
          <span>Loading room…</span>
        </div>
      </main>
    );
  }

  if (!room) return null;

  const currentPlayer = room.players.find((p) => p.playerId === playerId);
  const isHost = currentPlayer?.isCreator ?? false;
  const codeChars = room.code.split("");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-4 animate-fade-up">

        {/* Header */}
        <div className="text-center">
          <p className="label-tag">Lobby</p>
          <h1 className="mt-2 text-2xl font-black" style={{ color: "var(--fg)" }}>
            Waiting for opponent
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
            Share the code to invite a friend
          </p>
        </div>

        {/* Animated waiting indicator */}
        <div className="flex items-center justify-center py-2">
          <div className="relative flex items-center justify-center h-16 w-16">
            <span
              className="absolute h-16 w-16 rounded-full animate-ping"
              style={{ background: "var(--accent)", opacity: 0.15 }}
            />
            <span
              className="absolute h-12 w-12 rounded-full animate-ping delay-150"
              style={{ background: "var(--accent)", opacity: 0.2, animationDuration: "1.5s" }}
            />
            <span
              className="relative h-6 w-6 rounded-full animate-pulse-soft"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            />
          </div>
        </div>

        {/* Room code card */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <p className="label-tag text-center mb-4">Room Code</p>

          {/* Code display — individual letter boxes */}
          <div id="room-code-display" className="flex items-center justify-center gap-2 mb-5">
            {codeChars.map((char, i) => (
              <div
                key={i}
                className="flex h-12 w-10 items-center justify-center rounded-xl text-xl font-black animate-pop"
                style={{
                  animationDelay: `${i * 50}ms`,
                  background: "var(--bg-raised)",
                  border: "1.5px solid var(--accent-border)",
                  color: "var(--accent)",
                  fontFamily: "var(--font-geist-mono)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {char}
              </div>
            ))}
          </div>

          {/* Copy button */}
          <button
            id="copy-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="flex w-full items-center justify-center gap-2 rounded-2xl h-11 text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
            style={{
              background: copied ? "rgba(16,185,129,0.12)" : "var(--accent-soft)",
              border: copied ? "1.5px solid rgba(16,185,129,0.4)" : "1.5px solid var(--accent-border)",
              color: copied ? "var(--green)" : "var(--accent)",
            }}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Players list */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="label-tag">Players</p>
            <span
              className="text-xs font-bold rounded-full px-2 py-0.5"
              style={{
                background: "var(--bg-raised)",
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {room.players.length}/2
            </span>
          </div>

          <div className="space-y-2">
            {room.players.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center gap-3 rounded-2xl px-3 py-3"
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Avatar initial */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{
                    background: player.playerId === playerId
                      ? "linear-gradient(135deg, var(--accent), var(--accent-2))"
                      : "linear-gradient(135deg, #64748b, #475569)",
                  }}
                >
                  {(player.displayName || player.name).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>
                      {player.displayName || player.name}
                    </span>
                    {player.playerId === playerId && (
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-border)",
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                    {player.isCreator ? "Host" : "Guest"}
                  </p>
                </div>
                {/* Status dot */}
                <div className="relative flex items-center">
                  {player.connected && (
                    <span
                      className="absolute h-3 w-3 rounded-full animate-ping"
                      style={{ background: "var(--green)", opacity: 0.5 }}
                    />
                  )}
                  <span
                    className="relative h-2.5 w-2.5 rounded-full"
                    style={{
                      background: player.connected ? "var(--green)" : "var(--amber)",
                      boxShadow: player.connected ? "0 0 6px var(--green)" : "none",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Empty slot */}
            {room.players.length < 2 && (
              <div
                className="flex items-center gap-3 rounded-2xl px-3 py-3"
                style={{
                  background: "var(--bg-sunken)",
                  border: "1.5px dashed var(--border)",
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--bg-raised)", border: "1px dashed var(--border)" }}
                >
                  <span style={{ color: "var(--fg-subtle)" }}>?</span>
                </div>
                <span className="text-sm" style={{ color: "var(--fg-subtle)" }}>
                  Waiting for player…
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Leave button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-2xl"
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          isLoading={isLeaving}
        >
          ← Leave Room
        </Button>
      </div>
    </main>
  );
}
