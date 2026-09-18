"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SessionPage() {
  const router = useRouter();
  const {
    isInitialized,
    isLoading: isSessionLoading,
    initSession,
    error: contextError,
  } = useSession();

  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isInitialized && !isSessionLoading) {
      startTransition(() => {
        router.replace("/home");
      });
    }
  }, [isInitialized, isSessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError("Please enter a username.");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setLocalError("Username must be between 2 and 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      setLocalError("Username must contain only letters, numbers, and spaces.");
      return;
    }

    setIsSubmitting(true);
    const success = await initSession(trimmed);
    setIsSubmitting(false);

    if (success) {
      startTransition(() => {
        router.replace("/home");
      });
    }
  };

  const activeError = localError || contextError;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[32rem] flex flex-col items-center animate-fade-in-up">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/20">
            <span className="text-xl font-black leading-none text-white">🎮</span>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 shadow-sm">
            <span className="text-xl font-black leading-none text-amber-400">⚡</span>
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Multiplayer Arena
          </p>
          <h1 className="mt-3 text-[2.75rem] font-black leading-none tracking-[-0.06em] text-zinc-900 dark:text-zinc-50 sm:text-[3.5rem]">
            Real-Time Multiplayer Games
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
            Create a room, invite a friend, and play your next match in seconds.
          </p>
        </div>

        <div className="w-full rounded-[1.7rem] border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="player-name-input"
              label="Choose your player name"
              type="text"
              value={name}
              placeholder="Enter your username"
              onChange={(e) => {
                setName(e.target.value);
                if (localError) setLocalError(null);
              }}
              maxLength={20}
              autoComplete="off"
              autoFocus
              disabled={isSubmitting || isSessionLoading}
              error={activeError}
              aria-invalid={Boolean(activeError)}
              aria-describedby="player-name-hint"
              className="!h-[4.15rem] !rounded-2xl !border-[3px] !px-5 !text-[2.25rem] !font-medium !leading-none !tracking-[-0.04em] !bg-white dark:!bg-zinc-950"
              style={{ boxShadow: "none" }}
            />
            <p id="player-name-hint" className="-mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Use 2–20 letters, numbers, or spaces.
            </p>

            <Button
              id="continue-button"
              type="submit"
              size="lg"
              disabled={!name.trim() || isSubmitting || isSessionLoading}
              className="h-[4.2rem] w-full rounded-[1.2rem] bg-indigo-600 text-[1.8rem] font-black tracking-[-0.05em] shadow-lg shadow-indigo-900/20 hover:bg-indigo-500"
              isLoading={isSubmitting || (isSessionLoading && isInitialized)}
            >
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-[0.95rem] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Your player session is stored in an HTTP-only cookie.
          <br />
          No account required.
        </p>
      </div>
    </main>
  );
}
