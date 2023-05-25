import db from "../config/dbConfig.js";
import sequelize from 'sequelize'

export default db.define("buckets", {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: sequelize.DataTypes.INTEGER,
    },
    key: {
        type: sequelize.DataTypes.STRING,
        
    },
    size: {
        type: sequelize.DataTypes.BIGINT,
        defaultValue: 0
        
        
    },
    files_count: {
        type: sequelize.DataTypes.INTEGER,
        defaultValue: 0,
        
       
    }
})