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
const { sequelize, connectDB, getSequelize } = pkg;
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
const PORT = process.env.PORT || 5000;

// Trust first proxy (for Render's load balancer)
app.set('trust proxy', 1);

// Serve static files for item uploads
app.use('/uploads/items', express.static(path.join(process.cwd(), 'server', 'uploads', 'items')));
// Serve static files for project uploads
app.use('/uploads/projects', express.static(path.join(process.cwd(), 'server', 'uploads', 'projects')));

// Security middleware
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

// CORS configuration
const allowedOrigins = [
  'https://maziv-project-management.vercel.app', // Production frontend
  'http://localhost:5173' // Local development
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log unauthorized origins in production
      if (isProduction) {
        console.warn(`Blocked request from origin: ${origin}`);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Compression
app.use(compression({ level: 6 }));

// Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting in production

if (isProduction) {
  const limiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: 'Too many requests…' });
  app.use(limiter);
}

// Database connection and server startup
const startServer = async () => {
  // Log environment info for debugging
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '***DATABASE_URL is set***' : 'DATABASE_URL is not set',
    DB_HOST: process.env.DB_HOST ? '***DB_HOST is set***' : 'DB_HOST is not set',
    DB_NAME: process.env.DB_NAME ? '***DB_NAME is set***' : 'DB_NAME is not set',
    PORT: process.env.PORT || 5000
  });

  // Log database configuration
  try {
    const { config } = require('./config/database.cjs');
    console.log('Database config:', {
      ...config,
      password: config.password ? '***' : 'no password',
      ssl: config.dialectOptions?.ssl ? 'enabled' : 'disabled'
    });
  } catch (error) {
    console.warn('Could not load database config:', error.message);
  }
  try {
    // First connect to database
    const dbConnected = await connectDB();

    if (!dbConnected) {
      throw new Error("Failed to connect to database");
    }

    //Then we will Sync the database
    await sequelize.sync();

    // Then setup routes
    app.use("/api/auth", authRoutes.default);
    app.use("/api/projects", projectRoutes.default);
    app.use("/api/items", itemRoutes.default);
    app.use("/api/users", userRoutes.default);
    app.use("/api/reports", reportRoutes.default);

    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        database: dbConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      });
    });

    // Error handling
    app.use(errorHandler);

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Setup cron jobs if database is connected
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

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        if (sequelize) {
          await sequelize.close();
          console.log("Database connection closed");
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

// Start the server
const server = startServer();

// Handle unhandled promise rejections
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

// Handle uncaught exceptions
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

// Handle SIGTERM signal (for Render)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  } else {
    process.exit(0);
  }
});