import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
// Import middleware
import './middleware/auth';
import User from './models/User';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import jobRoutes from './routes/jobs';
import eventRoutes from './routes/events';
import groupRoutes from './routes/groups';
import mentorshipRoutes from './routes/mentorship';
import connectionRoutes from './routes/connections';
import commentRoutes from './routes/comments';
import uploadRoutes from './routes/uploads';
import reportRoutes from './routes/reports';
import statusRoutes from './routes/status';

// Load environment variables
dotenv.config();

const app = express();
// Ensure PORT is a number
const PORT = parseInt(process.env.PORT ?? '5000', 10);

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
    
    await connectDB();
    await User.createSuperAdmins();
    
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
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:8080', 'http://localhost:8082'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs for development
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
app.use('/api/connections', connectionRoutes); // Phase 2 - Connection system
app.use('/api', commentRoutes); // Comments routes (includes /posts/:postId/comments)
app.use('/api/uploads', uploadRoutes); // Added uploads routes
app.use('/api/reports', reportRoutes); // Reports routes
app.use('/api/status', statusRoutes); // Status routes

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

// Start server with port retry logic
const startServer = (port: number) => {
  try {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
      console.log(`API base URL: http://localhost:${port}/api`);
    }).on('error', (err: Error & { code?: string }) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });

    // Handle uncaught exceptions to prevent server crash
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('SIGTERM', () => {
      console.info('SIGTERM received, shutting down server');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${port + 1}`);
      const newPort = port + 1;
      startServer(newPort);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  }
};

startServer(PORT);

export default app;
