import { useEffect, useRef, useState } from "react"
function App() {
  const text = useRef<HTMLInputElement>(null)
  const [websocket,Setwebsocket] = useState<WebSocket>();
  const[messages , SetMessage] = useState<string[]>([])
  const onclickhandler = ()=>{
    console.log(text.current?.value);
    if (text.current?.value) {
      SetMessage((prev) => [...prev, text.current!.value]);
    }
    if (text.current && websocket) {
      websocket.send(text.current.value);
    }
  }
    useEffect(() => {
      if (websocket) {
        websocket.onmessage = (event) => {
          // handle incoming messages here
          console.log(event.data);
        };
      }
    }, [websocket]);
  useEffect(()=>{
    const ws = new WebSocket("ws://localhost:8080")
    Setwebsocket(ws);
    ws.onopen = () => {
      console.log("connected to websockets");
    }

  },[])
 return (
   <div className="bg-amber-200 h-screen w-full p-10">
      <div className="bg-black  h-[600px] opacity-50 rounded-t-2xl  flex mx-10 ">  
           {messages.map((msg ,index) => (<span className="bg-white text-black " key={index}>{msg}</span>))}
      </div>
      <div className="mx-10 flex ">
        <input  ref={text} className="bg-white  text-black  w-full" placeholder="Enter "></input>
         <button className="bg-black h-10 w-30 p-1 text-teal-200" onClick={onclickhandler}>Send</button>
      </div>
   </div>

 )
}
export default App
