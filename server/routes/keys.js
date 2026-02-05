import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Store encrypted master key (called during onboarding)
router.post('/store-master-key', (req, res) => {
  const { encryptedMasterKey, salt, iv, recoveryKeyHash } = req.body;

  if (!encryptedMasterKey || !salt || !iv || !recoveryKeyHash) {
    return res.status(400).json({ error: 'All encryption parameters are required' });
  }

  const db = getDb();

  // Check if user already has keys
  const user = db.prepare('SELECT encrypted_master_key FROM users WHERE id = ?').get(req.user.id);
  if (user?.encrypted_master_key) {
    return res.status(409).json({ error: 'Master key already exists. Use recovery flow to reset.' });
  }

  db.prepare(`
    UPDATE users
    SET encrypted_master_key = ?, master_key_salt = ?, master_key_iv = ?,
        recovery_key_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    Buffer.from(encryptedMasterKey, 'base64'),
    Buffer.from(salt, 'base64'),
    Buffer.from(iv, 'base64'),
    recoveryKeyHash,
    req.user.id
  );

  res.json({ ok: true });
});

// Get encrypted master key (for client-side decryption)
router.get('/master-key', (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT encrypted_master_key, master_key_salt, master_key_iv FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user?.encrypted_master_key) {
    return res.json({ hasKey: false });
  }

  res.json({
    hasKey: true,
    encryptedMasterKey: Buffer.from(user.encrypted_master_key).toString('base64'),
    salt: Buffer.from(user.master_key_salt).toString('base64'),
    iv: Buffer.from(user.master_key_iv).toString('base64'),
  });
});

// Verify recovery key
router.post('/verify-recovery', (req, res) => {
  const { recoveryKey } = req.body;
  if (!recoveryKey) {
    return res.status(400).json({ error: 'Recovery key is required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT recovery_key_hash FROM users WHERE id = ?').get(req.user.id);

  const hash = crypto.createHash('sha256').update(recoveryKey).digest('hex');
  const valid = hash === user?.recovery_key_hash;

  res.json({ valid });
});

// Reset encryption (after recovery key verification)
router.post('/reset', (req, res) => {
  const { recoveryKey, newEncryptedMasterKey, newSalt, newIv, newRecoveryKeyHash } = req.body;

  const db = getDb();
  const user = db.prepare('SELECT recovery_key_hash FROM users WHERE id = ?').get(req.user.id);

  const hash = crypto.createHash('sha256').update(recoveryKey).digest('hex');
  if (hash !== user?.recovery_key_hash) {
    return res.status(403).json({ error: 'Invalid recovery key' });
  }

  // Update master key and delete all old notes (they can't be decrypted with new key)
  const updateKeys = db.prepare(`
    UPDATE users
    SET encrypted_master_key = ?, master_key_salt = ?, master_key_iv = ?,
        recovery_key_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const deleteNotes = db.prepare('DELETE FROM notes WHERE user_id = ?');

  const tx = db.transaction(() => {
    updateKeys.run(
      Buffer.from(newEncryptedMasterKey, 'base64'),
      Buffer.from(newSalt, 'base64'),
      Buffer.from(newIv, 'base64'),
      newRecoveryKeyHash,
      req.user.id
    );
    deleteNotes.run(req.user.id);
  });

  tx();
  res.json({ ok: true });
});

export default router;
