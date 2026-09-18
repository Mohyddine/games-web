"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, ApiClientError } from "@/lib/api";

const SESSION_MARKER_KEY = "tic-tac-toe-session-created";

interface SessionContextValue {
  playerId: string | null;
  name: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initSession: (name: string) => Promise<boolean>;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initSession = useCallback(async (customName: string): Promise<boolean> => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setError("Please enter a username before continuing.");
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.createOrRestoreSession(trimmedName);
      setPlayerId(data.playerId);
      setName(data.name);
      setIsInitialized(true);
      window.localStorage.setItem(SESSION_MARKER_KEY, "true");
      return true;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          err.errorCode === "INVALID_NAME"
            ? "Please enter a valid username using 2–20 letters, numbers, or spaces."
            : err.message
        );
      } else {
        setError("An unexpected error occurred while setting up your session.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setPlayerId(null);
    setName(null);
    setIsInitialized(false);
    setError(null);
    window.localStorage.removeItem(SESSION_MARKER_KEY);
  }, []);

  // Only restore sessions that this browser has explicitly created through the form.
  // The session endpoint creates a new session when called without a cookie, so calling
  // it for every first visit would skip the name form.
  useEffect(() => {
    let isMounted = true;

    if (window.localStorage.getItem(SESSION_MARKER_KEY) !== "true") {
      const loadingTimer = window.setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, 0);
      return () => {
        isMounted = false;
        window.clearTimeout(loadingTimer);
      };
    }

    (async () => {
      try {
        const data = await api.createOrRestoreSession();
        if (isMounted && data.name.trim()) {
          setPlayerId(data.playerId);
          setName(data.name);
          setIsInitialized(true);
        } else if (isMounted) {
          window.localStorage.removeItem(SESSION_MARKER_KEY);
        }
      } catch {
        // If restoring session fails on first load (e.g. no cookie exists yet),
        // keep isInitialized false without setting a hard user-facing error.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        playerId,
        name,
        isInitialized,
        isLoading,
        error,
        initSession,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
