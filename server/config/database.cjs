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
    if (!url) {
      throw new Error('Database URL is empty');
    }
    
    console.log('Raw DATABASE_URL:', url);
    
    // If the URL is in the format 'DATABASE_URL=postgres://...', extract just the URL part
    if (url.startsWith('DATABASE_URL=')) {
      url = url.split('=')[1];
    }
    
    // Handle Render's PostgreSQL URL format
    if (url.startsWith('postgres://')) {
      url = url.replace('postgres://', 'postgresql://');
    }
    
    // Basic validation
    if (!url || !url.startsWith('postgresql://')) {
      throw new Error('Invalid database URL format. Must start with postgresql://');
    }
    
    // Parse the URL
    const parsed = new URL(url);
    
    // Extract database name from path (remove leading slash and any query params)
    const database = parsed.pathname.replace(/^\//, '').split('?')[0];
    
    const dbConfig = {
      database: database,
      username: parsed.username ? decodeURIComponent(parsed.username) : null,
      password: parsed.password ? decodeURIComponent(parsed.password) : null,
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
      logging: (sql, options) => {
        console.log(`[${new Date().toISOString()}]`, sql);
      }
    };
    
    console.log('Database configuration:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username ? '***' : 'not set',
      password: dbConfig.password ? '***' : 'not set',
      ssl: dbConfig.dialectOptions.ssl ? 'enabled' : 'disabled'
    });
    
    return dbConfig;
  } catch (error) {
    console.error('Error parsing database URL:', error);
    console.error('Problematic URL:', url);
    throw new Error(`Database configuration error: ${error.message}`);
  }
};

// Function to get database config from environment
const getDbConfigFromEnv = () => {
  // Check if we have a direct database URL
  const dbUrl = process.env.DATABASE_URL || 
               (config.use_env_variable && process.env[config.use_env_variable]);
  
  if (dbUrl) {
    console.log('Using database URL from environment');
    try {
      const dbConfig = parseDatabaseUrl(dbUrl);
      return {
        ...dbConfig,
        ...config,
        dialect: 'postgres',
        dialectOptions: {
          ...(config.dialectOptions || {}),
          ...(dbConfig.dialectOptions || {})
        }
      };
    } catch (error) {
      console.error('Error parsing database URL:', error);
      // Continue to try other config methods
    }
  }
  
  // Try to use individual environment variables
  const envConfig = {
    database: process.env.DB_NAME || config.database,
    username: process.env.DB_USER || config.username,
    password: process.env.DB_PASSWORD || config.password,
    host: process.env.DB_HOST || config.host,
    port: process.env.DB_PORT || config.port,
    dialect: 'postgres',
    ...config
  };
  
  if (envConfig.database && envConfig.username && envConfig.password) {
    console.log('Using database config from individual environment variables');
    return envConfig;
  }
  
  return null;
};

try {
  // Try to get config from environment first
  const dbConfig = getDbConfigFromEnv();
  
  if (dbConfig) {
    console.log('Initializing database with config:', {
      ...dbConfig,
      password: dbConfig.password ? '***' : 'no password',
      ssl: dbConfig.ssl ? 'enabled' : 'disabled'
    });
    
    sequelize = new Sequelize(dbConfig);
  } else if (config.database && config.username && config.password) {
    // Fall back to config file
    console.log('Using config from config.json for database connection');
    sequelize = new Sequelize({
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