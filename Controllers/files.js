import { Router } from "express";
import fs from 'fs'
import dotenv from 'dotenv'
import upload from "../config/storageConfig.js";
import files from "../Models/file.js";
import bucket from "../Models/bucket.js";

import jwt from 'jsonwebtoken'

dotenv.config()

const filesRouter = Router();

const copyFile = async (old_path,new_path, name) => {

}


filesRouter.put('/action', async (req,res) => {
    const {bucket_key,id} = req.data;
    const {old_path,new_path} = req.query;
    const {name} = req.query;
    const {op} = req.query;
    if(!old_path || !new_path)
        return res.status(400).json({error: "invalid fields"})

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
        
        fs.copyFileSync(`${relativeRoot}/${old_path}/${name}`, `${relativeRoot}/${new_path}/${name}`)
        const newDownloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}?path=${new_path}/${name}`
        
        if(op === 'cp')
        {
            const newFileRecord = await files.create({path: new_path,name: name,bucket_id: bucketRecord.id,size: fileRecord.size,download_url: newDownloadUrl})
            await bucketRecord.update({files_count: bucketRecord.files_count+1, size: bucketRecord.size + newFileRecord.size})
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

filesRouter.post('/upload', upload.single('file'), async (req,res) => {
    const {start,size,path,name} = req.body;
    const {bucket_key,id} = req.data;
    console.log(req.file);
    const {buffer} = req.file;
    //return res.status(500).json({test:"1"})
    if(isNaN(start) || isNaN(size))
        return res.status(400).json({error: "invalid fields"})
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    try {

        if(parseInt(start) == 0)
        {
            if(!fs.existsSync(`${relativeRoot}/${path}`))
                return res.status(400).json({error: "invalid path"})
            
            fs.writeFileSync(`${relativeRoot}/${path}/${name}`, buffer)
            
            
        }
        else
            fs.appendFileSync(`${relativeRoot}/${path}/${name}`, buffer)
            //return res.status(200).json({progress: parseInt(start) + buffer.length, size: parseInt(size)})
        

        if(parseInt(start) + buffer.length >= parseInt(size))
        {



            //Persist in db
            

            const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
            const exists = await files.findOne({where: {path: path, name: name, bucket_id: bucketRecord.id}})
            fs.chmodSync(`${relativeRoot}/${path}/${name}`, fs.constants.S_IRUSR | fs.constants.S_IWUSR)
            if(!exists)
            {
                const downloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}?path=${path}/${name}`
                const fileRecord = await files.create({name: name, path: path, size: parseInt(size), bucket_id: bucketRecord.id, download_url: downloadUrl})
                await bucketRecord.update({files_count: bucketRecord.files_count + 1, size: (parseInt( bucketRecord.size) + parseInt( fileRecord.size))})
                return res.status(201).json(fileRecord)
            }
            else
            {
                await bucketRecord.update({size: (parseInt(bucketRecord.size) - parseInt(exists.size) + parseInt(size))})
                await exists.update({size: parseInt(size)})
                
            }
            
            return res.status(201).json(exists)
        }
        
        return res.status(200).json({progress: parseInt(start) + buffer.length, size: parseInt(size)})

    } catch (error) {

        console.log(error.message);
        
        return res.status(500).json({error: "server error"})
    }
})


filesRouter.get('/download', (req,res) => {
    const {bucket_key,id} = req.data;
    const {path} = req.query;
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    if(!path)
        return res.status(400).json({error: "invalid fields"})

    try {
        if(!fs.existsSync(`${relativeRoot}/${path}`))
            return res.status(400).json({error: "invalid path"})
        const fileName = path.split('/').slice(-1)
        return res.status(200).download(`${relativeRoot}/${path}`,fileName)
    } catch (error) {
        
    }
    return res.status(200).json({test:"test"})
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
        const newDownloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}?path=${path}/${new_name}`
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

filesRouter.get('/', async (req,res) => {
    const {bucket_key, id} = req.data;

    try {
        const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
        const allFiles = await files.findAll({where: {bucket_id: bucketRecord.id}})

        return res.status(200).json({key: bucket_key, files: allFiles})

    } catch (error) {
        
        return res.status(500).json({error: "server error"})
    }
})

export default filesRouter;