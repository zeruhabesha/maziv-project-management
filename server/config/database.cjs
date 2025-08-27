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
  // In production, always use DATABASE_URL if available
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL || 
                 (config.use_env_variable && process.env[config.use_env_variable]);
    
    if (dbUrl) {
      console.log('Using production database URL from environment');
      try {
        const dbConfig = parseDatabaseUrl(dbUrl);
        // In production, we want to ensure SSL is enabled
        return {
          ...dbConfig,
          dialect: 'postgres',
          protocol: 'postgres',
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          },
          // Don't merge with config from config.json in production
          // to avoid any local development settings leaking in
          logging: (sql, options) => {
            console.log(`[${new Date().toISOString()}]`, sql);
          }
        };
      } catch (error) {
        console.error('Error parsing production database URL:', error);
        throw error; // Fail fast in production
      }
    }
    throw new Error('DATABASE_URL is required in production environment');
  }
  
  // Development environment - try local config
  const envConfig = {
    database: process.env.DB_NAME || config.database,
    username: process.env.DB_USER || config.username,
    password: process.env.DB_PASSWORD || config.password,
    host: process.env.DB_HOST || config.host || 'localhost',
    port: process.env.DB_PORT || config.port || 5432,
    dialect: 'postgres',
    protocol: 'postgres',
    logging: console.log
  };
  
  if (envConfig.database && envConfig.username) {
    console.log('Using development database config');
    return envConfig;
  }
  
  return null;
};

// Initialize database connection
const initializeDatabase = async () => {
  try {
    // Get the database configuration
    const dbConfig = getDbConfigFromEnv();
    
    if (!dbConfig) {
      throw new Error('No valid database configuration found');
    }
    
    console.log('Initializing database with config:', {
      ...dbConfig,
      password: dbConfig.password ? '***' : 'no password',
      ssl: dbConfig.dialectOptions?.ssl ? 'enabled' : 'disabled',
      host: dbConfig.host,
      database: dbConfig.database,
      username: dbConfig.username ? '***' : 'not set'
    });
    
    // Initialize Sequelize with the configuration
    const instance = new Sequelize(dbConfig);
    
    // Test the connection
    await instance.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return instance;
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error);
    throw error; // Re-throw to prevent the app from starting with a bad DB connection
  }
};

// Initialize the database connection when this module is loaded
// let sequelize;
let isInitialized = false;

// This will be called when the module is first imported
(async () => {
  try {
    sequelize = await initializeDatabase();
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

const connectDB = async () => {
    try {
        // Wait for the database to initialize if it's not ready yet
        if (!isInitialized) {
            console.log('Waiting for database to initialize...');
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!isInitialized && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                console.log(`Waiting for database... (${attempts}/${maxAttempts})`);
            }
            
            if (!isInitialized) {
                throw new Error('Database initialization timed out');
            }
        }
        
        // Test the connection
        await sequelize.authenticate();
        
        // Sync all models in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Syncing database models...');
            await sequelize.sync();
        }
        
        console.log('✅ Database connection is ready');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

const getSequelize = () => {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return sequelize;
};

// Export the initialized sequelize instance and functions
module.exports = {
  // The sequelize instance (might be undefined if not initialized yet)
  sequelize: () => {
    if (!isInitialized) {
      throw new Error('Database not initialized. Call connectDB() first.');
    }
    return sequelize;
  },
  connectDB,
  getSequelize,
  // Add a method to check if database is initialized
  isInitialized: () => isInitialized
};