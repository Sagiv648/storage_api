import {Sequelize,DataTypes} from 'sequelize'
import dotenv from 'dotenv'
import { __dirname } from './storageConfig.js';
dotenv.config();


const db = new Sequelize({
    dialect: 'sqlite',
    storage: `${__dirname}/${process.env.DB_PATH}`
  })

export default db