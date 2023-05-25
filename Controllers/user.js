import { Router } from "express";
import user from "../Models/user.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
const userRouter = Router();

dotenv.config();


userRouter.post('/signup', async (req,res) => {

    const {email,password} = req.body;
    if(!email || !password)
        return res.status(400).json({error: "invalid fields"})

    try {
        const exists = await user.findOne({where: {email: email}})
        console.log(exists);
        if(exists)
            return res.status(400).json({error: "exists"})
       
        
        const newUser = await user.create({email: email, password: password})
       
        if(!newUser)
            return res.status(500).json({error: "server error"})
        const jwtPayload = {id: newUser.id}
        const token = jwt.sign(jwtPayload,process.env.JWT_AUTH_KEY)
        if(!token)
            return res.status(500).json({error: "server error"})
        return res.status(201).json({token: token})
    } catch (error) {
        
        return res.status(500).json({error: "server error"})
    }
})

userRouter.post('/signin', async (req,res) => {

    const {email,password} = req.body;

    if(!email || !password)
        return res.status(400).json({error: "invalid fields"})
        
    try {
        const exists = await user.findOne({where: {email: email}})
        if(!exists)
            return res.status(400).json({error: "invalid credentials"})
        
        if(exists.password != password)
            return res.status(401).json({error: "invalid credentials"})
        
            const jwtPayload = {id: exists.id}
            const token = jwt.sign(jwtPayload,process.env.JWT_AUTH_KEY)
            if(!token)
                return res.status(500).json({error: "server error"})
            return res.status(201).json({token: token})

    } catch (error) {
        return res.status(500).json({error: "server error"})
    }
})

export default userRouter