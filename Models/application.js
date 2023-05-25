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
    key: {
        type: sequelize.DataTypes.STRING
    }
    
})
export default application
