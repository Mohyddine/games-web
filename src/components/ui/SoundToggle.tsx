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
      className="group inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        color: "var(--fg-muted)",
      }}
    >
      <span className="text-base transition-transform duration-200 group-hover:scale-110">
        {muted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}
