import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://influencer-affiliate-sales-payment-o2l2.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});
