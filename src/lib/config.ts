export const BACKEND_URL =
    typeof window === "undefined"
        ? process.env.INTERNAL_BACKEND_URL || "http://api:8000"
        : process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.dev.assistra.app";