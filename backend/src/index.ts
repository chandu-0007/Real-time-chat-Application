// src/index.ts
import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import http from "http";
import { PrismaClient } from "@prisma/client";
import { setUpWebSocket } from "./websocket/socket";

dotenv.config();

const app = express();
const Prisma = new PrismaClient();
const port = process.env.PORT || 3003;

// ------------------ MIDDLEWARE ------------------
app.use(express.json());
app.use(cors());

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// ------------------ VALIDATION ------------------
const userType = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(20),
});

// ------------------ AUTH MIDDLEWARE ------------------
const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ status: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ status: false, message: "Invalid token" });
  }
};

// ------------------ ROUTES ------------------

// REGISTER
app.post("/users/register", async (req: Request, res: Response) => {
  const parsed = userType.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: false, message: "Invalid username or password" });
  }

  const { username, password } = parsed.data;

  try {
    const existing = await Prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ status: false, message: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await Prisma.user.create({
      data: { username, passwordHash: hash },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    return res.status(201).json({
      status: true,
      token,
      message: "Successfully registered",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// LOGIN
app.post("/users/login", async (req: Request, res: Response) => {
  const parsed = userType.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ status: false, message: "Invalid username or password" });
  }

  const { username, password } = parsed.data;

  try {
    const user = await Prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ status: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

    return res.status(200).json({ status: true, token, message: "Login successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// PROTECTED ROUTES
app.use(auth);

// GET ME
app.get("/users/me", async (req: Request, res: Response) => {
  const user = await Prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true },
  });

  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  return res.status(200).json({ status: true, user });
});

// GET MY ROOMS
app.get("/users/rooms", async (req: Request, res: Response) => {
  try {
    const memberships = await Prisma.roomMember.findMany({
      where: { userId: req.userId! },
      include: { room: { select: { id: true, roomName: true } } },
    });
       
    return res.status(200).json({
      status: true,
      rooms: memberships.map((m) => ({
        id: m.room.id,
        roomName: m.room.roomName,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Error fetching rooms" });
  }
});

// GET MESSAGES
app.get("/users/rooms/:roomId/messages", async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const limit = Number(req.query.limit) || 20;

  try {
    const messages = await Prisma.message.findMany({
      where: { roomId: Number(roomId) },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { username: true } } },
    });
 
    return res.status(200).json({
      status: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        roomId: msg.roomId,
        message: msg.message,
        createdAt: msg.createdAt,
        user: msg.user.username,
        isOwn: msg.userId === req.userId,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Error fetching messages" });
  }
});
  
app.get("/users/room/:roomId/info" , async (req : Request , res : Response)=>{
  const {roomId}  = req.params;
  try{
     const room = await Prisma.room.findUnique({
    where: { id: Number(roomId) },
    select: { id: true, roomName: true, createdBy: true },
  })
  const members = await Prisma.roomMember.findMany({
    where :{
      roomId : Number(roomId)
    },
    include:{
      user :{
        select :{username : true }
      },
    }
  })
   res.status(200).json({
    roomId : room?.id , 
    roomName:room?.roomName ,
    createdBy : room?.createdBy , 
    members : members.map((mem)=>[{
      username : mem.user.username , 
      userId : mem.userId , 
      joinedAt : mem.joinedAt , 
    }]),
    NoOfMembers : members.length 
   })
  }catch(err){
    console.error(err);
    res.status(500).json({
      status : false , 
      message : "error at server"
    })
  }
  

})
// DELETE ROOM
app.delete("/users/rooms/:roomId", async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    const room = await Prisma.room.findFirst({
      where: { id: Number(roomId), createdBy: req.userId },
    });

    if (!room) {
      return res.status(403).json({ status: false, message: "Not allowed or room not found" });
    }

    await Prisma.room.delete({ where: { id: room.id } });

    return res.status(200).json({ status: true, message: "Room deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Error deleting room" });
  }
});

// LEAVE ROOM
app.delete("/users/rooms/:roomId/leave", async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    const member = await Prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: req.userId!, roomId: Number(roomId) } },
    });

    if (!member) {
      return res.status(404).json({ status: false, message: "Not a member of this room" });
    }

    await Prisma.roomMember.delete({ where: { userId_roomId: { userId: req.userId!, roomId: Number(roomId) } } });

    return res.status(200).json({ status: true, message: "Left room successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Error leaving room" });
  }
});

// ------------------ START SERVER ------------------
const server = http.createServer(app);

// Attach WebSocket server to same port
setUpWebSocket(server);

server.listen(port, () => {
  console.log(`🚀 Server (HTTP + WS) running on http://localhost:${port}`);
});
