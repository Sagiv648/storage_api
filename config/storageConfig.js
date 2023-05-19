import multer from "multer";
import * as url from 'url'

const MAX_BUFFER = 1024*1024

const memBuffer = multer.memoryStorage()

const upload = multer(
    {
    storage: memBuffer, 
    limits: {
                fileSize: MAX_BUFFER
            },
     
    })



export const __dirname = url.fileURLToPath(new URL('./../', import.meta.url));

export default upload