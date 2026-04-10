import express from 'express';
import cors from 'cors';
import path from 'path';
import { getState, setState, clearState } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.get('/api/state', (_req, res) => {
  try {
    const data = getState();
    res.type('json').send(data);
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

app.put('/api/state', (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    setState(data);
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

app.delete('/api/state', (_req, res) => {
  try {
    clearState();
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/state error:', err);
    res.status(500).json({ error: 'Failed to clear state' });
  }
});

// Serve static frontend files
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});