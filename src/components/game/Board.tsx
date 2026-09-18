import React from "react";
import type { BoardState } from "@/types/game";

interface BoardProps {
  board: BoardState;
  disabled?: boolean;
  onCellClick: (index: number) => void;
  mySymbol?: string | null;
  winningCells?: number[];
}

export const Board: React.FC<BoardProps> = ({
  board,
  disabled = false,
  onCellClick,
  winningCells = [],
}) => {
  return (
    <div
      style={{ width: "min(88vw, 420px)" }}
      className="aspect-square grid grid-cols-3 gap-2.5 p-3 rounded-3xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-inner shadow-zinc-200/80 dark:shadow-zinc-900"
    >
      {board.map((cellValue, idx) => {
        const isFilled = cellValue !== null;
        const isClickable = !disabled && !isFilled;
        const isWinning = winningCells.includes(idx);

        return (
          <button
            key={idx}
            type="button"
            disabled={!isClickable}
            onClick={() => onCellClick(idx)}
            aria-label={`Cell ${idx + 1}${cellValue ? `, ${cellValue}` : ", empty"}`}
            className={[
              "relative flex items-center justify-center rounded-2xl",
              "font-black text-5xl sm:text-6xl transition-colors duration-150",
              "select-none focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
              "focus-visible:ring-offset-zinc-100 dark:focus-visible:ring-offset-zinc-900",
              isWinning && cellValue === "X"
                ? "bg-indigo-100 dark:bg-indigo-950/70"
                : isWinning && cellValue === "O"
                ? "bg-amber-100 dark:bg-amber-950/70"
                : isFilled
                ? "bg-white dark:bg-zinc-800 shadow-sm"
                : isClickable
                ? "bg-white dark:bg-zinc-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/25 cursor-pointer shadow-xs active:scale-[0.95]"
                : "bg-zinc-50 dark:bg-zinc-800/30 cursor-not-allowed",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {cellValue && (
              <span
                key={`${idx}-${cellValue}`}
                className={[
                  "animate-pop-in",
                  cellValue === "X"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-amber-600 dark:text-amber-400",
                ].join(" ")}
              >
                {cellValue}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
