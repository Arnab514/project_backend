// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`App is running on server port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Error : " , err)
})



/*
import express from "express";
const app = express()
(async()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error: ", error);
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is running on the port: ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("Error: ", error)
    }
})()
*/