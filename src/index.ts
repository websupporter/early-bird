import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import logger from './config/logger';
import { createApp } from './api/app';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'CryptoTraders Morning Briefing API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

async function bootstrap() {
  try {
    console.log('🚀 Starting CryptoTraders Morning Briefing System...');
    
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Create and start the Express application
    const app = await createApp();
    const PORT = process.env.PORT || 3001;
    
    const server = app.listen(PORT, () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API documentation: http://localhost:${PORT}/api`);
      console.log(`🖥️  Frontend: http://localhost:${PORT}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode active');
        console.log('🔑 Make sure to set your API keys in .env file:');
        console.log('   - OPENAI_API_KEY');
        console.log('   - REDDIT_CLIENT_ID & REDDIT_CLIENT_SECRET');
        console.log('   - Database credentials');
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close database connections and other resources here
        console.log('✅ All connections closed. Goodbye!');
        process.exit(0);
      });
      
      // Force close after timeout
      setTimeout(() => {
        console.error('⚠️  Forceful shutdown timeout reached');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();