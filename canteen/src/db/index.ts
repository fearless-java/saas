import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const THIRTY_SECONDS_MS = 30000;

const customFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(THIRTY_SECONDS_MS),
  });
};

const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: {
    fetch: customFetch,
  },
});

export const db = drizzle(sql, { schema });
