import Landingpage from "./Pages/Landing"
import {Routes , Route , Link  , BrowserRouter} from "react-router-dom" 
export default function App(){
  return(
    <>
      <BrowserRouter>
        <Routes>
           <Route path="/" element={<Landingpage/>}>
            
           </Route>
          </Routes>    
      </BrowserRouter>
    </>
  )
}