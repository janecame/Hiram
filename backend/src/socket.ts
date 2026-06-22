import "dotenv/config";
import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "hiram-secret";

const userSockets = new Map<string, Socket>();

export function initSocket(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth["token"] as string | undefined;
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
