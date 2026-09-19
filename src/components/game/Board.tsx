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
    <div className="mx-auto w-full max-w-[420px] rounded-[1.8rem] border border-zinc-200 bg-zinc-100 p-3 shadow-inner shadow-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-zinc-900">
      <div className="grid aspect-square w-full grid-cols-3 gap-2.5">
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
                "flex aspect-square w-full items-center justify-center rounded-2xl border text-4xl font-black sm:text-5xl",
                isWinning
                  ? cellValue === "X"
                    ? "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                    : "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                  : isFilled
                    ? "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    : isClickable
                      ? "border-zinc-200 bg-white text-zinc-900 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-indigo-950/25"
                      : "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-500",
                cellValue === "X" ? "text-indigo-600 dark:text-indigo-400" : "",
                cellValue === "O" ? "text-amber-600 dark:text-amber-400" : "",
                "select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 dark:focus-visible:ring-offset-zinc-900",
              ].join(" ")}
            >
              {cellValue ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
};
