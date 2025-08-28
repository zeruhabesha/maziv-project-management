require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'maziv_user',
    password: process.env.DB_PASS || 'Y0x1lLB1r8AI8oLmOQ009R3ej0eVY4I7',
    database: process.env.DB_NAME || 'maziv_project',
    host: process.env.DB_HOST || 'dpg-d2neh77diees73cicfl0-a.oregon-postgres.render.com',
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
     logging: false,
  },
  test: {
    username: process.env.DB_USER || 'maziv_user',
    password: process.env.DB_PASS || 'Y0x1lLB1r8AI8oLmOQ009R3ej0eVY4I7',
    database: process.env.DB_NAME || 'maziv_project',
    host: process.env.DB_HOST || 'dpg-d2neh77diees73cicfl0-a.oregon-postgres.render.com',
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};
 