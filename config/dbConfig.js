import {Sequelize,DataTypes} from 'sequelize'
import dotenv from 'dotenv'
import { __dirname } from './storageConfig.js';
dotenv.config();


const db = new Sequelize('storage_api', process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT
})

// const db = new Sequelize({
//     dialect: 'sqlite',
//     storage: `${__dirname}/${process.env.DB_PATH}`
//   })

export default db