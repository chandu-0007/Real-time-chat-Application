import { PrismaClient } from "@prisma/client";
import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { stat } from "fs";
//    playload {
//      type : join , 
//      roomId : id,
//      userId : id 
//    }
//  playload {
//      type : create , 
//      roomName  : "redroom" ,
//      UserId : userId ,
//  }

// for message 
// playload{
//      type : message , 
//      roomId : id , 
//      userId : id , 
//      text : "some message "
// }
const rooms = new Map<number, Set<WebSocket>>();
const Prisma = new PrismaClient();
export  function setUpWebScoket(server: Server) {
     const wss = new WebSocketServer({ server });
     wss.on("connection", (socket) => {
          console.log("connected sunncessfully");

          socket.on("message", async (playload) => {

               const rawdata = playload.toString();
               try {
                    const parasedData = JSON.parse(rawdata);
                    if (parasedData.type == "create") {
                         const exist = await Prisma.room.findFirst({
                              where:
                                   { roomName: parasedData.roomName, createdBy: parasedData.userId }
                         })
                         if (exist) {
                              socket.send(JSON.stringify({
                                   status : false ,
                                   type: "created",
                                   message: "The room name is already existd "
                              }))
                              return;
                         } else {
                              const room = await Prisma.room.create({
                                   data: {
                                        roomName: parasedData.roomName,
                                        createdBy: parasedData.userId,
                                   }
                              })
                              await Prisma.roomMember.create({
                                   data: {
                                        roomId: room.id,
                                        userId: parasedData.userId
                                   }
                              })

                              socket.send(JSON.stringify({
                                   status : true ,
                                   type: "created",
                                   message: "succesfully room is created "
                              }))
                              return;
                         }
                    }
                    if (parasedData.type == "join") {
                         const existroom = await Prisma.room.findFirst({ where: { id: parasedData.roomId } })
                         if (existroom) {
                              const memberexisted = await Prisma.roomMember.findFirst({
                                   where:{
                                        userId: parasedData.userId,
                                        roomId: parasedData.roomId
                                   }
                              })
                              if(!memberexisted){
                              await Prisma.roomMember.create({
                                   data: {
                                        roomId: parasedData.roomId,
                                        userId: parasedData.userId
                                   }
                              })
                              }
                              if (!rooms.has(parasedData.roomId)) {
                                   rooms.set(parasedData.roomId, new Set());
                              }
                              rooms.get(parasedData.roomId)?.add(socket);
                              socket.send(JSON.stringify({
                                   status : true ,
                                   type: "joined",
                                   message: "Succesfully joined the room"
                              }))
                         } else {
                              socket.send(JSON.stringify({ 
                                   status : false ,
                                   type: "joined", 
                                   message: "room doesn't existed" }))
                         }
                    }
                    // remove socket when disconnected
                    socket.on("close", () => {
                           for( const [roomId , clients] of rooms.entries()){
                               clients.delete(socket);
                               if(clients.size === 0){
                                   rooms.delete(roomId);
                               }
                           }
                    });

                    if (parasedData.type == "message") {
                         if (!rooms.has(parasedData.roomId)) {
                              rooms.set(parasedData.roomId, new Set());
                         }
                          rooms.get(parasedData.roomId)?.add(socket);
                         const  message = await Prisma.message.create({
                              data: {
                                   userId: parasedData.userId,
                                   roomId: parasedData.roomId,
                                   message: parasedData.text
                              }
                         })
                         const allsockets = rooms.get(parasedData.roomId);
                         if (allsockets) {
                              for (const client of allsockets) {
                                   client.send(JSON.stringify({
                                        status : true ,
                                        type: "message",
                                        text: parasedData.text,
                                        userId: parasedData.userId,
                                        createdAt : message.createdAt
                                   }))
                              }
                         }
                         
                    }

               } catch (err) {
                    console.error("Invalid JSON:", err);
                    socket.send("Error: message must be valid JSON");
               }

          })
     })
}