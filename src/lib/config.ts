const DEFAULT_BACKEND_URL = "https://games-api.codewithmehyo.com";

const publicUrl = (
  name: "NEXT_PUBLIC_API_URL" | "NEXT_PUBLIC_SOCKET_URL",
  fallback: string
) => process.env[name]?.trim().replace(/\/+$/, "") || fallback;

export const API_BASE_URL = publicUrl("NEXT_PUBLIC_API_URL", DEFAULT_BACKEND_URL);
export const SOCKET_URL = publicUrl("NEXT_PUBLIC_SOCKET_URL", DEFAULT_BACKEND_URL);
