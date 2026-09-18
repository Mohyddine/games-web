"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, ApiClientError } from "@/lib/api";

interface SessionContextValue {
  playerId: string | null;
  name: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initSession: (name?: string) => Promise<boolean>;
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

  const initSession = useCallback(async (customName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.createOrRestoreSession(customName);
      setPlayerId(data.playerId);
      setName(data.name);
      setIsInitialized(true);
      return true;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
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
  }, []);

  // Restore session automatically on initial mount using the HTTP-only cookie
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api.createOrRestoreSession();
        if (isMounted) {
          setPlayerId(data.playerId);
          setName(data.name);
          setIsInitialized(true);
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
