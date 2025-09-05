// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SocketProvider } from './Pages/SocketContext.tsx'
createRoot(document.getElementById('root')!).render(
    <SocketProvider>
      <App/>
    </SocketProvider>
)
