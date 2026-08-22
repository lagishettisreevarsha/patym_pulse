import express from 'express';
import cors from 'cors';
import merchantRoutes from './routes/merchant.routes';
import pulseRoutes from './routes/pulse.routes';
import demoRoutes from './routes/demo.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/merchant', merchantRoutes);
app.use('/api/business-pulse', pulseRoutes);
app.use('/api/demo', demoRoutes);

// Base route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

export default app;
