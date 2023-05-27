import jwt from 'jsonwebtoken'
import user from '../Models/user.js'
import dotenv from 'dotenv'
import bucket from '../Models/bucket.js';

dotenv.config();

export const auth = async (req,res, next) => {
    console.log(req.headers);
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
   
    const {id} = req.data
    console.log(req.data);
    if(!id)
        return res.status(401).json({error: "unauthorized"})
    
        
    
    try {

        const userRecord = await user.findByPk(id)
        if(!userRecord.bucket_id)
            return res.status(401).json({error: "unauthorized"})
        const bucketRecord = await bucket.findByPk(userRecord.bucket_id)
        req.data.bucket_key = bucketRecord.key;
        next();

    } catch (error) {
         return res.status(500).json({error: "server error"})
    }
    
}

