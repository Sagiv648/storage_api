import { Router } from "express";
import fs from 'fs'
import dotenv from 'dotenv'
import upload from "../config/storageConfig.js";
import files from "../Models/file.js";
import bucket from "../Models/bucket.js";
import diskUpload from "../config/diskStorageConfig.js";
import jwt from 'jsonwebtoken'
import { MulterError } from "multer";

dotenv.config()

const filesRouter = Router();


filesRouter.put('/action', async (req,res) => {
    const {bucket_key,id} = req.data;
    const {old_path,new_path} = req.query;
    const {name} = req.query;
    const {op} = req.query;
    

    if(op !== "cp" && op !== "mv")
        return res.status(400).json({error: "invalid action"})

    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`

    if(!fs.existsSync(`${relativeRoot}/${new_path}`))
        return res.status(400).json({error: "invalid new path"})
    
    try {
        const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
        const fileRecordExists = await files.findAll({where: {bucket_id: bucketRecord.id,path: new_path,name: name}})
        if(fileRecordExists.length != 0)
            return res.status(400).json({error: "files duplication"})
        
        const fileRecord = await files.findOne({where: {bucket_id: bucketRecord.id,path: old_path,name: name}})
        
        if(op === 'cp' && BigInt(fileRecordExists.size) + BigInt(bucketRecord.size) >= BigInt(bucketRecord.limit))
            return res.status(400).json({error: "not enough bucket space"})
        

        fs.copyFileSync(`${relativeRoot}/${old_path}/${name}`, `${relativeRoot}/${new_path}/${name}`)
        const urlToken = jwt.sign({key: bucket_key,path: new_path, name: name},process.env.DOWNLOAD_SIGN_KEY)
               
        const newDownloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}/${urlToken}`
        
        if(op === 'cp')
        {
            const newFileRecord = await files.create({path: new_path,name: name,bucket_id: bucketRecord.id,size: BigInt(fileRecord.size),download_url: newDownloadUrl})
            await bucketRecord.update({files_count: bucketRecord.files_count+1, size: BigInt(bucketRecord.size) + BigInt(newFileRecord.size)})
            return res.status(200).json(newFileRecord)
        }
        else
        {
            fs.rmSync(`${relativeRoot}/${old_path}/${name}`)
            await fileRecord.update({path: new_path, download_url: newDownloadUrl})
        }
        


        return res.status(200).json(fileRecord)
    } catch (error) {
        console.log(error.message);
        
        return res.status(500).json({error: "server error"})
    }
})

//Multipart/form-data fields:
//1. file: [file]
//2. path: /....../
//3. name: [file_name]
//4. size: [file_size]
//5. start: [write_offset]


filesRouter.post('/upload-fixed' ,async (req,res) => {
    
    diskUpload.single("file")(req,res, (err) => {
        if(err instanceof Error)
        {
            console.log(err.message);
            
        }
        
        const result = req.result;
        return res.status(201).json(result)
    })
    
    

})

filesRouter.post('/upload', upload.single('file'), async (req,res) => {
    const {start,size,path,name} = req.body;
    const {bucket_key,id} = req.data;
    
    const {buffer} = req.file;
    
    if(isNaN(start) || isNaN(size))
        return res.status(400).json({error: "invalid fields"})
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    try {




        if(BigInt(start) == 0)
        {
            
            const bucketRecordSize = await bucket.findOne({where: {key: bucket_key}})
            if(BigInt(bucketRecordSize.size) + BigInt(size) >= BigInt(bucketRecordSize.limit))
                return res.status(400).json({error: "not enough bucket space"})

            // if(!fs.existsSync(`${relativeRoot}/${path}`))
            //     return res.status(400).json({error: "invalid path"})
            if(!fs.existsSync(`${relativeRoot}/${path}`))
            {
                fs.mkdirSync(`${relativeRoot}/${path}`, {recursive: true})
            }
            fs.writeFileSync(`${relativeRoot}/${path}/${name}`, buffer)
            
            
        }
        else
            fs.appendFileSync(`${relativeRoot}/${path}/${name}`, buffer)
            //return res.status(200).json({progress: parseInt(start) + buffer.length, size: parseInt(size)})
        

        if(BigInt(start) + BigInt( buffer.length) >= BigInt(size))
        {



            //Persist in db
            

            const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
            const exists = await files.findOne({where: {path: path, name: name, bucket_id: bucketRecord.id}})
            fs.chmodSync(`${relativeRoot}/${path}/${name}`, fs.constants.S_IRUSR | fs.constants.S_IWUSR)
            if(!exists)
            {
                const urlToken = jwt.sign({key: bucket_key,path: path, name: name},process.env.DOWNLOAD_SIGN_KEY)
                console.log(urlToken);
                const downloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}/${urlToken}`
                const fileRecord = await files.create({name: name, path: path, size: BigInt(size), bucket_id: bucketRecord.id, download_url: downloadUrl})
                await bucketRecord.update({files_count: bucketRecord.files_count + 1, size: (BigInt( bucketRecord.size) + BigInt( fileRecord.size))})
                return res.status(201).json({id: fileRecord.id, 
                                            name: fileRecord.name,
                                            path: fileRecord.path,
                                            download_url: fileRecord.download_url})
            }
            else
            {
                await bucketRecord.update({size: (BigInt(bucketRecord.size) - BigInt(exists.size) + BigInt(size))})
                await exists.update({size: BigInt(size)})
                
            }
            
            return res.status(201).json({id: exists.id, 
                                        name: exists.name,
                                        path: exists.path,
                                        download_url: exists.download_url})
        }
        
        return res.status(200).json({progress: (BigInt(start) + BigInt(buffer.length)).toString(), size: BigInt(size).toString()})

    } catch (error) {

        console.log(error.message);
        throw error
        return res.status(500).json({error: "server error"})
    }
})





filesRouter.put('/', async (req,res) => {
    const {bucket_key,id} = req.data;
    const {old_name, new_name} = req.body;
    const {path} = req.query
    if(!old_name || !new_name)
        return res.status(400).json({error: "invalid fields"})
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    try {
        const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
        const fileRecordExists = await files.findAll({where: {bucket_id: bucketRecord.id, path: path, name: new_name}})
        if(fileRecordExists.length != 0)
            return res.status(400).json({error: "invalid new name"})
        
        const fileRecord = await files.findOne({where: {bucket_id: bucketRecord.id, path: path, name: old_name}})
        
        const urlToken = jwt.sign({key: bucket_key,path: path, name: name},process.env.DOWNLOAD_SIGN_KEY)
               
        const newDownloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}/${urlToken}`
        await fileRecord.update({name: new_name, download_url: newDownloadUrl})
        fs.renameSync(`${relativeRoot}/${path}/${old_name}`, `${relativeRoot}/${path}/${new_name}`)

        return res.status(200).json(fileRecord)

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({error: "server error"})
    }
})

filesRouter.delete('/', async (req,res) => {

    const {bucket_key,id} = req.data;
    const {path}=req.query;
    const {name} = req.query;
    if(!path)
        return res.status(400).json({error: "invalid fields"})
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    try {
        const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
        const fileRecord = await files.findOne({where: {bucket_id: bucketRecord.id, path: path, name: name}})
        if(!fileRecord)
            return res.status(400).json({error: "invalid file"})
        await bucketRecord.update({size: bucketRecord.size - fileRecord.size, files_count: bucketRecord.files_count-1})
        await fileRecord.destroy()
        
        fs.rmSync(`${relativeRoot}/${path}/${name}`)
        return res.status(200).json(fileRecord)

    } catch (error) {
        
        return res.status(500).json({error: "server error"})
    }
})

export default filesRouter;