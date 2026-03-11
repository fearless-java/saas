import { app } from '@/lib/hono';
import { db } from '@/db';
import { stalls } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withRetry } from '@/lib/retry';
import { serializeForJson } from '@/lib/db-utils';

function calculateStallScore(
  avgRating: number,
  totalReviews: number,
  totalViews: number
): number {
  const ratingScore = avgRating * 20;

  const reviewWeight = Math.min(
    1.0,
    0.7 + (Math.log(totalReviews + 1) / Math.log(100)) * 0.3
  );

  const viewWeight = Math.min(
    1.0,
    0.85 + (Math.log(totalViews + 1) / Math.log(500)) * 0.15
  );

  return ratingScore * reviewWeight * viewWeight;
}

app.get('/stalls/ranked', async (c) => {
  const cafeteriaId = c.req.query('cafeteriaId');

  const where = cafeteriaId ? eq(stalls.cafeteriaId, cafeteriaId) : undefined;

  const allStalls = await withRetry(() =>
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

  const rankedStalls = (allStalls as any[])
    .map((stall, index) => {
      const score = calculateStallScore(
        parseFloat(stall.avgRating),
        stall.totalReviews,
        stall.totalViews
      );

      return {
        ...stall,
        score,
        rank: index + 1,
        ratingChange: 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  return c.json({
    success: true,
    data: serializeForJson(rankedStalls),
  });
});

export { calculateStallScore };
