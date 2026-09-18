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
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 sm:p-6">
      <div
        className={[
          "w-full max-w-[32rem] flex flex-col items-center",
          mounted ? "animate-fade-in-up" : "opacity-0",
        ].join(" ")}
      >
        <div className="mb-7 flex items-center gap-1.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/20">
            <span className="text-xl font-black leading-none text-white">X</span>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 shadow-sm">
            <span className="text-xl font-black leading-none text-amber-400">O</span>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-[4rem] font-black leading-none tracking-[-0.06em] text-zinc-900">
            Tic-Tac-Toe
          </h1>
          <p className="mt-3 text-[1.05rem] text-zinc-600">
            Play with anyone, anywhere.
          </p>
        </div>

        <div className="w-full rounded-[1.7rem] border border-zinc-200/80 bg-[#f3f3f3] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="player-name-input"
              label="Your name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoComplete="off"
              autoFocus
              disabled={isSubmitting || isSessionLoading}
              error={activeError}
              className="!h-[4.15rem] !rounded-2xl !border-[3px] !px-5 !text-[2.25rem] !font-medium !leading-none !tracking-[-0.04em] !text-red-500 !bg-[#f9f9f7] !placeholder:text-red-200"
              style={{ boxShadow: "none" }}
            />

            <Button
              id="continue-button"
              type="submit"
              size="lg"
              className="h-[4.2rem] w-full rounded-[1.2rem] bg-indigo-600 text-[2rem] font-black tracking-[-0.05em] shadow-lg shadow-indigo-900/20 hover:bg-indigo-500"
              isLoading={isSubmitting || (isSessionLoading && isInitialized)}
            >
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-[0.95rem] leading-relaxed text-zinc-500">
          Your session is stored in an HTTP-only cookie.
          <br />
          No account required.
        </p>
      </div>
    </main>
  );
}
