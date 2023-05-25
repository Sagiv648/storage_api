import app from "./config/networkConfig.js";
import {json, urlencoded} from 'express'
import cors from 'cors'
import fs from 'fs'
import upload, { __dirname } from "./config/storageConfig.js";
import file from "./Models/file.js";
import bucket from "./Models/bucket.js";
import user from "./Models/user.js";
import userRouter from "./Controllers/user.js";
import bucketRouter from "./Controllers/bucket.js";
import { auth, deriveBucketKey } from "./Controllers/auth.js";
import filesRouter from "./Controllers/files.js";
import crypto from 'crypto-js'
import directoryRouter from "./Controllers/directory.js";
app.use(json())
app.use(urlencoded({extended: false}))
app.use((req,res,next) => {
    
    if(req.headers.origin !== process.env.MOBILE_ACCESS_KEY)
        return res.status(400).json({error: "invalid origin"})
    next()
})




app.get('/', async (req,res,next) => {
    
    console.log(crypto.SHA256("347fh376fh347hf763hgdf73hd").toString());
   
    //const jane = await User.create({ firstName: "Jane", lastName: "Doe" });
    //console.log(jane.get());
    return res.status(200).json({hello: "hello"})
})

app.get('/x', (req,res) => {
    
    return res.status(200).json({hello: "from self"})
})

app.use('/api/user', userRouter )
app.use('/api/bucket',auth,bucketRouter)
app.use('/api/files',auth,deriveBucketKey ,filesRouter)
app.use('/api/directory', auth, deriveBucketKey, directoryRouter)

//Download url
// app.get('/download/:name', (req,res) => {
//     const {name} = req.params;
//     console.log(name);
//     res.status(200).download(`${__dirname}/../${name}`,"file.png")
// })