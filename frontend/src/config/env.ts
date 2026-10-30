const DEFAULT_API_URL = "http://localhost:3000";

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

export const COLLABORATION_URL = `${API_URL.replace(/^http/, "ws")}/collaboration`;
