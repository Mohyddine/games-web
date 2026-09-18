import React from "react";

interface CountdownOverlayProps {
  count: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  const isGo = count === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400">
          {isGo ? "Here we go!" : "Get ready"}
        </p>

        {/* Number with pulsing rings */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-40 h-40 rounded-full border border-indigo-500/20 animate-pulse-ring" />
          <span
            className="absolute w-28 h-28 rounded-full border border-indigo-500/30 animate-pulse-ring"
            style={{ animationDelay: "350ms" }}
          />

          <div className="relative z-10 flex items-center justify-center w-28 h-28 rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl shadow-indigo-900/30">
            <span
              key={count}
              className={[
                "text-7xl font-black tracking-tight animate-pop-in leading-none",
                isGo ? "text-indigo-400" : "text-white",
              ].join(" ")}
            >
              {isGo ? "!" : count}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-500">
          Symbols are assigned randomly
        </p>
      </div>
    </div>
  );
};
