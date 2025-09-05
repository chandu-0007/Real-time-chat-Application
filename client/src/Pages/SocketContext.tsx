import { createContext, useContext, useEffect, useState } from "react";

type SocketContextType = {
  socket: WebSocket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3030");
    setSocket(ws);

    ws.onopen = () => {
      console.log("✅ WebSocket connected", ws.readyState);
      ws.send(JSON.stringify({
        type: "auth",
        token: localStorage.getItem("token"),
      }));
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket disconnected", event.code, event.reason);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    ws.onmessage = (event) => {
      console.log("📩 WS message:", JSON.parse(event.data));
    };

    return () => {
        ws.close();
        setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
