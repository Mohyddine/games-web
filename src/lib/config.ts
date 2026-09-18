const requiredPublicUrl = (name: "NEXT_PUBLIC_API_URL" | "NEXT_PUBLIC_SOCKET_URL") => {
  const value = process.env[name]?.trim().replace(/\/+$/, "");

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const API_BASE_URL = requiredPublicUrl("NEXT_PUBLIC_API_URL");
export const SOCKET_URL = requiredPublicUrl("NEXT_PUBLIC_SOCKET_URL");
