// server/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import path from 'node:path';

import { initializeDatabase } from './config/database.cjs'; // still CJS, works fine in ESM

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
    // 1) Initialize DB
    await initializeDatabase();

      // 2) Setup app
    const app = express();

    // Enhanced CORS configuration
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://maziv-project-management.vercel.app',
      'https://maziv-project-management.vercel.app/'
    ];

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
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if the origin is allowed
        if (allowedOrigins.includes(origin) || 
            allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/+$/, '')))) {
          return callback(null, true);
        }
        
        console.log('Blocked by CORS:', origin);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

    // 3) Routes
    app.get('/health', (_req, res) => res.json({ ok: true }));

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
