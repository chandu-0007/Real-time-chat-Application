import { PrismaClient } from "@prisma/client";
import {string, z} from "zod"
import express from "express"
import type { Request , Response , NextFunction } from "express";
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import http from "http"
import { setUpWebScoket } from "./websocket/socket"
import { ca } from "zod/v4/locales/index.cjs";
import { RecordWithTtl } from "dns";
dotenv.config();

const Prisma = new PrismaClient();
const app =  express();
app.use(express.json());
const port = process.env.PORT || 3003; 

const userType = z.object({
    username: string(),
    password : string().min(8).max(20)
})
const server = http.createServer(app);
setUpWebScoket(server);
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

app.get("/users/me", async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({
            status: false,
            message: "Unauthorized"
        });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECERT!);
        const user = await Prisma.user.findFirst({
            where: { id: (decoded as any).id }
        });
        if (!user) {
            res.status(404).json({
                status: false,
                message: "User not found"
            });
            return;
        }
        res.status(200).json({
            status: true,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        res.status(401).json({
            status: false,
            message: "Invalid token"
        });
    }
});
app.get("/users/rooms" , async (req : Request , res : Response)=>{
    const userId = req.query.userId ;
    try {
        const AllRooms = await Prisma.roomMember.findMany({
            where :{
                userId:Number(userId),
                },
                include :{
                    room :{
                        select :{
                            id : true  , 
                            roomName :true , 
                        }
                    }
                }
        })
        res.status(200).json({
            status : true , 
            rooms : AllRooms.map((r)=>({
                id : r.room.id,
                roomName  : r.room.roomName,
            }))
        })
    }catch(error){
        console.error(error);
             res.json({
                status : false , 
                error : error 
             })
    }
})
app.get("/users/rooms/:roomId/:NoMessages", async (req: Request, res: Response): Promise<void> => {
    const { roomId, NoMessages } = req.params;
    // Fetch messages from the database or any other source
    try{
    const messages = await Prisma.message.findMany({
        where:{
            roomId:Number(roomId)
        },
        orderBy: {
            createdAt: "asc"
        },
        include: {
            user: {
                select: {
                    username: true
                }
            },
        
        },
        take: Number(NoMessages)
    });
    res.status(200).json({
        status: true,
        messages
    });
} catch (error) {
    res.status(500).json({
        status: false,
        message: "Error fetching messages"
    });
}
});

app.delete("/users/rooms/:roomId/:userId",async (req : Request , res : Response)=>{
    const {roomId , userId} = req.params ; 
    try{
        await Prisma.room.delete({
            where :{
                id : Number(roomId),
                createdBy : Number(userId)
            }
        })

        res.status(200).json({
            status : true , 
            message : " successfully deleted room "
        })
    }catch(error){
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Error deleting room"
        });
    }
})


app.delete("/users/rooms/:roomId/leave/:userId", async (req: Request, res: Response): Promise<void> => {
        const {roomId  , userId } = req.params ; 
        try{
            const existedRoom = await Prisma.room.findFirst({
                where :{
                    id : Number(roomId)
                }
            })
            if(!existedRoom){
                res.status(404).json({
                    status : false , 
                    message : "room is not existed "
                })
                return ; 
            }
            await Prisma.roomMember.delete({
                where: {
                    userId_roomId: {
                        userId: Number(userId),
                        roomId: Number(roomId)
                    }
                }
            })
            res.status(200).json({
                status: true,
                message: "Successfully left room"
            })
        }catch(error){
            console.error(error)
            res.status(500).json({
                status: false,
                message: "Error leaving room"
            })
        }
})
server.listen(port, () => {
    console.log("The app is running on the port " + port);
})