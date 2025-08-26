const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const configJson = require('./config.json');
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = configJson[env];

if (!config) {
  throw new Error(`No database configuration found for environment: ${env}`);
}

let sequelize;

try {
  // Check if we should use DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for database connection');
    
    // Handle SSL for production
    const isProduction = process.env.NODE_ENV === 'production';
    const sslOptions = isProduction 
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {};

    sequelize = new Sequelize(process.env.DATABASE_URL, {
      ...config,
      logging: console.log, // Enable logging for debugging
      dialectOptions: {
        ...config.dialectOptions,
        ...sslOptions
      }
    });
  } 
  // Fall back to config from config.json
  else if (config.use_env_variable && process.env[config.use_env_variable]) {
    console.log(`Using ${config.use_env_variable} for database connection`);
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else if (config.database && config.username && config.password) {
    console.log('Using config from config.json for database connection');
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  } else {
    throw new Error('No valid database configuration found. Please check your environment variables and config.json');
  }
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  throw error; // Re-throw to prevent the app from starting with a bad DB connection
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