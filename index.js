import express from "express"
import dotenv from "dotenv";
import { connectDB } from "./db/db.js";
import userRouter from "./routes/user.routes.js"


dotenv.config();
const app = express();
app.use(express.json());
app.use("/api/users", userRouter);


app.get('/', (req,res)=>{
    res.send("hello");
})

connectDB();
app.listen(5000, (req,res)=>{
    console.log("server running");
})