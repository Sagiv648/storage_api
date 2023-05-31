import db from "../config/dbConfig.js";
import sequelize from 'sequelize'

const application = db.define("applications", {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: sequelize.DataTypes.INTEGER,
    },
    name: {
        type: sequelize.DataTypes.STRING,
        allowNull: false
    },
    user: {
        type: sequelize.DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    
    bucket_key: {
        type: sequelize.DataTypes.STRING
    },
    key: {
        type: sequelize.DataTypes.STRING
    },
    auth_key_secret: {
        type: sequelize.DataTypes.STRING
    }
    
})
export default application
