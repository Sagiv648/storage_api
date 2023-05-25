import app from "./config/networkConfig.js";
import {json, urlencoded} from 'express'
import { __dirname } from "./config/storageConfig.js";
import userRouter from "./Controllers/user.js";
import bucketRouter from "./Controllers/bucket.js";
import { auth, deriveBucketKey } from "./Controllers/auth.js";
import filesRouter from "./Controllers/files.js";
import crypto from 'crypto-js'
import directoryRouter from "./Controllers/directory.js";
import requestip from 'request-ip'
import application from "./Models/application.js";
import cors from 'cors'
app.use(json())
app.use(urlencoded({extended: false}))
app.use(cors())
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

app.use('/api/user', userRouter )
app.use('/api/bucket',auth,bucketRouter)
app.use('/api/files',auth,deriveBucketKey ,filesRouter)
app.use('/api/directory', auth, deriveBucketKey, directoryRouter)
