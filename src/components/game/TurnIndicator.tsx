import React from "react";

interface TurnIndicatorProps {
  isMyTurn: boolean;
  opponentName: string;
  timeRemaining: number;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  isMyTurn,
  opponentName,
  timeRemaining,
}) => {
  const isWarning = timeRemaining <= 10 && timeRemaining > 4;
  const isUrgent = timeRemaining <= 4;

  const timerColorClass = isUrgent
    ? "text-red-600 dark:text-red-400"
    : isWarning
    ? "text-amber-600 dark:text-amber-400"
    : "text-zinc-500 dark:text-zinc-400";

  const timerBgClass = isUrgent
    ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900"
    : isWarning
    ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900"
    : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700";

  return (
    <div className="w-full flex items-center justify-between px-0.5">
      {/* Turn label */}
      <div className="flex items-center gap-2">
        <span
          className={[
            "w-2 h-2 rounded-full shrink-0 transition-colors duration-300",
            isMyTurn
              ? "bg-indigo-500 animate-pulse"
              : "bg-zinc-300 dark:bg-zinc-600",
          ].join(" ")}
        />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {isMyTurn ? "Your Turn" : `${opponentName || "Opponent"}'s Turn`}
        </span>
      </div>

      {/* Timer pill */}
      <div
        className={[
          "flex items-center gap-1.5 px-3 py-1 rounded-full border",
          "text-xs font-mono font-bold transition-all duration-300",
          timerBgClass,
          timerColorClass,
          isUrgent ? "animate-pulse" : "",
        ].join(" ")}
      >
        <svg
          className="w-3 h-3 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{timeRemaining}s</span>
      </div>
    </div>
  );
};
