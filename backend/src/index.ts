import { WebSocket, WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 })
interface user {
  socket : WebSocket ; 
  rommId : string ; 
}
const users :user[]= [];
wss.on("connection", (socket) => {
  console.log("connected to webscoket");
  socket.on("message", (e) => {
    console.log(e.toString());
         socket.send(e.toString());
      })
  })