import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'tracker.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create the state table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL DEFAULT '{}'
  )
`);

// Insert default row if empty
const row = db.prepare('SELECT id FROM state WHERE id = 1').get();
if (!row) {
  const defaultState = JSON.stringify({
    weeklyEntries: [],
    bannerEntries: [],
    wishlist: [],
    paidCaratPurchases: [],
    paidCaratsConstant: 0,
  });
  db.prepare('INSERT INTO state (id, data) VALUES (1, ?)').run(defaultState);
}

export function getState(): string {
  const row = db.prepare('SELECT data FROM state WHERE id = 1').get() as { data: string } | undefined;
  return row?.data || '{}';
}

export function setState(data: string): void {
  db.prepare('UPDATE state SET data = ? WHERE id = 1').run(data);
}

export function clearState(): void {
  const defaultState = JSON.stringify({
    weeklyEntries: [],
    bannerEntries: [],
    wishlist: [],
    paidCaratPurchases: [],
    paidCaratsConstant: 0,
  });
  db.prepare('UPDATE state SET data = ? WHERE id = 1').run(defaultState);
}

export default db;