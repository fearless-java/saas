import { app } from '@/lib/hono';
import { db } from '@/db';
import { reviews, favorites, messages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { withRetry } from '@/lib/retry';

app.get('/stats/my', async (c) => {
  const session = await auth();

  if (!session?.user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const userId = session.user.id;

  const [reviewCount] = (await withRetry(() =>
    (db as any)
      .select({ count: sql`COUNT(*)`.as('count') })
      .from(reviews)
      .where(eq(reviews.studentId, userId))
  )) as any[];

  const [favoriteCount] = (await withRetry(() =>
    (db as any)
      .select({ count: sql`COUNT(*)`.as('count') })
      .from(favorites)
      .where(eq(favorites.studentId, userId))
  )) as any[];

  const [unreadMessages] = (await withRetry(() =>
    (db as any)
      .select({ count: sql`COUNT(*)`.as('count') })
      .from(messages)
      .where(and(eq(messages.userId, userId), eq(messages.isRead, false)))
  )) as any[];

  return c.json({
    success: true,
    data: {
      reviews: Number(reviewCount?.count || 0),
      favorites: Number(favoriteCount?.count || 0),
      unreadMessages: Number(unreadMessages?.count || 0),
    },
  });
});
