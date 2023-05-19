import db from "../config/dbConfig.js";
import sequelize from 'sequelize'
import bucket from "./bucket.js";
const files = db.define("files", {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: sequelize.DataTypes.INTEGER,
    },
    name: {
        type: sequelize.DataTypes.STRING,
        allowNull: false
    },
    path: {
        type: sequelize.DataTypes.STRING,
        allowNull: false
    },
    bucket_id: {
        type: sequelize.DataTypes.INTEGER,
        references: {
            model: 'buckets',
            key: 'id'
        }
    },
    size: {
        type: sequelize.DataTypes.INTEGER,
        defaultValue: 0
    }
})
export default files
