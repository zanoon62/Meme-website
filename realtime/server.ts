import { createServer } from "http";
import { Server } from "socket.io";
import { authenticateSocket } from "./auth";
import { startRedisSubscriber } from "./redis-sub";

const PORT = Number(process.env.REALTIME_PORT ?? 4001);

const httpServer = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// No `cors` option needed — this is only ever reached same-origin, via
// Nginx proxying /socket.io/ on the app's own domain.
const io = new Server(httpServer, {
  path: "/socket.io/",
});

io.use((socket, next) => {
  authenticateSocket(socket, next).catch(() => next());
});

startRedisSubscriber(io);

httpServer.listen(PORT, () => {
  console.log(`[realtime] listening on :${PORT}`);
});
