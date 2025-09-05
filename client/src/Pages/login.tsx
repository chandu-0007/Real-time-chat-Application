import { useState } from "react"
import BackgroundImg from "../assets/wsbackground.png"
import axios from "axios"
import { useNavigate } from "react-router-dom";
type userType = {
    username: string;
    password: string;
};
 export const  Login = ()=>{
    const [UserDetails , SetUserDetails] = useState<userType>({
        username : "",
        password : ""
    })
    const nav = useNavigate();
    const [Message, setMessage ] = useState<string>("");

    const UpdateUserInfo = (event: React.ChangeEvent<HTMLInputElement>)=>{
        event?.preventDefault() ; 
         SetUserDetails((prevs) => ({
            ...prevs,
            [event.target.name]: event.target.value
         }))
    }

   const Submitfunction = async () => {
  try {
     if(UserDetails.username == "" || UserDetails.password == ""){
      alert("the username or password must be provided ")
      return ; 
     }
    const response = await axios.post("http://localhost:3030/users/login", {
      username: UserDetails.username,
      password: UserDetails.password,
    });
     console.error(response.data)
    if (response.data) {
      setMessage(response.data.message);
      alert(response.data.message);
      localStorage.setItem("token", response.data.token)
      setTimeout(() => {
        setMessage("");
      }, 2000);
      SetUserDetails({
        username: "",
        password: "",
      });
      if(response.data.status){
         nav("/");
      }
    }
  } catch (error: any) {
    console.error("Login error:", error);
    setMessage(error.response?.data?.message || "Something went wrong");
  }
};


  return (
    <>
     <div className="">
        <div className=" relative 
         bg-black border-none  h-screen w-full flex justify-center items-center">
               <div className="w-250 h-160 bg-white absolute flex">
                <img  className="w-full h-full " src={BackgroundImg}></img>
               </div>
               <div className="w-100 h-120 bg-white/10 backdrop-blur-md shadow-lg 
                border p-5 border-white/20 rounded-xl flex-col text-white  overflow-x-hidden justify-center  absolute ">
                    <h2 className="text-3xl text-white text-center mb-16 font-bold">LOGIN FORM </h2>
                    <div className="w-full m-2 ">UserName  :</div>
                    <input className="w-full bg-white/20 border-none p-1 rounded-md text-white  m-2" name="username" value={UserDetails.username} onChange={UpdateUserInfo} placeholder="enter  your username "></input>
                    <div className="m-2">Password</div>
                    <input  className="w-full bg-white/20 border-none p-1 rounded-md text-white  m-2" name="password"
                     value={UserDetails.password} onChange={UpdateUserInfo}
                      placeholder="Create min 8 characters password "></input>
                    <div className="flex justify-center items-center ">
                       <button onClick={Submitfunction} className="w-20 m-8 h-10 text-white bg-black
                        shadow-lg rounded-lg  transition-all ">Submit</button>
                      </div>
                </div>
            { Message!= ""  && <div className="w-auto p-1.5 mb-4 mr-1
              h-10 bg-gray-500 text-white  rounded-lg absolute bottom-0 right-0">
                 <span>{Message}</span>
                 <button  onClick={()=>{
                   setMessage("");
                 }}>*</button>
              </div>
            }  
        </div>
     </div>
    </>
  )
}