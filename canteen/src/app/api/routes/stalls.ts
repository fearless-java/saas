import { app } from '@/lib/hono';
import { db } from '@/db';
import { stalls, dishes, reviews } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { withRetry } from '@/lib/retry';
import { serializeForJson } from '@/lib/db-utils';

app.get('/stalls', async (c) => {
  const cafeteriaId = c.req.query('cafeteriaId');

  const where = cafeteriaId ? eq(stalls.cafeteriaId, cafeteriaId) : undefined;

  const data = await withRetry(() =>
    (db as any).query.stalls.findMany({
      where,
      orderBy: desc(stalls.totalReviews),
      with: {
        cafeteria: true,
        merchant: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
  );

  return c.json({ success: true, data: serializeForJson(data) });
});

app.get('/stalls/:id', async (c) => {
  const id = c.req.param('id');

  const stall = await withRetry(() =>
    (db as any).query.stalls.findFirst({
      where: eq(stalls.id, id),
      with: {
        cafeteria: true,
        merchant: true,
        dishes: true,
      },
    })
  );

  if (!stall) {
    return c.json({ success: false, error: 'Stall not found' }, 404);
  }

  await (db as any)
    .update(stalls)
    .set({ totalViews: (stall as any).totalViews + 1 })
    .where(eq(stalls.id, id));

  const recentReviews = await withRetry(() =>
    (db as any).query.reviews.findMany({
      where: eq(reviews.stallId, id),
      orderBy: desc(reviews.createdAt),
      limit: 5,
      with: {
        student: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
  );

  return c.json({
    success: true,
    data: serializeForJson({
      ...stall,
      recentReviews,
    }),
  });
});

app.put('/stalls/:id', async (c) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const body = await c.req.json();

  const stall = await withRetry(() =>
    (db as any).query.stalls.findFirst({
      where: and(eq(stalls.id, id), eq(stalls.merchantId, session.user.id)),
    })
  );

  if (!stall) {
    return c.json({ success: false, error: 'Not found or not authorized' }, 403);
  }

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  const updates = updateSchema.parse(body);

  const [updated] = await (db as any)
    .update(stalls)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(stalls.id, id))
    .returning();

  return c.json({ success: true, data: serializeForJson(updated) });
});

app.get('/stalls/:id/stats', async (c) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');

  const stall = await withRetry(() =>
    (db as any).query.stalls.findFirst({
      where: and(eq(stalls.id, id), eq(stalls.merchantId, session.user.id)),
    })
  );

  if (!stall) {
    return c.json({ success: false, error: 'Not found or not authorized' }, 403);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentReviews = await withRetry(() =>
    (db as any).query.reviews.findMany({
      where: and(
        eq(reviews.stallId, id),
        gte(reviews.createdAt, sevenDaysAgo)
      ),
    })
  );

  const ratingTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayReviews = (recentReviews as any[]).filter((r: any) =>
      new Date(r.createdAt).toISOString().startsWith(dateStr)
    );

    const avgRating =
      dayReviews.length > 0
        ? dayReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / dayReviews.length
        : 0;

    ratingTrend.push({
      date: dateStr,
      avgRating: Number(avgRating.toFixed(1)),
      count: dayReviews.length,
    });
  }

  const dishList = await withRetry(() =>
    (db as any).query.dishes.findMany({
      where: eq(dishes.stallId, id),
    })
  );

  const dishStats = await Promise.all(
    (dishList as any[]).map(async (dish) => {
      const dishReviews = await withRetry(() =>
        (db as any).query.reviews.findMany({
          where: eq(reviews.dishId, dish.id),
        })
      );

      const avgRating =
        (dishReviews as any[]).length > 0
          ? (dishReviews as any[]).reduce((sum: number, r: any) => sum + r.rating, 0) / (dishReviews as any[]).length
          : 0;

      return {
        dishId: dish.id,
        name: dish.name,
        reviewCount: (dishReviews as any[]).length,
        avgRating: Number(avgRating.toFixed(1)),
      };
    })
  );

  return c.json({
    success: true,
    data: serializeForJson({
      totalViews: (stall as any).totalViews,
      totalReviews: (stall as any).totalReviews,
      avgRating: Number((stall as any).avgRating),
      ratingTrend,
      dishStats,
    }),
  });
});
