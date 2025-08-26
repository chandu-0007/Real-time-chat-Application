 import { WebSocket , WebSocketServer } from "ws";
import { date } from "zod";

 const wss = new WebSocketServer({port:8008});

 wss.on("connection", (socket)=>{
      console.log("connected sunncessfully");

      socket.on("message",(data)=>{
           console.log(data.toString());
     })
 })