import app from "./config/networkConfig.js";
import {json, urlencoded} from 'express'
import cors from 'cors'
import fs from 'fs'
import upload, { __dirname } from "./config/storageConfig.js";
import file from "./Models/file.js";
import bucket from "./Models/bucket.js";
import user from "./Models/user.js";
import corsConfig from "./config/corsConfig.js";
import userRouter from "./Controllers/user.js";
import bucketRouter from "./Controllers/bucket.js";
import { auth, bucketKeyAuth } from "./Controllers/auth.js";
import filesRouter from "./Controllers/files.js";
app.use(json())
app.use(urlencoded({extended: false}))
app.use(cors())


app.get('/',cors(corsConfig), async (req,res) => {
    
   
    //const jane = await User.create({ firstName: "Jane", lastName: "Doe" });
    //console.log(jane.get());
    return res.status(200).json({hello: "hello"})
})

app.get('/x', (req,res) => {
    
    return res.status(200).json({hello: "from self"})
})

app.use('/api/user', userRouter )
app.use('/api/bucket',auth,bucketRouter)
app.use('/api/files' ,filesRouter)


//Download url
// app.get('/download/:name', (req,res) => {
//     const {name} = req.params;
//     console.log(name);
//     res.status(200).download(`${__dirname}/../${name}`,"file.png")
// })