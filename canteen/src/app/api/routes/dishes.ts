import { app } from '@/lib/hono';
import { db } from '@/db';
import { dishes, stalls, reviews } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { withRetry } from '@/lib/retry';

app.get('/dishes', async (c) => {
  const stallId = c.req.query('stallId');

  if (!stallId) {
    return c.json({ success: false, error: 'stallId is required' }, 400);
  }

  const data = await withRetry(() =>
    db.query.dishes.findMany({
      where: eq(dishes.stallId, stallId),
      orderBy: desc(dishes.totalReviews),
    })
  );

  return c.json({ success: true, data });
});

app.get('/dishes/:id', async (c) => {
  const id = c.req.param('id');

  const dish = await withRetry(() =>
    db.query.dishes.findFirst({
      where: eq(dishes.id, id),
      with: {
        stall: true,
      },
    })
  );

  if (!dish) {
    return c.json({ success: false, error: 'Dish not found' }, 404);
  }

  const dishReviews = await withRetry(() =>
    db.query.reviews.findMany({
      where: eq(reviews.dishId, id),
      orderBy: desc(reviews.createdAt),
      limit: 10,
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
    data: {
      ...dish,
      reviews: dishReviews,
    },
  });
});

app.post('/dishes', async (c) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();

  const dishSchema = z.object({
    name: z.string().min(1, '菜品名称不能为空'),
    description: z.string().optional(),
    stallId: z.string().uuid(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, '价格格式不正确'),
    image: z.string().optional(),
  });

  const result = dishSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: result.error.issues[0]?.message || '输入数据无效',
      },
      400
    );
  }

  const { name, description, stallId, price, image } = result.data;

  const stall = await withRetry(() =>
    db.query.stalls.findFirst({
      where: and(
        eq(stalls.id, stallId),
        eq(stalls.merchantId, session.user.id)
      ),
    })
  );

  if (!stall) {
    return c.json({ success: false, error: 'Not authorized' }, 403);
  }

  const [dish] = await db
    .insert(dishes)
    .values({
      name,
      description,
      stallId,
      price,
      image,
    })
    .returning();

  return c.json({ success: true, data: dish }, 201);
});

app.put('/dishes/:id', async (c) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const body = await c.req.json();

  const existingDish = await withRetry(() =>
    db.query.dishes.findFirst({
      where: eq(dishes.id, id),
      with: {
        stall: true,
      },
    })
  );

  if (!existingDish || existingDish.stall.merchantId !== session.user.id) {
    return c.json({ success: false, error: 'Not found or not authorized' }, 403);
  }

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    image: z.string().optional(),
    isAvailable: z.boolean().optional(),
  });

  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: result.error.issues[0]?.message || '输入数据无效',
      },
      400
    );
  }

  const [updated] = await db
    .update(dishes)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(dishes.id, id))
    .returning();

  return c.json({ success: true, data: updated });
});

app.delete('/dishes/:id', async (c) => {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');

  const existingDish = await withRetry(() =>
    db.query.dishes.findFirst({
      where: eq(dishes.id, id),
      with: {
        stall: true,
      },
    })
  );

  if (!existingDish || existingDish.stall.merchantId !== session.user.id) {
    return c.json({ success: false, error: 'Not found or not authorized' }, 403);
  }

  await db.delete(dishes).where(eq(dishes.id, id));

  return c.json({ success: true, message: 'Dish deleted' });
});
