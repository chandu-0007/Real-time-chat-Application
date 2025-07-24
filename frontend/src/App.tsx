import { useEffect,useRef,useState } from "react"
function App() {
  const [websocket,Setwebsocket] = useState<WebSocket>();
  const[messages , SetMessage] = useState<string[]>([])
  const [inputmsg , setinputmsg] = useState<string>(""); 
  const bottomRef = useRef<HTMLDivElement | null>(null);
   const onclickhandler = ()=>{
    console.log(inputmsg);
    if(inputmsg != "" ){
      SetMessage((prev) => [...prev, inputmsg]);}
      setinputmsg("");
    if (websocket) {
      let senddata ={
        type :"message",
        roomId:"redroom",
        message:inputmsg
      }
      websocket.send(JSON.stringify(senddata));
    }
  }
   useEffect(() => {
  if (bottomRef.current) {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  useEffect(()=>{
    const ws = new WebSocket("ws://localhost:8080")
    ws.onopen = () => {
      console.log("connected to websockets");
    }

    ws.onmessage = (event) => {
          console.log(event.data);
          if(event.data != null){
          SetMessage((msgs)=>[...msgs,event.data]);}
        };
    Setwebsocket(ws);
      return  ()=>
        { ws.close()}
  },[])
 return (
       <div className="w-screen h-screen flex justify-center items-center bg-gray-100 ">
        <div className="bg-black  flex-col rounded-t-2xl w-[600px] overflow-hidden h-[600px] flex shadow-indigo-300 border-spacing-0.5 shadow-2xl ">
          <div className="h-[85vh]  text-white  ">
            <div className="font-semibold text-2xl flex justify-center p-4 bg-violet-400">
              Real time chat Applcation </div>
              <div>
              <div className="overflow-y-scroll max-h-[450px] px-2">
               {messages.map((msg, index) => (
              <div key={index} className="m-1 flex justify-end">
                <span className="bg-white p-2 mb-0.5 text-black rounded w-auto h-auto">
                  {msg}
                </span>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>
        </div>
          </div>
          <div className=" flex max-w-full">
            <input value={inputmsg} type="text" className="bg-white text-black w-full p-4 mt-0.5"
              placeholder="Enter your message here"
             onChange={(e)=>{setinputmsg(e.target.value)
              }}></input>
            <button className="bg-indigo-400 rounded w-auto p-3 h-auto text-white"
              onClick={onclickhandler}>Send</button>
          </div>
        </div>
      </div>
 )
}
export default App
