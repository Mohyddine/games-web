import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.97] cursor-pointer";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 active:from-indigo-600 active:to-violet-600 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/40",
    secondary:
      "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    outline:
      "border border-[var(--border)] bg-white/40 text-zinc-800 hover:bg-white/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-800/80",
    ghost:
      "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
    danger:
      "border border-red-200 dark:border-red-900/50 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-9 px-3.5 text-sm gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Loading…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
