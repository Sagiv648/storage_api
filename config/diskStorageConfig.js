import multer from "multer";
import dotenv from 'dotenv'
import files from "../Models/file.js";
import bucket from "../Models/bucket.js";
import fs from 'fs'
dotenv.config()
const MAX_BUFFER = 1024*1024

const diskStorage = multer.diskStorage({
    //Creates the path 
    destination: async (req,file,cb) => {
        // const {bucket_key,id} = req.data;
        
        // const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
        // cb(null,`${relativeRoot}`)
        const {size,path,name} = req.body;
        
        const {bucket_key,id} = req.data;
        
        const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
        if(!fs.existsSync(`${relativeRoot}/${path}`))
        {
            fs.mkdirSync(`${relativeRoot}/${path}`, {recursive: true})
        }
        try {
            const bucketRecord = await bucket.findOne({where: {key: bucket_key}})
            const exists = await files.findOne({where: {path: path, name: name, bucket_id: bucketRecord.id}})
            //fs.chmodSync(`${relativeRoot}/${path}/${name}`, fs.constants.S_IRUSR | fs.constants.S_IWUSR)
            if(!exists)
            {
                const downloadUrl = `${process.env.DOWNLOAD_URL_BASE_URL}?path=${path}/${name}`
                const fileRecord = await files.create({name: name, path: path, size: Number(size), bucket_id: bucketRecord.id, download_url: downloadUrl})
                await bucketRecord.update({files_count: bucketRecord.files_count + 1, size: (Number( bucketRecord.size) + Number( fileRecord.size))})
                req.result = fileRecord
                //return res.status(201).json(fileRecord)
            }
            else
            {
                await bucketRecord.update({size: (Number(bucketRecord.size) - Number(exists.size) + Number(size))})
                await exists.update({size: Number(size)})
                req.result = exists
            }
            
            cb(null,`${relativeRoot}/${path}`)
        } catch (error) {
            cb(error,null)
        }
        
        
    },
    filename: async (req,file,cb) => {
        
        const {name} = req.body;
        const {bucket_key,id} = req.data;
        const relativeRoot = `${process.env.BUCKETS_DIRECTORY}/${bucket_key}`
        //console.log(name);
        cb(null,`${name}`)
    }
})

const diskUpload = multer({storage: diskStorage, limits: {fileSize: 1024*1024*1024*5}})







export default diskUpload