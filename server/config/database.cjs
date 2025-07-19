const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const configJson = require('./config.json');
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = configJson[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

const getSequelize = () => {
  return sequelize;
};

module.exports = { sequelize, connectDB, getSequelize };