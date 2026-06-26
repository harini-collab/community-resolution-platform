import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import departmentRoutes from './routes/departments.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';
import officerRoutes from './routes/officers.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

export const app = express();

// Bug fix: Parse allowed origins — supports comma-separated list in CLIENT_ORIGIN env var.
// Original code allowed only one origin; Docker/reverse-proxy setups need multiple.
const rawOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigin.split(',').map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
};

// Bug fix: cors() and explicit OPTIONS handler MUST come BEFORE helmet().
// Original had helmet() first — its crossOriginResourcePolicy header blocks
// pre-flight OPTIONS responses before cors() could set the correct headers,
// causing all POST/PATCH requests from the browser to fail with a network error.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);
