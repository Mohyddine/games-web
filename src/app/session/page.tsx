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
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (trimmed.length > 0) {
      if (trimmed.length < 2 || trimmed.length > 20) {
        setLocalError("Name must be between 2 and 20 characters.");
        return;
      }
      if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
        setLocalError("Name must contain only letters, numbers, and spaces.");
        return;
      }
    }

    setIsSubmitting(true);
    const success = await initSession(trimmed.length > 0 ? trimmed : undefined);
    setIsSubmitting(false);

    if (success) {
      startTransition(() => {
        router.replace("/home");
      });
    }
  };

  const activeError = localError || contextError;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen">
      <div
        className={[
          "w-full max-w-sm flex flex-col items-center",
          mounted ? "animate-fade-in-up" : "opacity-0",
        ].join(" ")}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-1.5 mb-7">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
            <span className="text-white font-black text-xl leading-none">X</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center shadow-sm">
            <span className="text-amber-400 font-black text-xl leading-none">O</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[2rem] font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
            Tic-Tac-Toe
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Play with anyone, anywhere.
          </p>
        </div>

        {/* Form card */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="player-name-input"
              label="Your name"
              type="text"
              placeholder="e.g. Alex (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoComplete="off"
              autoFocus
              disabled={isSubmitting || isSessionLoading}
              error={activeError}
              hint="Leave blank for an auto-generated guest name."
            />

            <Button
              id="continue-button"
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting || (isSessionLoading && isInitialized)}
            >
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-5 text-xs text-center text-zinc-400 dark:text-zinc-600 leading-relaxed">
          Your session is stored in an HTTP-only cookie.
          <br />
          No account required.
        </p>
      </div>
    </main>
  );
}
