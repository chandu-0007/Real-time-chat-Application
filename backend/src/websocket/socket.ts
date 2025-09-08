import { PrismaClient } from "@prisma/client";
import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const Prisma = new PrismaClient();
const rooms = new Map<number, Set<WebSocket>>();

interface JwtPayload {
  id: number;
}

interface MessagePayload {
  type: string;
  token?: string;
  roomId?: number;
  roomName?: string;
  text?: string;
}

// ---------------------- AUTH ----------------------
function authenticate(token: string | undefined, socket: WebSocket): JwtPayload | null {
  if (!process.env.JWT_SECRET) {
    socket.send(JSON.stringify({ status: false, type: "auth", message: "JWT secret not configured" }));
    socket.close();
    return null;
  }

  try {
    const decoded = jwt.verify(token || "", process.env.JWT_SECRET) as JwtPayload;
    if (!decoded || typeof decoded.id !== "number") {
      throw new Error("Invalid token");
    }
    return decoded;
  } catch (err) {
    socket.send(JSON.stringify({ status: false, type: "auth", message: "Invalid token" }));
    socket.close();
    return null;
  }
}

// ---------------------- HANDLERS ----------------------
async function handleCreate(socket: WebSocket, user: JwtPayload, payload: MessagePayload) {
  if (!payload.roomName) {
    socket.send(JSON.stringify({ status: false, type: "created", message: "Room name required" }));
    return;
  }

  const exist = await Prisma.room.findFirst({
    where: { roomName: payload.roomName, createdBy: user.id },
  });

  if (exist) {
    socket.send(JSON.stringify({ status: false, type: "created", message: "Room already exists" }));
    return;
  }

  const room = await Prisma.room.create({
    data: { roomName: payload.roomName, createdBy: user.id },
  });

  await Prisma.roomMember.create({
    data: { roomId: room.id, userId: user.id },
  });

  socket.send(
    JSON.stringify({
      status: true,
      type: "created",
      room: { id: room.id, name: room.roomName },
      message: "Room created successfully",
    })
  );
}

async function handleJoin(socket: WebSocket, user: JwtPayload, payload: MessagePayload) {
  if (!payload.roomId) {
    socket.send(JSON.stringify({ status: false, type: "joined", message: "Room ID required" }));
    return;
  }

  const existroom = await Prisma.room.findFirst({ where: { id: payload.roomId } });
  if (!existroom) {
    socket.send(JSON.stringify({ status: false, type: "joined", message: "Room doesn't exist" }));
    return;
  }

  const memberExisted = await Prisma.roomMember.findFirst({
    where: { userId: user.id, roomId: payload.roomId },
  });

  if (!memberExisted) {
    await Prisma.roomMember.create({
      data: { roomId: payload.roomId, userId: user.id },
    });
  }

  if (!rooms.has(payload.roomId)) {
    rooms.set(payload.roomId, new Set());
  }
  rooms.get(payload.roomId)?.add(socket);

  socket.send(JSON.stringify({ status: true, type: "joined", message: "Successfully joined the room" }));
}

async function handleMessage(socket: WebSocket, user: JwtPayload, payload: MessagePayload) {
  if (!payload.roomId || !payload.text) {
    socket.send(JSON.stringify({ status: false, type: "message", message: "Room ID and text required" }));
    return;
  }

  if (!rooms.has(payload.roomId)) {
    rooms.set(payload.roomId, new Set());
  }
  rooms.get(payload.roomId)?.add(socket);

  const message = await Prisma.message.create({
    data: { userId: user.id, roomId: payload.roomId, message: payload.text },
  });

  const allsockets = rooms.get(payload.roomId);
  if (allsockets) {
    for (const client of allsockets) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            status: true,
            type: "message",
            text: payload.text,
            userId: user.id,
            roomId: payload.roomId,
            messageId: message.id,
            isOwn : client === socket,
            createdAt: message.createdAt,
          })
        );
      }
    }
  }
}

// ---------------------- MAIN SETUP ----------------------
export function setUpWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    console.log("Client connected");

    let user: JwtPayload | null = null;

    // Clean up on disconnect
    socket.on("close", () => {
      for (const [roomId, clients] of rooms.entries()) {
        clients.delete(socket);
        if (clients.size === 0) {
          rooms.delete(roomId);
        }
      }
    });

    socket.on("message", async (raw) => {
      let payload: MessagePayload;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ status: false, message: "Invalid JSON" }));
        return;
      }

      // First step must be auth
      if (!user && payload.type !== "auth") {
        socket.send(JSON.stringify({ status: false, message: "Unauthorized" }));
        return;
      }

      switch (payload.type) {
        case "auth":
          user = authenticate(payload.token, socket);
          if (user) {
            socket.send(JSON.stringify({ status: true, type: "auth", message: "Authentication successful" }));
          }
          break;

        case "create":
          if (user) await handleCreate(socket, user, payload);
          break;

        case "join":
          if (user) await handleJoin(socket, user, payload);
          break;

        case "message":
          if (user) await handleMessage(socket, user, payload);
          break;

        default:
          socket.send(JSON.stringify({ status: false, message: "Unknown action type" }));
      }
    });
  });
}
