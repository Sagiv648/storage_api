import { Router } from "express";
import dotenv from 'dotenv'
import user from "../Models/user.js";
import bucket from "../Models/bucket.js";
import bcryptjs from 'bcryptjs'
import fs from 'fs'
import { BUCKET_SIZE } from "../config/storageConfig.js";
import jwt from 'jsonwebtoken'

import crypto from 'crypto-js'
const bucketRouter = Router();
dotenv.config()

//Creating a bucket
bucketRouter.post('/', async(req,res) => {
    
    

    const {id} = req.data;
    

    try {
        const userEntry = await user.findByPk(id);
        if(!userEntry)
            return res.status(400).json({error: "invalid credentials"})
        if(userEntry.bucket_id)
            return res.status(400).json({error: "existing bucket"})
        
        
        const newBucket = await bucket.create()
        
        const bucketKey = crypto.SHA256(newBucket.id.toString()).toString()
        console.log(bucketKey);
        console.log(newBucket.id.toString());
        //const key = jwt.sign(bucket_key_payload, process.env.JWT_BUCKET_KEY_SECRET)
       
        await newBucket.update({key: bucketKey})
        fs.mkdirSync(`${process.env.BUCKETS_DIRECTORY}/${bucketKey}`)
       
        await user.update({bucket_id: newBucket.id}, {where: {id: id}})

        return res.status(201).json({newBucket})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({error: "server error"})
    }

})


//Changing of bucket options
bucketRouter.put('/' ,async( req,res) => {

    const {id,bucket_id} = req.data;
   
    const {name} = req.body;

    if(!name)
        return res.status(400).json({error: "invalid fields"})

    try {
        
        const userEntry = await user.findByPk(id);
        if(!userEntry)
            return res.status(400).json({error: "invalid credentials"})
        if(!userEntry.bucket_id)
            return res.status(400).json({error: "missing bucket"})

        const bucketEntry = await bucket.findByPk(bucket_id)
        const oldName = `${bucket_id}_${bucketEntry.name}`;

        const newName = `${bucket_id}_${name}`
        
        
        fs.renameSync(`${process.env.BUCKETS_DIRECTORY}/${oldName}`, `${process.env.BUCKETS_DIRECTORY}/${newName}`)
        
        await bucketEntry.update({name: name})
        
        return res.status(200).json({bucketEntry})
    } 
    catch (error) {
        console.log(error.message);
        return res.status(500).json({error: "server error"})
    }
})

export default bucketRouter