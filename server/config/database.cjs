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

// Helper function to parse database URL
const parseDatabaseUrl = (url) => {
  try {
    // Handle Render's PostgreSQL URL format
    if (url.startsWith('postgres://')) {
      url = url.replace('postgres://', 'postgresql://');
    }
    
    // Parse the URL
    const parsed = new URL(url);
    
    // Extract authentication
    const auth = parsed.username ? {
      username: parsed.username,
      password: parsed.password,
    } : {};
    
    return {
      database: parsed.pathname.replace(/^\//, ''),
      username: auth.username || null,
      password: auth.password || null,
      host: parsed.hostname,
      port: parsed.port || 5432,
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: console.log
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
};

try {
  // Check if we should use DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for database connection');
    
    // Parse the DATABASE_URL and create a new config object
    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    
    // Merge with existing config
    sequelize = new Sequelize({
      ...dbConfig,
      ...config,
      // Override with production SSL settings if needed
      dialectOptions: {
        ...(config.dialectOptions || {}),
        ...(dbConfig.dialectOptions || {})
      }
    });
  } 
  // Fall back to config from config.json
  else if (config.use_env_variable && process.env[config.use_env_variable]) {
    console.log(`Using ${config.use_env_variable} for database connection`);
    const dbConfig = parseDatabaseUrl(process.env[config.use_env_variable]);
    sequelize = new Sequelize({
      ...dbConfig,
      ...config,
      dialectOptions: {
        ...(config.dialectOptions || {}),
        ...(dbConfig.dialectOptions || {})
      }
    });
  } else if (config.database && config.username && config.password) {
    console.log('Using config from config.json for database connection');
    sequelize = new Sequelize(config.database, config.username, config.password, {
      ...config,
      dialect: config.dialect || 'postgres',
      logging: console.log
    });
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