import jwt from 'jsonwebtoken'
import user from '../Models/user.js'

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

export const emailTokenAuth = async (req,res,next) => {
    
    const {payload} = req.params;
    console.log(payload);
    if(!payload)
        return res.status(401).json({error: "invalid link"})
    try {
        jwt.verify(payload, process.env.EMAIL_CONFIRMATION_SECRET, (err, payload) => {
            if(err)
                return res.status(401).json({error: "invalid link"})
            req.data = payload;
            next();
        })
    } catch (error) {
        
    }
}