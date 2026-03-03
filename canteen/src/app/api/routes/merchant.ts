import { app } from '@/lib/hono';
import { db } from '@/db';
import { stalls, reviews, dishes } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';

app.get('/merchant/stall', async (c) => {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const stall = await db.query.stalls.findFirst({
    where: eq(stalls.merchantId, session.user.id),
    with: { cafeteria: true },
  });

  if (!stall) {
    return c.json({ success: false, error: 'No stall found' }, 404);
  }

  return c.json({ success: true, data: stall });
});

app.get('/merchant/dishes', async (c) => {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const stall = await db.query.stalls.findFirst({
    where: eq(stalls.merchantId, session.user.id),
  });

  if (!stall) {
    return c.json({ success: false, error: 'No stall found' }, 404);
  }

  const dishList = await db.query.dishes.findMany({
    where: eq(dishes.stallId, stall.id),
    orderBy: dishes.createdAt,
  });

  return c.json({ success: true, data: dishList });
});

app.get('/merchant/stats', async (c) => {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const stall = await db.query.stalls.findFirst({
    where: eq(stalls.merchantId, session.user.id),
  });

  if (!stall) {
    return c.json({ success: false, error: 'No stall found' }, 404);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.stallId, stall.id),
      gte(reviews.createdAt, sevenDaysAgo)
    ),
  });

  const ratingTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayReviews = recentReviews.filter(r => 
      r.createdAt.toISOString().startsWith(dateStr)
    );
    
    const avgRating = dayReviews.length > 0
      ? dayReviews.reduce((sum, r) => sum + r.rating, 0) / dayReviews.length
      : 0;
    
    ratingTrend.push({
      date: dateStr,
      avgRating: Number(avgRating.toFixed(1)),
      count: dayReviews.length,
    });
  }

  const dishList = await db.query.dishes.findMany({
    where: eq(dishes.stallId, stall.id),
  });
  
  const dishStats = dishList.map(dish => ({
    dishId: dish.id,
    name: dish.name,
    reviewCount: dish.totalReviews,
    avgRating: Number(dish.avgRating),
  })).sort((a, b) => b.reviewCount - a.reviewCount);

  return c.json({
    success: true,
    data: {
      totalViews: stall.totalViews,
      totalReviews: stall.totalReviews,
      avgRating: Number(stall.avgRating),
      ratingTrend,
      dishStats,
    },
  });
});

app.get('/merchant/reviews', async (c) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const stall = await db.query.stalls.findFirst({
    where: eq(stalls.merchantId, session.user.id),
  });

  if (!stall) {
    return c.json({ success: false, error: 'No stall found' }, 404);
  }

  const reviewList = await db.query.reviews.findMany({
    where: eq(reviews.stallId, stall.id),
    orderBy: reviews.createdAt,
    with: { student: { columns: { id: true, name: true, avatar: true } } },
  });

  return c.json({ success: true, data: reviewList });
});
