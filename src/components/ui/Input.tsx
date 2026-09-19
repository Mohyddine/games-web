import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, style, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold"
            style={{ color: "var(--fg)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-base h-12 px-4 text-base disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          style={{
            borderColor: error ? "var(--red)" : undefined,
            boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.12)" : undefined,
            ...style,
          }}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>{hint}</p>
        )}
        {error && (
          <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--red)" }}>
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
