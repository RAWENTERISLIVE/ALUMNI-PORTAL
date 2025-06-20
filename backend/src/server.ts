import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

const app = express();
// Ensure PORT is a number
const PORT = parseInt(process.env.PORT || '5000', 10);

// Connect to MongoDB and initialize super admins
const initializeApp = async () => {
  await connectDB();
  await User.createSuperAdmins();
};

initializeApp();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/mentorship', mentorshipRoutes);

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
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API base URL: http://localhost:${port}/api`);
    }).on('error', (err: any) => {
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

  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${port + 1}`);
      const newPort = port + 1;
      startServer(newPort);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  }
};

startServer(PORT);

export default app;
