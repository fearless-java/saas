import { app } from '@/lib/hono';
import { db } from '@/db';
import { cafeterias } from '@/db/schema';

app.get('/cafeterias', async (c) => {
  const data = await db.query.cafeterias.findMany({
    orderBy: cafeterias.order,
  });
  return c.json({ success: true, data });
});
