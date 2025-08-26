import { PrismaClient } from "@prisma/client";
import {string, z} from "zod"
import express from "express"
import type { Request , Response , NextFunction } from "express";
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
dotenv.config();

const Prisma = new PrismaClient();
const app =  express();
app.use(express.json());
const port = process.env.PORT || 3003; 

const userType = z.object({
    username: string(),
    password : string().min(8).max(20)
})

app.post("/users/register", async (req: Request, res: Response): Promise<void> => {
    const {username , password } = req.body ; 
    const  ParsedData = userType.safeParse({username , password});
    if(ParsedData.success){
        try{
            const ExistedUser =  await Prisma.user.findFirst({
                where : {username : username}
            })
            if(!ExistedUser){
                const hashpassword = await bcrypt.hash(password , 10);
                const jwtSecret = process.env.JWT_SECERT;
                 if (!jwtSecret) {
                    res.status(500).json({
                        status: false,
                        message: "JWT secret is not defined on the server"
                    });
                    return;
                }
               const user =  await Prisma.user.create({
                   data : {
                     username :username , 
                     passwordHash : hashpassword,
                   }
                })
               const jwtToken  = jwt.sign({id: user.id}, jwtSecret);
               if(!jwtToken){
                 await Prisma.user.delete({
                    where :{id : user.id}
                 })
               }
                res.status(200).json({
                     status : true , 
                     Token : jwtToken,
                     message : "succesfully registed"
                })
                return   ;
            }
            res.json({
                status : false ,
                message : "the username is already existed ",
                ExistedUser 
            })
            return  ; 
        }catch(error){
            res.json({
                status : false , 
                message : "Error while in the server "
            })
        }
    }else{
        res.json({
            status : false , 
            message : "Invaild username or password"
        })
    }
    
})


// login router 
app.post("/users/login", async (req : Request  , res : Response)=>{
    const {username  , password } = req.body ; 
    const ParsedData = userType.safeParse({username  , password });
    if(ParsedData.success){
        try{
           const ExistedUser = await Prisma.user.findFirst({
            where:{username:username}
           })
          if(ExistedUser == null ){
               res.status(411).json({
                status : false , 
                message : "user should register"
               })
               return ; 
          }
          const passwordCheck  = await bcrypt.compare(password , ExistedUser!.passwordHash);
          if(!passwordCheck){
                res.json({
                    status : false , 
                    message : " invalid password "
                })
                return ; 
          }
           const jwtSecret = process.env.JWT_SECERT;
           if(jwtSecret == null){
            res.status(500).json({
                status : false , 
                message : "jwt sceret is missing "
            })
            return ; 
           }
           const Token = jwt.sign({id :ExistedUser.id} ,jwtSecret!);
           res.status(200).json({
            status : true , 
            message : "user is successfully  logined ",
            token : Token 
           })
           return  ; 
        }catch(error){
             res.status(404).json({
                status : false  , 
                message :"error at server"
             })
        }
    }
})
app.listen(port , ()=>{
    console.log("The app is running on the port "+port);
})