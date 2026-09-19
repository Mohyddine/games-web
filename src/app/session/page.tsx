"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { Button } from "@/components/ui/Button";

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
      <div className="w-full max-w-sm animate-fade-up flex flex-col items-center">

        {/* App icon */}
        <div className="mb-8 relative">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[28px] animate-glow-pulse"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <span className="text-4xl" role="img" aria-label="games">🎮</span>
          </div>
          {/* Ping dot */}
          <span
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--green)", boxShadow: "0 0 8px var(--green)" }}
          >
            <span className="animate-ping absolute h-full w-full rounded-full opacity-50" style={{ background: "var(--green)" }} />
            <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
          </span>
        </div>

        {/* Headlines */}
        <div className="mb-8 text-center">
          <p className="label-tag mb-3">Multiplayer Arena</p>
          <h1
            className="text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl"
            style={{ color: "var(--fg)" }}
          >
            Play&nbsp;
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Together
            </span>
          </h1>
          <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Real-time 1v1 games with friends. No account needed.
          </p>
        </div>

        {/* Game badges */}
        <div className="mb-8 flex items-center gap-3">
          {[
            { icon: "❌", label: "XO", color: "#6366f1" },
            { icon: "✂️", label: "RPS", color: "#f59e0b" },
          ].map((g) => (
            <div
              key={g.label}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
              style={{
                background: `${g.color}18`,
                border: `1px solid ${g.color}40`,
                color: g.color,
              }}
            >
              <span>{g.icon}</span>
              <span>{g.label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="w-full rounded-3xl p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="player-name-input"
                className="block mb-2 text-sm font-semibold"
                style={{ color: "var(--fg)" }}
              >
                Choose your name
              </label>
              <input
                id="player-name-input"
                type="text"
                value={name}
                placeholder="e.g. Shadow Wolf"
                onChange={(e) => {
                  setName(e.target.value);
                  if (localError) setLocalError(null);
                }}
                maxLength={20}
                autoComplete="off"
                autoFocus
                disabled={isSubmitting || isSessionLoading}
                aria-invalid={Boolean(activeError)}
                aria-describedby={activeError ? "name-error" : "name-hint"}
                className="input-base h-12 px-4 text-base font-semibold"
                style={{
                  borderColor: activeError ? "var(--red)" : undefined,
                }}
              />
              {activeError ? (
                <p id="name-error" role="alert" className="mt-2 text-sm font-medium" style={{ color: "var(--red)" }}>
                  {activeError}
                </p>
              ) : (
                <p id="name-hint" className="mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  2–20 letters, numbers, or spaces
                </p>
              )}
            </div>

            <Button
              id="continue-button"
              type="submit"
              size="lg"
              className="w-full rounded-2xl text-base font-bold"
              disabled={!name.trim() || isSubmitting || isSessionLoading}
              isLoading={isSubmitting || (isSessionLoading && isInitialized)}
            >
              Enter Arena →
            </Button>
          </form>
        </div>

        <p className="mt-6 text-xs text-center leading-relaxed" style={{ color: "var(--fg-subtle)" }}>
          Session stored in an HTTP-only cookie · No signup required
        </p>
      </div>
    </main>
  );
}
