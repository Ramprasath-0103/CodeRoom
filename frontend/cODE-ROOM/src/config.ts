// Backend origin. In production set VITE_API_URL to the deployed backend URL
// (e.g. https://coderoom-api.onrender.com). Falls back to local dev.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// The Yjs (Hocuspocus) websocket shares the backend origin, so derive it:
// http -> ws, https -> wss.
export const WS_URL = API_URL.replace(/^http/, "ws");
