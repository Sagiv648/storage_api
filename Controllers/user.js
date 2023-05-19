import { Router } from "express";
import user from "../Models/user.js";
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
const userRouter = Router();

dotenv.config();


userRouter.post('/signup', async (req,res) => {

    const {email,password} = req.body;

    try {
        const exists = await user.findOne({where: {email: email}})
        console.log(exists);
        if(exists)
            return res.status(400).json({error: "exists"})
        const hashed_password = await bcryptjs.hash(password,10);
        
        const newUser = await user.create({email: email, password: hashed_password})
       
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
    try {
        const exists = await user.findOne({where: {email: email}})
        if(!exists)
            return res.status(400).json({error: "invalid credentials"})
        const samePassword = await bcryptjs.compare(password,exists.password)
        if(!samePassword)
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