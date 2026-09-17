"use client";

/**
 * Shared Socket.io client for the admin panel — connects once (module-level
 * singleton, survives across component mounts/section switches) to the
 * standalone realtime service, authenticated via the same `meme_session`
 * cookie already on the request (see realtime/auth.ts — withCredentials
 * lets the browser attach it to the handshake automatically).
 *
 * Same-origin: Nginx proxies /socket.io/ to the realtime service (see
 * deploy/nginx/meme-eg.store), so no separate host/port needs to be
 * configured client-side — io() with no URL connects to the current origin.
 */

import * as React from "react";
import { io, type Socket } from "socket.io-client";

export type AdminRealtimeEvent =
  | "order.created"
  | "order.status_changed"
  | "return.created"
  | "product.low_stock"
  | "review.created";

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/socket.io/",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }
  return sharedSocket;
}

/**
 * Subscribes a callback to one realtime event for the lifetime of the
 * component. Multiple components can each call this independently — they
 * all share the one underlying socket connection.
 */
export function useAdminRealtimeEvent<T = Record<string, unknown>>(
  event: AdminRealtimeEvent,
  handler: (payload: T) => void,
) {
  const handlerRef = React.useRef(handler);
  React.useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  React.useEffect(() => {
    const socket = getSocket();
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}

/** Connection status, for an optional "live" indicator in the admin UI. */
export function useAdminRealtimeStatus(): boolean {
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return connected;
}
