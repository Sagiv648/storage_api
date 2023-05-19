import { Router } from "express";
import dotenv from 'dotenv'
const bucketRouter = Router();
dotenv.config()

//TODO: Create a bucket for a user, a user can get only one bucket, when a user registers his bucket he will recieve a key.
//The key will be used as origin to access the buckets
bucketRouter.post('/', async(req,res) => {
    console.log(req.data);
})

//TODO: Changes the name of the bucket
bucketRouter.put('/', async( req,res) => {

})

export default bucketRouter