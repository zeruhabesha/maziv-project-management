import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";

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
const PORT = process.env.PORT || 5000;

// Serve static files for item uploads
app.use('/uploads/items', express.static(path.join(process.cwd(), 'server', 'uploads', 'items')));
// Serve static files for project uploads
app.use('/uploads/projects', express.static(path.join(process.cwd(), 'server', 'uploads', 'projects')));

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(compression());
app.use(morgan("dev")); // More readable logs during development
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection and server startup
const startServer = async () => {
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
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the application
startServer();