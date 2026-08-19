import "dotenv/config";
import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

function requireJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

const JWT_SECRET = requireJwtSecret();

const userSockets = new Map<string, Socket>();

function readCookie(header: string | undefined, name: string): string | undefined {
  return header
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function initSocket(io: Server): void {
  io.use((socket, next) => {
    // The httpOnly hiram_token cookie rides along on the handshake request
    // automatically (browser attaches it) — frontend JS can no longer read it
    // to pass via socket.handshake.auth like before.
    const token = readCookie(socket.handshake.headers.cookie, "hiram_token");
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
      socket.data.userId = payload.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    userSockets.set(userId, socket);
    socket.on("disconnect", () => {
      userSockets.delete(userId);
    });
  });
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  userSockets.get(userId)?.emit(event, data);
}
