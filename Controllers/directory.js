import { Router } from "express";
import fs, { rmdirSync } from 'fs'
import files from "../Models/file.js";
import bucket from "../Models/bucket.js";

const directoryRouter = Router();

directoryRouter.post('/', (req,res) => {
    const {bucket_key, id} = req.data;
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    const {path} = req.body;
    try {
        
        if(!path)
        return res.status(400).json({error: "invalid fields"})
        if(fs.existsSync(`${relativeRoot}/${path}`))
            return res.status(400).json({error: "path exists"})
        fs.mkdirSync(`${relativeRoot}/${path}`)

        return res.status(201).json({path: path})

    } catch (error) {
        return res.status(500).json({error: "server error"})
    }
    
})

directoryRouter.put('/', (req,res) => {
    const {bucket_key, id} = req.data;
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    const {old_path, new_path} = req.body;
    
    if(!old_path || !new_path)
        return res.status(400).json({error: "invalid fields"})
    try {
        if(!fs.existsSync(`${relativeRoot}/${old_path}`))
            return res.status(400).json({error: "path doesn't exist"})
        fs.renameSync(`${relativeRoot}/${old_path}`, `${relativeRoot}/${new_path}`)
        return res.status(200).json({new_path: new_path})
    } catch (error) {
        return res.status(500).json({error: "server error"})
    }
    
})

//TODO: remove directory - will require deeper testing
directoryRouter.delete('/', async (req,res) => {
    
    const {bucket_key,id} = req.data;
    
    const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
    
    const {path} = req.body;
    try {
        const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
        const allFilesByPath = await files.findAll({where: {path: path, bucket_id: bucketRecord.id}})
        let size = 0;
        for(let i =0; i < allFilesByPath.length; i++)
            size += allFilesByPath[i].size;
        await bucketRecord.update({size: bucketRecord.size - size, files_count: bucketRecord.files_count - allFilesByPath.length})
        await files.destroy({where: {path: path, bucket_id: bucketRecord.id}})

        fs.rmSync(`${relativeRoot}/${path}`, {recursive: true})

    } catch (error) {
        
        return res.status(500).json({error: "server error"})
    }
    
    return res.status(200).json({deleted: "path"})
})

export default directoryRouter