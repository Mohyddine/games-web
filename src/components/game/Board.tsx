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
      className="mx-auto w-full max-w-[380px] rounded-3xl p-3"
      style={{
        background: "var(--bg-sunken)",
        border: "1px solid var(--border)",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div className="grid aspect-square w-full grid-cols-3 gap-2.5">
        {board.map((cellValue, idx) => {
          const isFilled = cellValue !== null;
          const isClickable = !disabled && !isFilled;
          const isWinning = winningCells.includes(idx);

          const isX = cellValue === "X";
          const isO = cellValue === "O";

          return (
            <button
              key={idx}
              type="button"
              disabled={!isClickable}
              onClick={() => onCellClick(idx)}
              aria-label={`Cell ${idx + 1}${cellValue ? `, ${cellValue}` : ", empty"}`}
              className="flex aspect-square w-full items-center justify-center rounded-2xl text-4xl font-black sm:text-5xl select-none focus-visible:outline-none transition-all duration-200"
              style={{
                background: isWinning
                  ? isX
                    ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))"
                    : "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))"
                  : isFilled
                    ? "var(--bg-surface)"
                    : isClickable
                      ? "var(--bg-surface)"
                      : "var(--bg-raised)",
                border: isWinning
                  ? isX
                    ? "2px solid rgba(99,102,241,0.5)"
                    : "2px solid rgba(245,158,11,0.5)"
                  : `1.5px solid var(--border)`,
                color: isWinning
                  ? isX ? "#6366f1" : "#f59e0b"
                  : isX
                    ? "#6366f1"
                    : isO
                      ? "#f59e0b"
                      : "var(--fg-subtle)",
                boxShadow: isWinning
                  ? isX
                    ? "0 4px 16px rgba(99,102,241,0.25)"
                    : "0 4px 16px rgba(245,158,11,0.25)"
                  : isClickable
                    ? "var(--shadow-sm)"
                    : "none",
                cursor: isClickable ? "pointer" : "default",
                transform: isWinning ? "scale(1.04)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (isClickable) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-md)";
                }
              }}
              onMouseLeave={(e) => {
                if (isClickable) {
                  (e.currentTarget as HTMLButtonElement).style.transform = isWinning ? "scale(1.04)" : "scale(1)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-sm)";
                }
              }}
            >
              {cellValue ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
};
