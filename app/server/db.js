import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import fs from 'fs';
import path from 'path';

let db;

export async function initDB() {
  const dataDir = process.env.DATA_DIR || './data';

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'bevvy.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT,
      hostId TEXT,
      createdAt INTEGER,
      status TEXT DEFAULT 'ACTIVE',
      emailTemplate TEXT
    );

    CREATE TABLE IF NOT EXISTS user_orders (
      id TEXT PRIMARY KEY,
      sessionId TEXT,
      userName TEXT,
      userEmail TEXT,
      totalAmount REAL,
      paidAmount REAL DEFAULT 0,
      isPaid INTEGER DEFAULT 0,
      createdAt INTEGER,
      FOREIGN KEY(sessionId) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS user_credits (
      email TEXT PRIMARY KEY,
      balance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      sessionId TEXT,
      userOrderId TEXT,
      userName TEXT,
      itemName TEXT,
      price REAL,
      createdAt INTEGER,
      FOREIGN KEY(sessionId) REFERENCES sessions(id),
      FOREIGN KEY(userOrderId) REFERENCES user_orders(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
