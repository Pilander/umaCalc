import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';
import express from 'express';
import supertest from 'supertest';

const DEFAULT_STATE = {
  weeklyEntries: [],
  bannerEntries: [],
  wishlist: [],
  paidCaratPurchases: [],
  paidCaratsConstant: 0,
};

function createTestApp(dbPath: string) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL DEFAULT '{}'
    )
  `);
  const defaultStr = JSON.stringify(DEFAULT_STATE);
  db.prepare('INSERT INTO state (id, data) VALUES (1, ?)').run(defaultStr);

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/state', (_req, res) => {
    const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string } | undefined;
    res.type('json').send(row?.data || '{}');
  });

  app.put('/api/state', (req, res) => {
    const data = JSON.stringify(req.body);
    db.prepare('UPDATE state SET data = ? WHERE id = 1').run(data);
    res.json({ ok: true });
  });

  app.delete('/api/state', (_req, res) => {
    db.prepare('UPDATE state SET data = ? WHERE id = 1').run(defaultStr);
    res.json({ ok: true });
  });

  return { app, db };
}

describe('Database layer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker-db-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('creates database with default state', () => {
    const dbPath = path.join(tmpDir, 'test.db');
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL DEFAULT '{}')`);
    db.prepare('INSERT INTO state (id, data) VALUES (1, ?)').run(JSON.stringify(DEFAULT_STATE));

    const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string };
    const parsed = JSON.parse(row.data);
    expect(parsed.weeklyEntries).toEqual([]);
    expect(parsed.bannerEntries).toEqual([]);
    expect(parsed.paidCaratPurchases).toEqual([]);
    db.close();
  });

  it('updates and retrieves state', () => {
    const dbPath = path.join(tmpDir, 'test.db');
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL DEFAULT '{}')`);
    db.prepare('INSERT INTO state (id, data) VALUES (1, ?)').run('{}');

    const newState = { ...DEFAULT_STATE, weeklyEntries: [{ id: 'w1', date: '2025-01-01' }] };
    db.prepare('UPDATE state SET data = ? WHERE id = 1').run(JSON.stringify(newState));

    const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string };
    const parsed = JSON.parse(row.data);
    expect(parsed.weeklyEntries).toHaveLength(1);
    expect(parsed.weeklyEntries[0].id).toBe('w1');
    db.close();
  });

  it('enforces single-row constraint (id must be 1)', () => {
    const dbPath = path.join(tmpDir, 'test.db');
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL DEFAULT '{}')`);
    db.prepare('INSERT INTO state (id, data) VALUES (1, ?)').run('{}');

    expect(() => {
      db.prepare('INSERT INTO state (id, data) VALUES (2, ?)').run('{}');
    }).toThrow();
    db.close();
  });

  it('handles large JSON payloads', () => {
    const dbPath = path.join(tmpDir, 'test.db');
    const db = new Database(dbPath);
    db.exec(`CREATE TABLE state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL DEFAULT '{}')`);
    db.prepare('INSERT INTO state (id, data) VALUES (1, ?)').run('{}');

    const largeState = {
      ...DEFAULT_STATE,
      weeklyEntries: Array.from({ length: 200 }, (_, i) => ({
        id: `w${i}`,
        date: `2025-01-${String(i % 28 + 1).padStart(2, '0')}`,
        totalCarats: i * 1000,
      })),
    };
    db.prepare('UPDATE state SET data = ? WHERE id = 1').run(JSON.stringify(largeState));

    const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string };
    const parsed = JSON.parse(row.data);
    expect(parsed.weeklyEntries).toHaveLength(200);
    db.close();
  });
});

describe('Express API endpoints', () => {
  let tmpDir: string;
  let testApp: { app: express.Express; db: Database.Database };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker-api-test-'));
    testApp = createTestApp(path.join(tmpDir, 'test.db'));
  });

  afterEach(() => {
    testApp.db.close();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('GET /api/state', () => {
    it('returns default empty state', async () => {
      const res = await supertest(testApp.app).get('/api/state');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      const body = res.body;
      expect(body.weeklyEntries).toEqual([]);
      expect(body.bannerEntries).toEqual([]);
      expect(body.paidCaratPurchases).toEqual([]);
      expect(body.paidCaratsConstant).toBe(0);
    });
  });

  describe('PUT /api/state', () => {
    it('saves state and persists it', async () => {
      const newState = {
        weeklyEntries: [{ id: 'w1', date: '2025-01-01', totalCarats: 15000 }],
        bannerEntries: [{ id: 'b1', name: 'Test Banner', weekDate: '2025-03-01' }],
        wishlist: [],
        paidCaratPurchases: [],
        paidCaratsConstant: 0,
      };

      const putRes = await supertest(testApp.app)
        .put('/api/state')
        .send(newState)
        .set('Content-Type', 'application/json');
      expect(putRes.status).toBe(200);
      expect(putRes.body.ok).toBe(true);

      // Verify it persisted
      const getRes = await supertest(testApp.app).get('/api/state');
      expect(getRes.body.weeklyEntries).toHaveLength(1);
      expect(getRes.body.weeklyEntries[0].id).toBe('w1');
      expect(getRes.body.bannerEntries).toHaveLength(1);
      expect(getRes.body.bannerEntries[0].name).toBe('Test Banner');
    });

    it('overwrites previous state completely', async () => {
      // First save
      await supertest(testApp.app)
        .put('/api/state')
        .send({ ...DEFAULT_STATE, weeklyEntries: [{ id: 'w1' }, { id: 'w2' }] });

      // Second save — should completely replace
      await supertest(testApp.app)
        .put('/api/state')
        .send({ ...DEFAULT_STATE, weeklyEntries: [{ id: 'w3' }] });

      const res = await supertest(testApp.app).get('/api/state');
      expect(res.body.weeklyEntries).toHaveLength(1);
      expect(res.body.weeklyEntries[0].id).toBe('w3');
    });
  });

  describe('DELETE /api/state', () => {
    it('resets state to defaults', async () => {
      // First, save some data
      await supertest(testApp.app)
        .put('/api/state')
        .send({
          ...DEFAULT_STATE,
          weeklyEntries: [{ id: 'w1', date: '2025-01-01' }],
          bannerEntries: [{ id: 'b1', name: 'Banner' }],
        });

      // Delete
      const delRes = await supertest(testApp.app).delete('/api/state');
      expect(delRes.status).toBe(200);
      expect(delRes.body.ok).toBe(true);

      // Verify reset
      const getRes = await supertest(testApp.app).get('/api/state');
      expect(getRes.body.weeklyEntries).toEqual([]);
      expect(getRes.body.bannerEntries).toEqual([]);
    });
  });

  describe('Full round-trip', () => {
    it('GET → PUT → GET → DELETE → GET cycle works', async () => {
      // 1. Initial GET
      const r1 = await supertest(testApp.app).get('/api/state');
      expect(r1.body.weeklyEntries).toEqual([]);

      // 2. PUT new data
      const state = {
        ...DEFAULT_STATE,
        weeklyEntries: [{ id: 'w1', date: '2025-06-01', totalCarats: 50000 }],
        bannerEntries: [{ id: 'b1', name: 'Anniversary', weekDate: '2025-07-01', isWishlist: true }],
      };
      await supertest(testApp.app).put('/api/state').send(state);

      // 3. GET to verify
      const r2 = await supertest(testApp.app).get('/api/state');
      expect(r2.body.weeklyEntries[0].totalCarats).toBe(50000);
      expect(r2.body.bannerEntries[0].name).toBe('Anniversary');

      // 4. DELETE
      await supertest(testApp.app).delete('/api/state');

      // 5. GET to verify reset
      const r3 = await supertest(testApp.app).get('/api/state');
      expect(r3.body.weeklyEntries).toEqual([]);
      expect(r3.body.bannerEntries).toEqual([]);
    });
  });
});