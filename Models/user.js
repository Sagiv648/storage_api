import db from "../config/dbConfig.js"
import { DataTypes } from "sequelize";

export default db.define("users", {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    email: {
        allowNull: false,
        type: DataTypes.STRING
    }
    ,
    password: {
        allowNull: false,
        type: DataTypes.STRING
    },
    
})
