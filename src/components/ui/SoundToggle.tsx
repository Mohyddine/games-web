"use client";

import React, { useState } from "react";
import { isSoundMuted, setSoundMuted } from "@/lib/sound";

export function SoundToggle() {
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  return (
    <button
      type="button"
      aria-label={muted ? "Enable sound" : "Mute sound"}
      onClick={toggle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-lg shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
