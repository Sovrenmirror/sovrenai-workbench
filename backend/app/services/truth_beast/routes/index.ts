/**
 * API Routes
 */

import { Router } from 'express';

const router = Router();

// Health check (redundant with main, but useful for API prefix)
router.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Example route
router.get('/api/example', (req, res) => {
  res.json({
    message: 'Hello from hot-code-web-ui!',
    timestamp: new Date().toISOString()
  });
});

// TODO: Import and add feature-specific routes here
// Example:
// import { authRoutes } from './auth.routes.js';
// router.use('/api/auth', authRoutes);

export { router };
