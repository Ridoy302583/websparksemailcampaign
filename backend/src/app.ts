// src/app.ts (Backend - Updated CORS configuration)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger/config';
import emailRoutes from './routes/emailRoutes';
import imageProxyRoutes from './routes/imageProxy';
import { config } from './config';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - UPDATED TO FIX THE ERROR
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:5174',  // Vite dev server
    'http://localhost:3000',  // React dev server
    'http://localhost:3001',  // Same origin
    'http://127.0.0.1:5173',  // Alternative localhost
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Rate limiting with connection pooling optimization
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher limit for instant connections
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and test connections
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/api/test-connection';
  }
});
app.use('/api/', limiter);

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add connection optimization middleware
app.use((req, res, next) => {
  // Set keep-alive headers for persistent connections
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=1000');
  
  // Enable HTTP/2 server push hints
  res.setHeader('Link', '</api/health>; rel=prefetch');
  
  console.log(`📝 ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  next();
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Email Server API Documentation'
}));

// Routes
app.use('/api', emailRoutes);
app.use('/api', imageProxyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Email Server API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
    cors: 'enabled',
    allowedOrigins: corsOptions.origin
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined
  });
});

export default app;
