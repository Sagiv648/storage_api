import jwt from 'jsonwebtoken'
import user from '../Models/user.js'
import dotenv from 'dotenv'
import bucket from '../Models/bucket.js';
import files from '../Models/file.js';

import application from '../Models/application.js';

dotenv.config();

export const auth = async (req,res, next) => {
    
    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer "))
        return res.status(401).json({error: "unauthorized"})
    const authorization = req.headers.authorization.split(' ')
    
    if(authorization.length != 2)
        return res.status(401).json({error: "unauthorized"})

    try {
        jwt.verify(authorization[1], process.env.JWT_AUTH_KEY, async (err, payload) => {
            if(err)
                return res.status(401).json({error: "unauthorized"})

            
            const exists = await user.findByPk(payload.id)
            if(exists)
            {   
                req.data = payload;
                next();
            }
            else
                return res.status(401).json({error: "unauthorized"})
        })
    } catch (error) {
        return res.status(500).json({error: "server error"})
    }
}

export const deriveBucketKey = async (req,res,next) => {
   
    const key = req.headers.application
    
    console.log(key);
    
    try {

        const applicationRecord = await application.findOne({where: {key: key}})


        
        req.data.bucket_key = applicationRecord.bucket_key;
        next();

    } catch (error) {
         return res.status(500).json({error: "server error"})
    }
    
}


export const authUploadKey = async (req,res,next) => {

    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer "))
        return res.status(401).json({error: "unauthorized"})

    const authorization = req.headers.authorization.split(' ')

    if(authorization.length != 2)
        return res.status(401).json({error: "unauthorized"})
    const appHeader = req.headers.application;
    try {
        const app = await application.findOne({where: {key: appHeader}})
        if(!app)
            return res.status(401).json({error: "unauthorized"})

        jwt.verify(authorization[1], app.auth_key_secret,(err,payload) => {
            if(err)
                return res.status(401).json({error: "unauthorized"})
                
            if(payload.app !== appHeader)
                return res.status(403).json({error: "forbidden"})
            req.data = payload;
            next()
        } )
    } catch (error) {

        return res.status(500).json({error: "server error"})
    }
}

export const authDownloadToken = async (req,res,next) => {

    const {urlToken} = req.params;
    console.log(urlToken);
    if(!urlToken)
        return res.status(400).json({error: "invalid token"})

    jwt.verify(urlToken, process.env.DOWNLOAD_SIGN_KEY, async (err, payload) => {
        if(err)
            return res.status(401).json({error: "invalid token"})
        try {
            const bucketRecord = await bucket.findOne({key: payload.key})
            if(!bucketRecord)
                return res.status(401).json({error: "invalid bucket key"})
            const validFile = await files.findOne({bucket_id: bucketRecord.id, path: payload.path, name: payload.name})
            if(!validFile)
                return res.status(401).json({error: "invalid file"})


            req.data = payload;
            next();
        } catch (error) {
            return res.status(500).json({error: "server error"})
        }
    })
}

