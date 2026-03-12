import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { initDb } from './db/index.js';
import { configurePassport } from './routes/auth.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import keysRoutes from './routes/keys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
    : true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Sessions
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET environment variable is required in production');
    process.exit(1);
  }
  console.warn('WARNING: SESSION_SECRET not set, generating random secret for this dev session');
}

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
}));

// Passport
configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use('/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/keys', keysRoutes);

// Serve static in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Initialize DB and start
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;
