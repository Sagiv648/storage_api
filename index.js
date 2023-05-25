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
app.use(json())
app.use(urlencoded({extended: false}))
app.use((req,res,next) => {
    
    if(req.headers.application && req.headers.application == process.env.MOBILE_ACCESS_KEY)
        next()
    else
        return res.status(403).json({error: "invalid key"})
})
app.use(requestip.mw({}))



app.get('/', async (req,res,next) => {
    console.log(req.clientIp);
    console.log(crypto.SHA256("347fh376fh347hf763hgdf73hd").toString());

    return res.status(200).json({hello: "hello"})
})

app.get('/x', (req,res) => {
    
    return res.status(200).json({hello: "from self"})
})

app.use('/api/user', userRouter )
app.use('/api/bucket',auth,bucketRouter)
app.use('/api/files',auth,deriveBucketKey ,filesRouter)
app.use('/api/directory', auth, deriveBucketKey, directoryRouter)
