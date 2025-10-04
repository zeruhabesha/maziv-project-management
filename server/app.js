// server/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import path from 'node:path';

import databaseModule from './config/database.cjs';
const { initializeDatabase } = databaseModule;


// Routers (all ESM)
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import projectsRouter from './routes/projects.js';
import itemsRouter from './routes/items.js';
import reportsRouter from './routes/reports.js';

// Middleware
import { authenticateToken } from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

(async () => {
  try {
    const app = express();

    // 1) Initialize DB with comprehensive error handling
    console.log('Initializing database...');
    try {
      // Log environment variables (without sensitive data)
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        DB_HOST: process.env.DB_HOST ? '***' : 'Not set',
        DB_PORT: process.env.DB_PORT || 'default',
        DB_NAME: process.env.DB_NAME ? '***' : 'Not set',
        DB_USER: process.env.DB_USER ? '***' : 'Not set',
        DATABASE_URL: process.env.DATABASE_URL ? '***' : 'Not set',
        SSL_MODE: process.env.SSL_MODE || 'Not set'
      });

      // Initialize database with extended timeout for production
      const dbInitPromise = initializeDatabase();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout after 30 seconds')), 30000)
      );
      
      console.log('Attempting to connect to the database...');
      await Promise.race([dbInitPromise, timeoutPromise]);
      console.log('✅ Database connection established successfully');
    } catch (dbError) {
      console.error('Failed to initialize database:', {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
        stack: dbError.stack
      });
      // Continue to start the app in degraded mode
    }

    // Enhanced CORS configuration
    // const allowedOrigins = [
    //   'http://localhost:5173',
    //   'http://localhost:3000',
    //   'https://maziv-project-management.vercel.app',
    //   'https://maziv-project-management.vercel.app/'
    // ];
// Replace the allowedOrigins definition with:
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// ...rest of your code remains the same
    // Add request logging middleware
    app.use((req, res, next) => {
      console.log('=== Incoming Request ===');
      console.log('Method:', req.method);
      console.log('URL:', req.originalUrl);
      console.log('Origin:', req.headers.origin);
      console.log('Headers:', req.headers);
      console.log('========================');
      next();
    });

    // Configure CORS with dynamic origin check
    app.use(cors({
        origin: allowedOrigins,
  credentials: true,
      // origin: function (origin, callback) {
      //   // Allow requests with no origin (like mobile apps or curl requests)
      //   if (!origin) return callback(null, true);
        
      //   // Check if the origin is allowed
      //   if (allowedOrigins.includes(origin) || 
      //       allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/+$/, '')))) {
      //     return callback(null, true);
      //   }
        
      //   console.log('Blocked by CORS:', origin);
      //   return callback(new Error('Not allowed by CORS'));
      // },
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Cache-Control',
        'Pragma'
      ],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    // Handle preflight requests
    app.options('*', cors());

    app.use(helmet());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(compression());
    app.use(morgan('dev'));

    // static file serving
    app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

    // Health check endpoint with robust error handling
    app.get('/api/health', async (req, res) => {
      const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        database: {
          status: 'disconnected',
          error: 'Not initialized',
          details: {}
        },
        services: {
          database: false,
          api: true
        },
        // System information
        system: {
          node: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        // Request information
        request: {
          ip: req.ip,
          method: req.method,
          url: req.originalUrl,
          headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent']
          }
        }
      };

      try {
        // Try to check database if possible
        try {
const modelsModule = await import('./models/index.cjs');
const models = modelsModule.default;
          if (models.sequelize) {
            await models.sequelize.authenticate();
            healthCheck.database.status = 'connected';
            healthCheck.services.database = true;
            healthCheck.database.error = null;

            // Try to get user count if possible
            try {
              const userCount = await models.User.count();
              healthCheck.database.details.userCount = userCount;
            } catch (countError) {
              console.error('User count failed:', countError);
              healthCheck.database.details.error = 'Count failed: ' + countError.message;
            }
          }
        } catch (dbError) {
          console.error('Database check failed:', dbError);
          healthCheck.database.error = dbError.message;
          healthCheck.status = 'degraded';
        }
      } catch (error) {
        console.error('Health check error:', error);
        healthCheck.status = 'degraded';
        healthCheck.error = error.message;
      }
      
      // Always return 200 OK, but include status in the response
      // This allows load balancers to still reach the endpoint
      res.status(200).json(healthCheck);
    });

    // Simple health check for load balancers
    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    app.use('/api/auth', authRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/projects', authenticateToken, projectsRouter);
    app.use('/api/items', authenticateToken, itemsRouter);
    app.use('/api/reports', authenticateToken, reportsRouter);

    // 4) Error handler
    app.use(errorHandler);

    // 5) Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Boot error:', err);
    process.exit(1);
  }
})();
