import React from "react";
import type { PlayerSymbol, GameStatus } from "@/types/game";

interface PlayerInfo {
  name: string;
  symbol: PlayerSymbol | null;
  isConnected: boolean;
  isYou: boolean;
  isActive: boolean;
}

interface PlayerCardProps {
  me: PlayerInfo | null;
  opponent: PlayerInfo | null;
  gameStatus: GameStatus | null;
}

const SymbolBadge: React.FC<{ symbol: PlayerSymbol | null }> = ({ symbol }) => {
  if (!symbol) {
    return (
      <span className="text-3xl font-black text-zinc-300 dark:text-zinc-700 leading-none">
        —
      </span>
    );
  }
  return (
    <span
      className={[
        "text-3xl font-black leading-none",
        symbol === "X"
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-amber-600 dark:text-amber-400",
      ].join(" ")}
    >
      {symbol}
    </span>
  );
};

const PlayerSlot: React.FC<{
  player: PlayerInfo | null;
  isActive: boolean;
  gameStatus: GameStatus | null;
  isEmpty?: boolean;
}> = ({ player, isActive, gameStatus, isEmpty }) => {
  if (isEmpty || !player) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
        <span className="text-2xl text-zinc-200 dark:text-zinc-800">—</span>
        <span className="text-xs">Waiting…</span>
      </div>
    );
  }

  const isPlaying = gameStatus === "PLAYING";
  const isFinished =
    gameStatus === "FINISHED" || gameStatus === "REMATCH_PENDING";

  return (
    <div
      className={[
        "flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all duration-200",
        isActive && isPlaying
          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/70 shadow-sm"
          : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800",
      ].join(" ")}
    >
      {/* Name row */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center min-w-0">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[90px]">
          {player.name}
        </span>
        {player.isYou && (
          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
            You
          </span>
        )}
      </div>

      {/* Symbol */}
      <SymbolBadge symbol={player.symbol} />

      {/* Status row */}
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
        {!player.isYou && (
          <span
            className={[
              "w-1.5 h-1.5 rounded-full shrink-0",
              player.isConnected ? "bg-emerald-500" : "bg-amber-500",
            ].join(" ")}
            aria-label={player.isConnected ? "Connected" : "Disconnected"}
          />
        )}
        <span>
          {isFinished
            ? "Done"
            : isPlaying
            ? isActive
              ? "Playing"
              : "Waiting"
            : player.isConnected
            ? "Ready"
            : "Offline"}
        </span>
      </div>
    </div>
  );
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  me,
  opponent,
  gameStatus,
}) => {
  const isPlaying = gameStatus === "PLAYING";

  return (
    <div className="w-full grid grid-cols-2 gap-3">
      <PlayerSlot
        player={me}
        isActive={isPlaying && (me?.isActive ?? false)}
        gameStatus={gameStatus}
      />
      <PlayerSlot
        player={opponent}
        isActive={isPlaying && (opponent?.isActive ?? false)}
        gameStatus={gameStatus}
        isEmpty={!opponent}
      />
    </div>
  );
};
