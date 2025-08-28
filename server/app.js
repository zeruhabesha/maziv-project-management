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
    app.use(cors());
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
    app.use('/api/users', authenticateToken, usersRouter);
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
