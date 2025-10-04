// config/config.js (ESM)
export default {
  development: {
    username: "maziv_user",
    password: "Y0x1lLB1r8AI8oLmOQ009R3ej0eVY4I7",
    database: "maziv_project",
    host: "dpg-d2neh77diees73cicfl0-a.oregon-postgres.render.com",
    port: 5432,
    dialect: "postgres"
  },
  test: { /* same as above */ },
  production: {
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
