import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
  origin: "http://localhost:5173",  // exact frontend origin
  //methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true                // allow cookies/credentials
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

import { errorHandler } from './middleware/error.middleware.js';

import healthCheckRoutes from "./routes/healthcheck.router.js"
import userRoutes from "./routes/user.router.js"
import roomRoutes from "./routes/room.router.js"
import messageRoutes from "./routes/message.router.js"
import requests from "./routes/request.router.js"
import roomKey from "./routes/roomKey.router.js"



app.use("/api/Healthcheck", healthCheckRoutes)
app.use("/api/Users", userRoutes)
app.use("/api/Rooms", roomRoutes)
app.use("/api/Messages", messageRoutes)
app.use("/api/Request",requests)
app.use("/api/RoomKey", roomKey)


app.use(errorHandler)

//app.use("/api/messages",messageRoutes)

export {app}