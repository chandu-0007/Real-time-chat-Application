import { Login } from "./Pages/login"
import {Routes , Route  , BrowserRouter, Navigate} from "react-router-dom" 
import HomePage from "./Pages/HomePage"
import { SocketProvider } from "./Pages/SocketContext";

export default function App(){
  return(
    <>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
             <Route path="/login" element={<Login/>} />
             {/* <Route path="/signIn" element></Route> */}

             <Route path="/"
              element={
               <PrivateRoute>
                  <HomePage/>
               </PrivateRoute>
              }>    
             </Route>
            </Routes>    
        </SocketProvider>
      </BrowserRouter>
    </>
  )
}


type PrivateRouteProps = {
  children: React.ReactNode;
};


const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token: string | null = localStorage.getItem("token");
  if(!token){
    return <Navigate to="/login" replace/>
  }
  return <>{children}</>;
};