const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection configuration - using production credentials
const dbConfig = {
  database: 'maziv_project',
  username: 'maziv_user',
  password: 'Y0x1lLB1r8AI8oLmOQ009R3ej0eVY4I7',
  host: 'dpg-d2neh77diees73cicfl0-a.oregon-postgres.render.com',
  port: 5432,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Log the configuration (without password)
console.log('Database Configuration:');
console.log({
  ...dbConfig,
  password: dbConfig.password ? '***' : 'not set',
  dialectOptions: {
    ...dbConfig.dialectOptions,
    ssl: dbConfig.dialectOptions.ssl ? 'enabled' : 'disabled'
  }
});

// Create a new connection
const sequelize = new Sequelize(dbConfig);

// Test the connection
async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test a simple query
    console.log('\n🔍 Testing a simple query...');
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    console.log('✅ Query test successful. 1+1 =', results[0].result);
    
    // Check if users table exists and has data
    try {
      const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table exists and has ${users[0].count} records.`);
    } catch (tableError) {
      console.log('ℹ️ Users table not found or not accessible:', tableError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', {
      name: error.name,
      message: error.message,
      original: error.original,
      sql: error.sql,
      stack: error.stack
    });
    return false;
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log(success ? '\n✅ All tests completed successfully!' : '\n❌ Some tests failed.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
