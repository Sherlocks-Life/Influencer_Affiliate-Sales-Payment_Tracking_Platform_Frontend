import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://influencer-affiliate-sales-payment-o2l2.onrender.com";

// ✅ SINGLETON PATTERN (VERY IMPORTANT)
let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],

      // ❌ remove autoConnect spam risk
      autoConnect: false,

      // safer reconnection config
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,

      timeout: 10000
    });
  }

  return socket;
};

// optional helper
export const connectSocket = (token) => {
  const s = getSocket();

  if (!s.connected) {
    s.auth = { token }; // 🔐 important for backend auth
    s.connect();
  }

  return s;
};

export const disconnectSocket = () => {
  const s = getSocket();

  if (s.connected) {
    s.disconnect();
  }
};
