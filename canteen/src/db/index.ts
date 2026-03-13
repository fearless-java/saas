import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzleBetterSqlite3, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
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

  // 添加 UUID 函数支持
  sqlite.function('gen_random_uuid', () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });

  // 添加 now() 函数支持
  sqlite.function('now', () => {
    return new Date().toISOString();
  });

  return drizzleBetterSqlite3(sqlite, { schema: sqliteSchema });
}

type DatabaseType = NeonHttpDatabase<typeof pgSchema> | BetterSQLite3Database<typeof sqliteSchema>;

export const db: DatabaseType = isLocalDB 
  ? createSQLiteConnection() 
  : createNeonConnection();

// 原生 SQL 执行函数 (用于 SQLite 插入/更新/删除操作)
export async function executeSQL(sql: string, params: any[] = []) {
  const sqlite = new Database(process.env.LOCAL_DB_PATH || resolve(process.cwd(), 'data/local.db'));
  const stmt = sqlite.prepare(sql);
  const result = stmt.run(...params);
  sqlite.close();
  return result;
}

// 原生 SQL 查询函数 (用于 SQLite SELECT 查询)
export async function querySQL(sql: string, params: any[] = []) {
  const sqlite = new Database(process.env.LOCAL_DB_PATH || resolve(process.cwd(), 'data/local.db'));
  const stmt = sqlite.prepare(sql);
  const results = stmt.all(...params);
  sqlite.close();
  return results;
}

export { pgSchema, sqliteSchema };
