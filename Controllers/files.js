import { Router } from "express";
import fs from 'fs'
import dotenv from 'dotenv'
import upload from "../config/storageConfig.js";
import files from "../Models/file.js";
import bucket from "../Models/bucket.js";
import { bucketKeyAuth } from "./auth.js";
import jwt from 'jsonwebtoken'
dotenv.config()

const filesRouter = Router();



//Upload example
// app.post('/upload',upload.single("file") ,async(req,res) => {
    
//     const {buffer} = req.file
//     const {start,len,size,name} = req.body
//     console.log(`${start}/${size}`);
//     try {
//         fs.appendFile(`${__dirname}/../${name}`, buffer, {encoding: 'utf-8'}, (err) => {
//             if(err){
//                throw err;
//             }
//             console.log("written");
                
            
//         })
//     } catch (error) {
//         throw error;
//     }
//     return res.status(200).json({state: "written", progress: `${start}/${size}`})
// })

//Multipart/form-data fields:
//1. file: [file]
//2. bucket_path: [bucket_name(root)]/....../[no file name]
//3. name: [file_name]
//4. size: [file_size]
//5. offset: [write_offset]
filesRouter.post('/upload/',bucketKeyAuth ,upload.single('file') , async(req,res) => {

    const {offset,bucket_path,name,size} = req.body;
    const {buffer} = req.file;
    const {bucket_id} = req.data;

    if(isNaN(offset) || isNaN(size))
        return res.status(400).json({error: 'invalid fields'})

    try {
        const fullStoragePath = `${process.env.BUCKETS_DIRECTORY}/${bucket_id}_${bucket_path}`
        if(offset == 0)
        {
            fs.mkdirSync(fullStoragePath, {recursive: true})
            fs.writeFileSync(`${fullStoragePath}/${name}`, buffer)
        }
        else
        {
            fs.appendFileSync(`${fullStoragePath}/${name}`,buffer)
            
            
        }
        // console.log(offset);
        // console.log(req.file.size);
        // console.log(size);
        // console.log(offset + req.file.size);
        if((parseInt(offset) + req.file.size) >= parseInt(size))
        {
            //set file mod to read only
            fs.chmodSync(`${fullStoragePath}/${name}`, fs.constants.S_IRUSR | fs.constants.S_IWUSR)

            const exists = await files.findOne({where: {name: name, path: bucket_path, bucket_id: bucket_id}})
            const buck = await bucket.findByPk(bucket_id)
            
            if(!exists)
            {
                console.log("it doesn't exist");
                const newFile = await files.create({name: name,path: bucket_path, bucket_id: bucket_id, size: size})
                await buck.update({files_count: buck.files_count+1})
            }
            else
            {
                console.log("it exists");
                const oldSize = exists.size;
                await exists.update({name: name, path: bucket_path, size: size})
                
                
            }
            
            
            
            return res.status(201).json({download_url: `http://localhost:5000/api/files/download/${buck.key}?path=${bucket_path}/${name}`})
        }

        const progress = (offset + req.file.size)/size*100;
        return res.status(200).json({status: "write", progress: progress, size: size})



    } catch (error) {
        console.log(error.message);
        throw error
        return res.status(500).json({error: "server error"})
    }
    

})
filesRouter.get('/download/:bucketkey',(req,res) => {
    
  const {bucketkey} = req.params;
  const {path} = req.query;
    if(!path)
        return res.status(400).json({error: "invalid fields"})

  jwt.verify(bucketkey, process.env.JWT_BUCKET_KEY_SECRET, (err,payload) => {
        if(err)
            return res.status(401).json({error: "invalid key"})

        const {bucket_id} = payload;
        
        try {
            const storagePath = `${process.env.BUCKETS_DIRECTORY}/${bucket_id}_${path}`;
            const fileExists = fs.existsSync(storagePath)
            if(!fileExists)
                return res.status(400).json({error: "no file"})
    
            const fileName = path.split('/').slice(-1)
            return res.status(200).download(storagePath, fileName)
        
        } catch (error) {
        
            console.log(error.message);
            return res.status(500).json({error: "server error"})
        }
  })
   
   

})

export default filesRouter;