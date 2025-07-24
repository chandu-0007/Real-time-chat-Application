import { WebSocket, WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8080 })
interface obj {
  roomId:string , 
  allsockets : WebSocket[]
}
var allroomInfo :obj[]= [];
  allroomInfo.push({
    roomId: "redroom",
    allsockets: []
  })
  
wss.on("connection", (socket) => {
   if(!allroomInfo[0].allsockets.find((soc)=> socket == soc)){
    allroomInfo[0].allsockets.push(socket);
   }
  socket.on("message", (e) => {
    let parsedmessage  ;
    try{
         parsedmessage = JSON.parse(e.toString());
    }catch(error){
       console.error("cannot parse the json properly");
       return ;
    }
      
      if(parsedmessage.type == "message"){
         const currentusers = allroomInfo.find((cur)=> cur.roomId == parsedmessage.roomId)
         currentusers?.allsockets.forEach((eachsocket)=>
         {
          if(eachsocket !== socket){
            eachsocket.send(parsedmessage.message);
          }
         }
          )
      }
      })

      socket.on("close" ,()=>{
          allroomInfo[0].allsockets = allroomInfo[0].allsockets.filter((soc) => soc !== socket)
})
  })