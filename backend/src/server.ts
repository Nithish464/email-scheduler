import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { createClient } from 'redis';
const RedisStore = require('connect-redis').default;
import dotenv from 'dotenv';
dotenv.config();

import passport from './config/passport';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import { recoverJobsOnStartup } from './services/schedulerService';

const app = express();
const PORT = process.env.PORT || 5000;

// Redis client for sessions
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});
redisClient.connect().catch(console.error);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session - backed by Redis for persistence
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // Recover any jobs that were lost if Redis was wiped
  await recoverJobsOnStartup();
});

export default app;
