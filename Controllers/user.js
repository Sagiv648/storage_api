import { Router } from "express";
import user from "../Models/user.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { auth } from "./auth.js";
import application from "../Models/application.js";
import crypto from 'crypto-js'
import bucket from "../Models/bucket.js";
import fs from 'fs'
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

userRouter.post('/application', auth ,async (req,res) => {
    const {id} = req.data;
    console.log(id);
    const {name} = req.body;
    if(!name)
        return res.status(400).json({error: "invalid fields"})
    try {

        const existingApplication = await application.findAll({where: {user: id}})
        
        if(existingApplication.length > 5)
            return res.status(400).json({error: "application limit excceeded"})
        
        const newApplication = await application.create({name: name, user: id})
        const auth_key_secret = crypto.SHA256(`${newApplication.id}_${newApplication.name}`).toString()
        const newBucket = await bucket.create()
    
        const bucketKey = crypto.SHA256(newBucket.id.toString()).toString()
        fs.mkdirSync(`${process.env.BUCKETS_DIRECTORY}/${bucketKey}`)
        await newBucket.update({key: bucketKey})
        
        
    
        const applicationKey = crypto.SHA256(newApplication.id).toString();
       
        await newApplication.update({key: applicationKey, bucket_key: bucketKey, auth_key_secret: auth_key_secret})

        return res.status(201).json({application: {
            name: newApplication.name,
            key: newApplication.key,
        }})

    } catch (error) {
        
        console.log(error.message);
        
        return res.status(500).json({error: "server error"})
    }
})

export default userRouter