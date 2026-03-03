import { app } from '@/lib/hono';
import { db } from '@/db';
import { stalls, reviews } from '@/db/schema';
import { eq, desc, gte, and, sql } from 'drizzle-orm';

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

async function getRatingChanges(): Promise<Map<string, number>> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const yesterdayEnd = new Date(todayStart);
  
  const allStalls = await db.query.stalls.findMany();
  
  const todayReviewsData = await db.query.reviews.findMany({
    where: gte(reviews.createdAt, todayStart),
  });
  
  const yesterdayReviewsData = await db.query.reviews.findMany({
    where: and(
      gte(reviews.createdAt, yesterdayStart),
      sql`${reviews.createdAt} < ${yesterdayEnd}`
    ),
  });
  
  const ratingChanges = new Map<string, number>();
  
  for (const stall of allStalls) {
    const stallTodayReviews = todayReviewsData.filter(r => r.stallId === stall.id);
    const stallYesterdayReviews = yesterdayReviewsData.filter(r => r.stallId === stall.id);
    
    const todayAvg = stallTodayReviews.length > 0
      ? stallTodayReviews.reduce((sum, r) => sum + r.rating, 0) / stallTodayReviews.length
      : 0;
    
    const yesterdayAvg = stallYesterdayReviews.length > 0
      ? stallYesterdayReviews.reduce((sum, r) => sum + r.rating, 0) / stallYesterdayReviews.length
      : 0;
    
    let change = 0;
    if (todayAvg > 0 && yesterdayAvg > 0) {
      change = Number((todayAvg - yesterdayAvg).toFixed(1));
    } else if (todayAvg > 0) {
      change = Number(todayAvg.toFixed(1));
    } else if (yesterdayAvg > 0) {
      change = 0;
    }
    
    ratingChanges.set(stall.id, change);
  }
  
  return ratingChanges;
}

app.get('/stalls/ranked', async (c) => {
  const cafeteriaId = c.req.query('cafeteriaId');
  
  const where = cafeteriaId ? eq(stalls.cafeteriaId, cafeteriaId) : undefined;
  
  const allStalls = await db.query.stalls.findMany({
    where,
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
  });
  
  const ratingChanges = await getRatingChanges();
  
  const rankedStalls = allStalls
    .map(stall => {
      const score = calculateStallScore(
        parseFloat(stall.avgRating),
        stall.totalReviews,
        stall.totalViews
      );
      const ratingChange = ratingChanges.get(stall.id) || 0;
      
      return {
        ...stall,
        score,
        ratingChange,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((stall, index) => ({
      ...stall,
      rank: index + 1,
    }));
  
  return c.json({
    success: true,
    data: rankedStalls,
  });
});

export { calculateStallScore };