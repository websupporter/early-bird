import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from '../config/database';
import briefingRoutes from './routes/briefingRoutes';
import adminRoutes from './routes/adminRoutes';

export const createApp = async (): Promise<express.Application> => {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Alpine.js benötigt unsafe-eval, inline-Scripts erlaubt
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    }
  }));
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Initialize database connection
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }

  // API Routes
  app.use('/api/briefing', briefingRoutes);
  app.use('/api/admin', adminRoutes);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API info endpoint
  app.get('/api', (_req, res) => {
    res.json({
      name: 'CryptoTraders Morning Briefing API',
      version: '1.0.0',
      endpoints: {
        briefing: {
          'POST /api/briefing/generate': 'Generate new morning briefing',
          'GET /api/briefing/sentiment': 'Get quick sentiment overview',
          'GET /api/briefing/history': 'Get historical briefings',
          'POST /api/briefing/analyze': 'Batch analyze unanalyzed content',
          'GET /api/briefing/status': 'Get system status'
        },
        admin: {
          'GET /api/admin/reddit/sources': 'Get Reddit sources',
          'POST /api/admin/reddit/sources': 'Create Reddit source',
          'PUT /api/admin/reddit/sources/:id': 'Update Reddit source',
          'DELETE /api/admin/reddit/sources/:id': 'Delete Reddit source',
          'GET /api/admin/wordpress/sources': 'Get WordPress sources',
          'POST /api/admin/wordpress/sources': 'Create WordPress source',
          'PUT /api/admin/wordpress/sources/:id': 'Update WordPress source',
          'DELETE /api/admin/wordpress/sources/:id': 'Delete WordPress source',
          'POST /api/admin/crawl/full': 'Run full crawl',
          'POST /api/admin/crawl/reddit': 'Crawl all Reddit sources',
          'POST /api/admin/crawl/wordpress': 'Crawl all WordPress sources',
          'POST /api/admin/crawl/market': 'Update market data',
          'GET /api/admin/stats': 'Get system statistics'
        }
      }
    });
  });

  // Serve static files for frontend (if built)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    
    // Catch-all handler for client-side routing
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'public' });
    });
  }

  // Error handling middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  return app;
};

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  createApp().then(app => {
    app.listen(PORT, () => {
      console.log(`🚀 CryptoTraders API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API documentation: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development mode - CORS enabled for ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      }
    });
  }).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}