import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const app = new Hono().basePath('/api');

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  const isDbError =
    message.toLowerCase().includes('neon') ||
    message.toLowerCase().includes('fetch failed') ||
    message.toLowerCase().includes('timeout') ||
    message.toLowerCase().includes('connect');

  if (isDbError) {
    console.error('Database connection error:', err);
    return c.json(
      {
        success: false,
        error: '数据库连接失败，请稍后重试',
        code: 'DB_CONNECTION_ERROR',
      },
      503
    );
  }

  console.error('API Error:', err);
  return c.json(
    {
      success: false,
      error: message,
    },
    500
  );
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
