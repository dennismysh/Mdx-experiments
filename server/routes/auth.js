import { Router } from 'express';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import passport from 'passport';
import { getDb } from '../db/index.js';

const router = Router();

export function configurePassport(passportInstance) {
  passportInstance.serializeUser((user, done) => done(null, user.id));

  passportInstance.deserializeUser((id, done) => {
    try {
      const db = getDb();
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (clientID && clientSecret) {
    passportInstance.use(new GoogleStrategy({
      clientID,
      clientSecret,
      callbackURL: '/auth/google/callback',
    }, (accessToken, refreshToken, profile, done) => {
      try {
        const db = getDb();
        let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);

        if (!user) {
          const id = uuidv4();
          db.prepare(`
            INSERT INTO users (id, google_id, email, display_name, avatar_url)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            id,
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName,
            profile.photos?.[0]?.value || ''
          );
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }));
  }
}

// Google OAuth initiation
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/?error=auth_failed',
    successRedirect: '/',
  })
);

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.json({ user: null });
  }
  const { encrypted_master_key, master_key_salt, master_key_iv, recovery_key_hash, ...safeUser } = req.user;
  res.json({
    user: safeUser,
    hasEncryptionKeys: !!encrypted_master_key,
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout?.(() => {});
  req.session?.destroy?.(() => {});
  res.json({ ok: true });
});

// Dev-only: mock login for local development without Google credentials
router.post('/dev-login', (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.DISABLE_DEV_LOGIN === 'true') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  console.warn('WARNING: Dev login used — this endpoint must not be available in production');
  const db = getDb();
  const devGoogleId = 'dev-user-001';
  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(devGoogleId);

  if (!user) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, google_id, email, display_name, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, devGoogleId, 'dev@localhost', 'Dev User', '');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  req.login(user, (err) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    const { encrypted_master_key, master_key_salt, master_key_iv, recovery_key_hash, ...safeUser } = user;
    res.json({
      user: safeUser,
      hasEncryptionKeys: !!encrypted_master_key,
    });
  });
});

export default router;
