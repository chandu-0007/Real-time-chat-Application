import axios from "axios"
import BackgroundImg from "../assets/wsbackground.png"
import { WebSocket } from "vite"
import { useEffect, useState } from "react"
type room = {
    roomId: Number,
    roomName: string
}
const Home = () => {
    const [userInfo, SetuserInfo] = useState({
        userid: null,
        username: ""
    })
    const [rooms,Setrooms] = useState<room[]>([])
    Setrooms((prevs) => [
        ...prevs,
        { roomId: 3, roomName: "hackers " }
    ])
    const [socket , SetSocket] = useState<WebSocket | null >(null);
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3030")
        ws.onopen= ()=>{
            console.log("connected to websockets ..");
        }

       ws.onerror = (error)=>{
        console.error(error)
       }
       ws.onclose = ()=>{
        console.log("disconnected to socket ")
       }

       ws.onmessage = (event)=>{
        const parasedata = JSON.parse(event.data);
        if(parasedata.type == "created"){
            if(parasedata.status){
                
            }else{

            }
        }
       }
        SetSocket(socket);
       const getInfo = async () => {
            const res = await axios.get("http://localhost:3030/users/me", {
                headers: {
                    authorization: localStorage.getItem("token")
                }
            })
            if (res.status) {
                SetuserInfo((prevs) => ({
                    ...prevs,
                    userid: res.data.user.id,
                    username: res.data.user.username
                }))
            }
            const rooms = await axios.get("http://localhost:3030/users/rooms", {
                params: {
                    userId: 2
                }
            })
        }
        getInfo();
       return ()=> ws.close();
        
    },[])

    const createRoom = async ()=>{
         if(socket){
            socket.send(JSON.stringify({
                type : "create" ,
                roomName : "hackers 1"
            }))
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
                            {/* rooms list  */}
                            <div className="w-full h-15 flex justify-between  text-white border-b shadow-sm backdrop-blur-2xl rounded-t-xl border-orange-300 p-2">
                                <div className="flex justify-center items-center gap-x-4">
                                    <div className="rounded-full w-8 h-8 overflow-hidden  broder-none ">
                                        <img src="https://i.pinimg.com/736x/fc/cf/99/fccf996f13c5752df6b32ae216471dd3.jpg" className="overflow-hidden"></img>
                                    </div>
                                    <div className="text-3xl font-serif">Charts </div>
                                </div>
                                <svg onClick={createRoom} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange" className="size-8 shadow-2xl items-center rounded-full shadow-amber-500 mt-2">
                                    <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="w-full flex flex-col  h-full ">
                            {/* room chart  */}
                            <div className="w-full flex-1 overflow-y-auto ">
                                {/* messages */}
                            </div>
                            <div className="flex border-t border-gray-300">
                            <input className="w-full h-10 bg-white p-2 border-none " type="text" placeholder="enter your message here ">
                            </input>
                            <button className="bg-white ">
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

export default Home;