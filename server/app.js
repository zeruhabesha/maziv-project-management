import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import rateLimit from 'express-rate-limit';

import pkg from "./config/database.cjs";
const { sequelize, connectDB } = pkg;
import { authenticateToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import * as authRoutes from "./routes/auth.js";
import * as projectRoutes from "./routes/projects.js";
import * as itemRoutes from "./routes/items.js";
import * as userRoutes from "./routes/users.js";
import * as reportRoutes from "./routes/reports.js";
import { checkDeadlines } from "./services/alertService.js";

// Load environment variables first
dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1);
app.get("/", (req, res) => {
  res.send("Maziv Project Management API is running.");
});
app.use('/uploads/items', express.static(path.join(process.cwd(), 'server', 'uploads', 'items')));
app.use('/uploads/projects', express.static(path.join(process.cwd(), 'server', 'uploads', 'projects')));

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: isProduction,
  crossOriginOpenerPolicy: isProduction,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: isProduction,
  ieNoOpen: true,
  noSniff: true,
  xssFilter: true,
}));

const allowedOrigins = [
  'https://maziv-project-management.vercel.app',
  'http://localhost:5173'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isProduction) console.warn(`Blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(compression({ level: 6 }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (isProduction) {
  const limiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: 'Too many requests…' });
  app.use(limiter);
}

const startServer = async () => {
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? (isProduction ? '***MASKED***' : process.env.DATABASE_URL) : 'DATABASE_URL is not set',
    DB_HOST: process.env.DB_HOST ? '***DB_HOST is set***' : 'DB_HOST is not set',
    DB_NAME: process.env.DB_NAME ? '***DB_NAME is set***' : 'DB_NAME is not set',
    PORT: process.env.PORT || 5000
  });

  console.log('Database configuration check:', {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    databaseHost: process.env.DB_HOST || 'not set',
    databaseName: process.env.DB_NAME || 'not set'
  });

  if (isProduction && !process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required in production. Exiting.");
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    const dbConnected = await connectDB();

    if (!dbConnected) {
      throw new Error("Failed to connect to database. Check DATABASE_URL, credentials, and Render DB status.");
    }

    if (!isProduction) {
      console.log('Syncing database models...');
      await sequelize().sync();
    }

    app.use("/api/auth", authRoutes.default);
    app.use("/api/projects", projectRoutes.default);
    app.use("/api/items", itemRoutes.default);
    app.use("/api/users", userRoutes.default);
    app.use("/api/reports", reportRoutes.default);

    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        database: dbConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      });
    });

    app.use(errorHandler);

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (dbConnected) {
        cron.schedule("0 9 * * *", () => {
          console.log("Running daily deadline check...");
          checkDeadlines().catch((err) => {
            console.error("Error in deadline check:", err);
          });
        });
        console.log("Scheduled jobs initialized");
      }
    });

    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        try {
          if (sequelize()) {
            await sequelize().close();
            console.log("Database connection closed");
          }
        } catch (err) {
          console.error("Error closing database connection:", err);
        }
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const server = startServer();

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});