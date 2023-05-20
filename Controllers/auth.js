import jwt from 'jsonwebtoken'
import user from '../Models/user.js'
import dotenv from 'dotenv'
import bucket from '../Models/bucket.js';
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

export const bucketKeyAuth = async (req,res,next) => {
    const key = req.headers.bucket_auth;
    
    if(!key)
        return res.status(401).json({error: "invalid bucket key"})
    
    try {

        jwt.verify(key, process.env.JWT_BUCKET_KEY_SECRET, async (err,payload) => {
            if(err)
                return res.status(401).json({error: "invalid key"})
                
            const exists = await bucket.findByPk(payload.bucket_id)
            if(!exists)
                return res.status(401).json({error: "invalid key"})
            req.data = {...req.data,bucket_id: payload.bucket_id}
            next();
            
        })
    } catch (error) {
         return res.status(500).json({error: "server error"})
    }
    
}

