import express from 'express'
import http from 'http'
import dotnev from 'dotenv'
import db from './dbConfig.js';
dotnev.config();
const app = express();
const server = http.createServer(app)

db.sync()
.then(() => {
    server.listen(process.env.PORT,() => {
        console.log("listening...");
    })
})



export default app;