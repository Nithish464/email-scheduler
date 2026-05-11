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

// Trust proxy for Railway HTTPS
app.set('trust proxy', 1);

// Redis client for sessions
let redisClient: any;

if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
} else {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

redisClient.on('connect', () => console.log('✅ Session Redis connected'));
redisClient.on('error', (err: any) => console.error('❌ Session Redis error:', err));
redisClient.connect().catch(console.error);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/emails', emailRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await recoverJobsOnStartup();
});

export default app;