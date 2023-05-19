import user from "../Models/user.js";
import jwt from 'jsonwebtoken'
export default {
    origin: async (origin,cb) => {

        

        console.log(origin);
        cb(null,true)
    }
}