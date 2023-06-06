import app from "./config/networkConfig.js";
import {json, urlencoded} from 'express'
import { __dirname } from "./config/storageConfig.js";
import userRouter from "./Controllers/user.js";
import bucketRouter from "./Controllers/bucket.js";
import { auth, authDownloadToken, authUploadKey, deriveBucketKey } from "./Controllers/auth.js";
import filesRouter from "./Controllers/files.js";
import directoryRouter from "./Controllers/directory.js";
import application from "./Models/application.js";
import cors from 'cors'
import fs from 'fs'
import jwt from 'jsonwebtoken'
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



app.get('/api/storage', async (req,res) => {
    
    try {
        const app = req.headers.application;
        const applicationRecord = await application.findOne({where: {key: app}})
        if(!applicationRecord)
            return res.status(500).json({error: "server error"})
        const uploadToken = jwt.sign({id: applicationRecord.id,app: app, bucket_key: applicationRecord.bucket_key}, applicationRecord.auth_key_secret)

        return res.status(201).json({upload_token: uploadToken})
    } catch (error) {
        return res.status(500).json({error: "server error"})
    }

    
})


app.use('/api/bucket',auth,bucketRouter)
app.use('/api/files',authUploadKey ,filesRouter)
app.use('/api/directory', authUploadKey, directoryRouter)
