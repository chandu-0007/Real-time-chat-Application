import axios from "axios"
import BackgroundImg from "../assets/wsbackground.png"
import { useEffect, useState } from "react"
import { useSocket } from "./SocketContext"
type room = {
  id: number,
  roomName: string
}
type messageProp = {
  id: number,
  roomId: number,
  message: string,
  messagedBy: string
  createdAt: any
  isOwn: boolean,

}
type RoomProps = {
  id: number,
  roomName: string,
  buttonfun: () => void
};
type member = {
  username: string,
  userId: number,
  joinedAt: string
}
type currentroomProp = {
  roomId: number | null,
  roomName: string,
  createdBy: number | null,
  members: member[],
  NoOfMembers: number | null
}
const Home = () => {
  const [userInfo, SetuserInfo] = useState({ userId: null, username: "" });
  const [rooms, Setrooms] = useState<room[]>([]);
  const [messages, Setmessages] = useState<messageProp[]>([]);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const [inputmsg, SetInputmsg] = useState<string>("")
  const [currentroom, Setcurrentroom] = useState<currentroomProp>({
    roomId: null,
    roomName: "",
    createdBy: null,
    members: [],
    NoOfMembers: null
  })
  const [ShowCreateRoom, SetShowCreateRoom] = useState<boolean>(false)
  // ✅ Hooks must always run, regardless of socket state
  useEffect(() => {
    const getInfo = async () => {
      try {
        const res = await axios.get("http://localhost:3030/users/me", {
          headers: { authorization: localStorage.getItem("token") }
        });
        SetuserInfo({
          userId: res.data.user.id,
          username: res.data.user.username
        });
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };
    const getRooms = async () => {
      try {
        const roomsRes = await axios.get("http://localhost:3030/users/rooms", {
          headers: { authorization: localStorage.getItem("token") }
        });
        Setrooms(roomsRes.data.rooms);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };
    getInfo();
    getRooms();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      console.log("📩 WS message:", msg);
      switch (msg.type) {
        case "created":
          if (msg.status) {
            Setrooms((prev) => [...prev, { id: msg.room.id, roomName: msg.room.name }]);
            alert("room has created successfully")
          } else {
            alert(msg.message)
          }
          break;
        case "message":
          if (msg.status) {
            console.log(msg)
            Setmessages((prevs) => [
              ...prevs,
              {
                id: msg.messageId,
                roomId: msg.roomId,
                message: msg.text,
                messagedBy: msg.userId,
                createdAt: msg.createdAt,
                isOwn: msg.isOwn
              }
            ])
          }
          break;
        default:
          console.warn("Unknown WS message type:", msg.type);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);


  // ✅ Conditionally render UI, not hooks
  if (!socket) {
    return <div>Connecting to WebSocket...</div>;
  }
  const [roomInput, SetroomInput] = useState<string>("")
  const createRoom = () => {
    if (roomInput != null) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "create",
          roomName: roomInput
        }))
      }
    }

  }


  // fetch room messages 
  const getroomMesages = async (roomId: number) => {
    try {
      const [res, res1] = await Promise.all([
        axios.get(`http://localhost:3030/users/rooms/${roomId}/messages`, {
          headers: {
            authorization: localStorage.getItem("token")
          },
        }),
        axios.get(`http://localhost:3030/users/room/${roomId}/info`, {
          headers: {
            authorization: localStorage.getItem("token")
          },
        })
      ])
      const data = res?.data
      if (data.status) {
        const normalizedMessages = data.messages.map((m: any) => ({
          ...m,
        }));
        Setmessages(normalizedMessages);
      } else {
        alert(data.message)
      }

      if (res1.status) {
        console.log(res1.data);
        Setcurrentroom(res1.data);
      }
    } catch (error) {
      alert("something wrong ...")
    }
  }


  //  function send msg to the socket and backend 
  const SendMsg = async () => {
    if (socket && socket.readyState == WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "message",
        roomId: currentroom,
        text: inputmsg
      }))

      SetInputmsg("");
    }
  }



  return (
    <>
      <div className="">
        <div className=" relative 
                    bg-black border-none  h-screen w-full flex justify-center items-center">
          <div className="w-250 h-160 bg-white absolute flex">
            <img className="w-full h-full " src={BackgroundImg}></img>
          </div>
          <div className="w-250 h-160 bg-white/10 border flex justify-start border-white/10 backdrop-blur-sm rounded-md ">
            <div className="  w-1/3 h-full bg-gradient-to-b from-gray-800/10 via-gray-600 to-gray-400/5  items-center">
              {/* users Info  */}
              <div className="w-full h-15 flex justify-between  text-white border-b shadow-sm backdrop-blur-2xl rounded-t-xl border-orange-300 p-2">
                <div className="flex justify-center items-center gap-x-4">
                  <div className="rounded-full w-8 h-8 overflow-hidden  broder-none ">
                    <img src="https://i.pinimg.com/736x/fc/cf/99/fccf996f13c5752df6b32ae216471dd3.jpg" className="overflow-hidden"></img>
                  </div>
                  <div className="text-3xl font-serif">Charts </div>
                </div>
                <div onClick={() => { SetShowCreateRoom(true) }} className=" relative cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange" className="size-8 shadow-2xl items-center rounded-full shadow-amber-500 mt-2">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                  </svg>
                  {/* show creae room pop div  */}
                  {
                    ShowCreateRoom && <>
                      <div className="absloure w-60 h-30 p-2 bg-gray-300 flex-col 
                      items-center justify-center inline-flex overflow-hidden  rounded-xl">
                        <div className="flex justify-evenly ">
                          <div>
                          <input onChange={(e) => SetroomInput(e.target.value)}
                            value={roomInput}
                            type="text" className="bg-white
                           ml-1 text-gray-500" placeholder="room name here ."></input></div>
                          <div onClick={()=>{SetShowCreateRoom((prev)=> !prev)}}
                          className="rounded-full bg-orange-400 ml-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 ">
                              <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <button className="bg-orange-600 p-2 rounded-md mt-2.5 shadow-2xs  text-center text-white "
                          onClick={createRoom}
                        >create room </button>
                      </div>
                    </>
                  }
                </div>
              </div>
              {/* List of rooms */}
              <div className="">
                {rooms.map((child, index) => (
                  <Room key={index} id={child.id}
                    roomName={child.roomName} buttonfun={() => getroomMesages(child.id)}></Room>
                ))}
              </div>
            </div>
            <div className="w-full flex flex-col   h-full ">
              {/* room chart  */}
              <div className=" w-full h-15 flex justify-between items-center bg-gray-500/10 text-white  p-1.5 ">
                <div className="p-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fill-rule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clip-rule="evenodd" />
                    <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                  </svg>
                  <div className="bg-none ml-1.5">
                    <div className="text-xl">{currentroom.roomName}</div>
                    <div className="text-gray-400">{currentroom.NoOfMembers} members </div>
                  </div>
                </div>
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fill-rule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="w-full   flex-1 no-scrollbar overflow-y-auto ">
                {/* messages */}
                <div>
                  {messages.map((child, index) => (
                    <MessageBubble key={index} message={child.message} isOwn={child.isOwn} />
                  ))}
                </div>

              </div>
              <div className="flex border-t border-gray-300">
                <input value={inputmsg} onChange={(event) => SetInputmsg(event.target.value)}
                  className="w-full h-10 bg-white p-2 border-none " type="text" placeholder="enter your message here ">
                </input>
                <button className="bg-white" onClick={SendMsg}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange" className="size-6">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
function Room({ id, roomName, buttonfun }: RoomProps) {
  return (
    <>
      <div id={String(id)} onClick={buttonfun}
        className="w-full h-10 cursor-pointer text-white p-1 flex justify-start hover:bg-gray-600">
        <div className="rounded-full px-2  border-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
            <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
          </svg>
        </div>
        <div>{roomName}</div>
      </div>
    </>
  )
}

const MessageBubble = ({ message, isOwn }: { message: string, isOwn: boolean }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg text-white ${isOwn
          ? "bg-orange-400 rounded-br-none"
          : "bg-gray-700 rounded-bl-none"
          }`}
      >
        {message}
      </div>
    </div>
  );
};
export default Home;