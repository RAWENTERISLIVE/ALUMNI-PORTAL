import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler';
// Import middleware
import './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import jobRoutes from './routes/jobs';
import eventRoutes from './routes/events';
import groupRoutes from './routes/groups';
import mentorshipRoutes from './routes/mentorship';
import commentRoutes from './routes/comments';
import uploadRoutes from './routes/uploads';
import reportRoutes from './routes/reports';
import statusRoutes from './routes/status';
import notificationRoutes from './routes/notifications';
import linkedinRoutes from './routes/linkedin';

// Load environment variables
dotenv.config();

const app = express();
// Ensure PORT is a number
const PORT = parseInt(process.env.PORT || '5000', 10);
const PORT_RETRY_DELAY_MS = 400;
const MAX_PORT_RETRIES = 15;
let activeServer: import('http').Server | null = null;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Phase 1 - Enhanced app initialization
const initializeApp = async () => {
  try {
    console.log('🚀 Starting Alma Connect Sphere Backend...');
    console.log('📋 Phase 1: Core Authentication & Security + Profiles');
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      const allowedOrigin = process.env.FRONTEND_URL;
      callback(null, !!allowedOrigin && origin === allowedOrigin);
      return;
    }

    const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    callback(null, isLocalhostOrigin);
  },
  credentials: true
}));

// Rate limiting
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX = Number(
  process.env.RATE_LIMIT_MAX ||
    (process.env.NODE_ENV === 'production' ? 300 : 2000)
);

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.path === '/api/health' || req.path.startsWith('/api/status')
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/status', statusRoutes); // Phase 1 - System status endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api', commentRoutes); // Comments routes (includes /posts/:postId/comments)
app.use('/api/uploads', uploadRoutes); // Added uploads routes
app.use('/api/reports', reportRoutes); // Reports routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/linkedin', linkedinRoutes);

// Error handling middleware
app.use(errorHandler);

// Root endpoint
app.get('/api', (_req, res) => {
  res.send('Alumni Connect API is running');
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Start server on the configured port only.
// In development, frontend proxy points to a fixed backend port, so silently
// switching ports causes API mismatches (e.g. direct messaging endpoints failing).
const startServer = (port: number, attempt = 0) => {
  const server = app.listen(port);

  server.on('listening', () => {
    activeServer = server;
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API base URL: http://localhost:${port}/api`);
  });

  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE' && port === PORT && attempt < MAX_PORT_RETRIES) {
      const nextAttempt = attempt + 1;
      console.warn(`Port ${port} is busy (retry ${nextAttempt}/${MAX_PORT_RETRIES})...`);
      setTimeout(() => {
        startServer(port, nextAttempt);
      }, PORT_RETRY_DELAY_MS);
      return;
    }

    if (err?.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
      console.error('Stop the existing backend process on this port and restart the app.');
      process.exit(1);
      return;
    }

    console.error('Server error:', err);
    process.exit(1);
  });
};

const shutdown = (signal: string) => {
  console.info(`${signal} received, shutting down server`);

  if (!activeServer) {
    process.exit(0);
    return;
  }

  activeServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer(PORT);

export default app;
