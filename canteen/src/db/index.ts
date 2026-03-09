import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleBetterSqlite3 } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as pgSchema from './schema';
import * as sqliteSchema from './schema.sqlite';
import { resolve } from 'path';

const THIRTY_SECONDS_MS = 30000;
export const dbProvider = process.env.DB_PROVIDER || 'neon';
export const isLocalDB = dbProvider === 'local';

function createNeonConnection() {
  const originalFetch = globalThis.fetch;
  
  const fetchWithTimeout = (url: string | URL | Request, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), THIRTY_SECONDS_MS);
    
    return originalFetch(url, {
      ...options,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  };
  
  globalThis.fetch = fetchWithTimeout as typeof fetch;
  const sql = neon(process.env.DATABASE_URL!);
  globalThis.fetch = originalFetch;
  
  return drizzleNeon(sql, { schema: pgSchema });
}

function createSQLiteConnection() {
  const dbPath = process.env.LOCAL_DB_PATH || resolve(process.cwd(), 'data/local.db');
  const sqlite = new Database(dbPath);
  sqlite.exec('PRAGMA foreign_keys = ON;');
  return drizzleBetterSqlite3(sqlite, { schema: sqliteSchema });
}

export const db = isLocalDB 
  ? createSQLiteConnection() 
  : createNeonConnection();

export { pgSchema, sqliteSchema };
