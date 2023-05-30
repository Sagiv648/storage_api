import app from "./config/networkConfig.js";
import {json, urlencoded} from 'express'
import { __dirname } from "./config/storageConfig.js";
import userRouter from "./Controllers/user.js";
import bucketRouter from "./Controllers/bucket.js";
import { auth, authDownloadToken, deriveBucketKey } from "./Controllers/auth.js";
import filesRouter from "./Controllers/files.js";
import crypto from 'crypto-js'
import directoryRouter from "./Controllers/directory.js";
import requestip from 'request-ip'
import application from "./Models/application.js";
import cors from 'cors'
import fs from 'fs'
app.use(json())
app.use(urlencoded({extended: false}))
app.use(cors())



app.get('/download/:urlToken',authDownloadToken ,(req,res) => {
    
    console.log(req.data);
     const {key,path,name} = req.data;
     
     const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${key}`
     
    try {
        if(!fs.existsSync(`${relativeRoot}/${path}`))
            return res.status(400).json({error: "invalid path"})
        
        return res.status(200).download(`${relativeRoot}/${path}/${name}`,name)
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({error: "server error"})
    }
   
})
app.use('/api/user', userRouter )
app.use(async (req,res,next) => {
    
    if(!req.headers.application)
        return res.status(403).json({error: "invalid app"})
    
   
    const key = req.headers.application
    const applicationRecord = await application.findOne({where: {key: key}})
    if(!applicationRecord)
        return res.status(403).json({error: "invalid key"})
    next()
    
        
    
       
})
//app.use(requestip.mw({}))



app.get('/', async (req,res,next) => {
    

    return res.status(200).json({hello: "hello"})
})

app.get('/x', (req,res) => {
    
    return res.status(200).json({hello: "from self"})
})


app.use('/api/bucket',auth,bucketRouter)
app.use('/api/files',auth,deriveBucketKey ,filesRouter)
app.use('/api/directory', auth, deriveBucketKey, directoryRouter)
