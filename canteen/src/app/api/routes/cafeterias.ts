import { app } from '@/lib/hono';
import { db } from '@/db';
import { cafeterias } from '@/db/schema';
import { withRetry } from '@/lib/retry';
import { serializeForJson } from '@/lib/db-utils';

app.get('/cafeterias', async (c) => {
  const data = await withRetry(() =>
    db.query.cafeterias.findMany({
      orderBy: cafeterias.order,
    })
  );
  return c.json({ success: true, data: serializeForJson(data) });
});
