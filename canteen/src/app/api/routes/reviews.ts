import { app } from '@/lib/hono';
import { db } from '@/db';
import { reviews, stalls, dishes, reviewLikes } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

app.get('/reviews', async (c) => {
  const stallId = c.req.query('stallId');
  
  if (!stallId) {
    return c.json({ success: false, error: 'stallId is required' }, 400);
  }
  
  const data = await db.query.reviews.findMany({
    where: eq(reviews.stallId, stallId),
    orderBy: desc(reviews.createdAt),
    with: {
      student: {
        columns: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
  
  return c.json({ success: true, data });
});

app.post('/reviews', async (c) => {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'student') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  
  const reviewSchema = z.object({
    stallId: z.string().uuid(),
    dishId: z.string().uuid().optional(),
    rating: z.number().min(1).max(5),
    content: z.string().min(1, '评价内容不能为空'),
    images: z.array(z.string()).default([]),
  });
  
  const result = reviewSchema.safeParse(body);
  
  if (!result.success) {
    return c.json({ 
      success: false, 
      error: result.error.issues[0]?.message || '输入数据无效' 
    }, 400);
  }
  
  const data = result.data;
  
  const [review] = await db.insert(reviews).values({
    studentId: session.user.id,
    stallId: data.stallId,
    dishId: data.dishId,
    rating: data.rating,
    content: data.content,
    images: data.images,
  }).returning();
  
  const stallReviews = await db.query.reviews.findMany({
    where: eq(reviews.stallId, data.stallId),
  });
  
  const avgRating = stallReviews.reduce((sum, r) => sum + r.rating, 0) / stallReviews.length;
  
  await db.update(stalls)
    .set({
      avgRating: avgRating.toFixed(1),
      totalReviews: stallReviews.length,
    })
    .where(eq(stalls.id, data.stallId));
  
  if (data.dishId) {
    const dishReviews = await db.query.reviews.findMany({
      where: eq(reviews.dishId, data.dishId),
    });
    
    const dishAvgRating = dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length;
    
    await db.update(dishes)
      .set({
        avgRating: dishAvgRating.toFixed(1),
        totalReviews: dishReviews.length,
      })
      .where(eq(dishes.id, data.dishId));
  }
  
  return c.json({ success: true, data: review }, 201);
});

app.post('/reviews/:id/like', async (c) => {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'student') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const reviewId = c.req.param('id');
  const studentId = session.user.id;
  
  const existingLike = await db.query.reviewLikes.findFirst({
    where: and(
      eq(reviewLikes.reviewId, reviewId),
      eq(reviewLikes.studentId, studentId)
    ),
  });
  
  if (existingLike) {
    await db.delete(reviewLikes)
      .where(and(
        eq(reviewLikes.reviewId, reviewId),
        eq(reviewLikes.studentId, studentId)
      ));
    
    await db.update(reviews)
      .set({ likes: sql`${reviews.likes} - 1` })
      .where(eq(reviews.id, reviewId));
    
    return c.json({ success: true, liked: false });
  } else {
    await db.insert(reviewLikes).values({
      reviewId,
      studentId,
    });
    
    await db.update(reviews)
      .set({ likes: sql`${reviews.likes} + 1` })
      .where(eq(reviews.id, reviewId));
    
    return c.json({ success: true, liked: true });
  }
});

app.get('/reviews/my', async (c) => {
  const session = await auth();
  
  if (!session?.user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const data = await db.query.reviews.findMany({
    where: eq(reviews.studentId, session.user.id),
    orderBy: desc(reviews.createdAt),
    with: {
      stall: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      dish: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  return c.json({ success: true, data });
});

app.post('/reviews/:id/reply', async (c) => {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const reviewId = c.req.param('id');
  const body = await c.req.json();
  
  const replySchema = z.object({
    reply: z.string().min(1, '回复内容不能为空'),
  });
  
  const result = replySchema.safeParse(body);
  
  if (!result.success) {
    return c.json({ 
      success: false, 
      error: result.error.issues[0]?.message || '输入数据无效' 
    }, 400);
  }
  
  const { reply } = result.data;
  
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    with: {
      stall: true,
    },
  });
  
  if (!review || review.stall.merchantId !== session.user.id) {
    return c.json({ success: false, error: 'Not authorized' }, 403);
  }
  
  const [updated] = await db.update(reviews)
    .set({
      merchantReply: reply,
      repliedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId))
    .returning();
  
  return c.json({ success: true, data: updated });
});
