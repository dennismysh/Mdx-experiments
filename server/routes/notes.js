import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// List all notes for the current user
router.get('/', (req, res) => {
  const db = getDb();
  const notes = db.prepare(`
    SELECT id, title_encrypted, title_iv, folder, sort_order, created_at, updated_at
    FROM notes WHERE user_id = ? ORDER BY updated_at DESC
  `).all(req.user.id);

  // Convert Buffers to base64 for transport
  const serialized = notes.map(n => ({
    id: n.id,
    titleEncrypted: Buffer.from(n.title_encrypted).toString('base64'),
    titleIv: Buffer.from(n.title_iv).toString('base64'),
    folder: n.folder,
    sortOrder: n.sort_order,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));

  res.json({ notes: serialized });
});

// Get a single note
router.get('/:id', (req, res) => {
  const db = getDb();
  const note = db.prepare(`
    SELECT * FROM notes WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);

  if (!note) return res.status(404).json({ error: 'Note not found' });

  res.json({
    id: note.id,
    titleEncrypted: Buffer.from(note.title_encrypted).toString('base64'),
    titleIv: Buffer.from(note.title_iv).toString('base64'),
    contentEncrypted: Buffer.from(note.content_encrypted).toString('base64'),
    contentIv: Buffer.from(note.content_iv).toString('base64'),
    folder: note.folder,
    sortOrder: note.sort_order,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  });
});

// Create a new note
router.post('/', (req, res) => {
  const { titleEncrypted, titleIv, contentEncrypted, contentIv, folder } = req.body;

  if (!titleEncrypted || !titleIv || !contentEncrypted || !contentIv) {
    return res.status(400).json({ error: 'Encrypted title and content are required' });
  }

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO notes (id, user_id, title_encrypted, title_iv, content_encrypted, content_iv, folder)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.user.id,
    Buffer.from(titleEncrypted, 'base64'),
    Buffer.from(titleIv, 'base64'),
    Buffer.from(contentEncrypted, 'base64'),
    Buffer.from(contentIv, 'base64'),
    folder || '/'
  );

  res.status(201).json({ id, createdAt: new Date().toISOString() });
});

// Update a note
router.put('/:id', (req, res) => {
  const { titleEncrypted, titleIv, contentEncrypted, contentIv, folder } = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  db.prepare(`
    UPDATE notes
    SET title_encrypted = ?, title_iv = ?, content_encrypted = ?, content_iv = ?,
        folder = COALESCE(?, folder), updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    Buffer.from(titleEncrypted, 'base64'),
    Buffer.from(titleIv, 'base64'),
    Buffer.from(contentEncrypted, 'base64'),
    Buffer.from(contentIv, 'base64'),
    folder,
    req.params.id,
    req.user.id
  );

  res.json({ ok: true });
});

// Delete a note
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.json({ ok: true });
});

export default router;
