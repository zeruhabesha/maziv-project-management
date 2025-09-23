// server/config/database.cjs
// CommonJS module: safe to import from ESM via default import.

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");

dotenv.config(); // load .env (development) if present

const ENV = process.env.NODE_ENV || "development";

// ---- Helpers ----------------------------------------------------------------

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function loadJson(p) {
  try {
    return require(p);
  } catch (e) {
    return null;
  }
}

function loadCjs(p) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    return require(p);
  } catch {
    return null;
  }
}

// Try several locations for config files
function findConfigObject() {
  const candidates = [
    // JSON candidates
    path.join(__dirname, "config.json"),           // server/config/config.json
    path.join(__dirname, "..", "config.json"),     // server/config.json
    // CJS candidates (module exporting the same shape as config.json)
    path.join(__dirname, "config.cjs"),            // server/config/config.cjs
    path.join(__dirname, "..", "config.cjs"),      // server/config.cjs
  ];

  for (const p of candidates) {
    if (!fileExists(p)) continue;
    const ext = path.extname(p).toLowerCase();
    const loaded = ext === ".json" ? loadJson(p) : loadCjs(p);
    if (loaded && typeof loaded === "object") {
      console.log(`[DB] Loaded config from: ${p}`);
      return loaded;
    }
  }
  return null;
}

// Build config from env vars (DB_* style)
function buildConfigFromDiscreteEnv() {
  const hasCore =
    process.env.DB_HOST &&
    process.env.DB_USER &&
    (process.env.DB_PASSWORD || process.env.DB_PASSWORD === "") &&
    process.env.DB_NAME;

  if (!hasCore) return null;

  const sslOn =
    (process.env.DB_SSL || "").toLowerCase() === "true" ||
    (process.env.PGSSL || "").toLowerCase() === "true" ||
    ENV === "production";

  const dialectOptions = sslOn
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined;

  return {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    dialectOptions,
    logging: false,
  };
}

// Resolve final DB config
function resolveDbConfig() {
  // 1) First try config.json / config.cjs (with development/test/production keys)
  const fileCfg = findConfigObject();
  if (fileCfg && fileCfg[ENV]) {
    console.log(`[DB] Using config for NODE_ENV="${ENV}" from file`);
    const picked = fileCfg[ENV];

    return {
      database: picked.database,
      username: picked.username,
      password: picked.password,
      host: picked.host,
      port: picked.port,
      dialect: picked.dialect || "postgres",
      dialectOptions: picked.dialectOptions || {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: process.env.DB_LOGGING === 'true',
      pool: picked.pool || {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  }

  // 2) DATABASE_URL (Render/Heroku)
  if (process.env.DATABASE_URL) {
    const sslOn =
      (process.env.PGSSL || "").toLowerCase() === "true" ||
      (process.env.DATABASE_SSL || "").toLowerCase() === "true" ||
      ENV === "production";

    const dialectOptions = sslOn
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined;

    console.log("[DB] Using DATABASE_URL");
    return {
      url: process.env.DATABASE_URL,
      dialect: "postgres",
      dialectOptions,
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  // 3) Fall back to discrete env variables (DB_HOST, DB_USER, ...)
  const envCfg = buildConfigFromDiscreteEnv();
  if (envCfg) {
    console.log("[DB] Using discrete DB_* environment variables");
    return {
      ...envCfg,
      dialectOptions: envCfg.dialectOptions || {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  return null;
}

// ---- Sequelize Singleton -----------------------------------------------------

let sequelize;

function getOrCreateSequelize() {
  if (sequelize) {
    return sequelize;
  }

  const dbConfig = resolveDbConfig();
  if (!dbConfig) {
    throw new Error("No database configuration found. Please check your environment variables or config files.");
  }

  console.log('Database config:', {
    database: dbConfig.database,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username ? '***' : undefined,
    dialect: dbConfig.dialect,
    ssl: dbConfig.dialectOptions?.ssl || false,
    pool: dbConfig.pool || {}
  });

  if (dbConfig.url) {
    sequelize = new Sequelize(dbConfig.url, {
      dialect: dbConfig.dialect,
      dialectOptions: dbConfig.dialectOptions,
      logging: dbConfig.logging,
      pool: dbConfig.pool || {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        dialectOptions: dbConfig.dialectOptions,
        logging: dbConfig.logging,
        pool: dbConfig.pool || {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
  
  return sequelize;
}

// Initialize sequelize instance
getOrCreateSequelize();

// ---- Public API --------------------------------------------------------------

async function initializeDatabase(options = {}) {
  const { devAlterSync = process.env.DB_SYNC_ALTER === "true" } = options;
  
  try {
    console.log("🔍 Initializing database connection...");
    console.log(`Environment: ${ENV}`);
    
    // Log database configuration (without sensitive data)
    const config = sequelize.config;
    console.log("Database config:", {
      database: config.database,
      host: config.host,
      port: config.port,
      username: config.username ? '***' : undefined,
      dialect: config.dialect,
      ssl: config.dialectOptions?.ssl || false,
      pool: config.pool || {}
    });

    // Test connection
    console.log("Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection OK");

    // Only run sync in development
    if (ENV === "development") {
      if (devAlterSync) {
        console.log("🔄 Running development sync with alter=true...");
        await sequelize.sync({ alter: true });
        console.log("✅ Development sync completed");
      } else {
        console.log("ℹ️ Database sync skipped (DB_SYNC_ALTER not set to 'true')");
      }
    } else {
      console.log("ℹ️ Production environment - skipping sync");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", {
      name: error.name,
      message: error.message,
      code: error.original?.code,
      sql: error.sql,
      stack: error.stack
    });
    throw error; // Re-throw to allow handling by the caller
  }
}

async function getSequelize() {
  return getOrCreateSequelize();
}

module.exports = {
  get sequelize() {
    return getOrCreateSequelize();
  },
  initializeDatabase,
  getSequelize,
};
