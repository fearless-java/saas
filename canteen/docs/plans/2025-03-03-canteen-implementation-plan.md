# 校园食堂 SaaS 平台 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现一个完整的校园食堂 SaaS 平台，包含 C 端（学生）和 B 端（商家），采用 Next.js 16 + Hono.js + Neon + Drizzle 技术栈

**Architecture:** 采用渐进式分层开发：1）数据层（Drizzle Schema + Neon 数据库）→ 2）API 层（Hono.js + 认证）→ 3）UI 层（Next.js + shadcn/ui）

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Hono.js, Drizzle ORM, Neon PostgreSQL, Auth.js, TanStack Query, Zustand, Recharts

**参考设计文档:** `docs/plans/2025-03-03-canteen-design.md`

---

## Phase 1: 项目初始化与数据层

### Task 1.1: 安装核心依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 Drizzle ORM 和 Neon 相关依赖**

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

**Step 2: 安装 Auth.js 和 bcrypt**

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

**Step 3: 安装 Hono.js**

```bash
npm install hono
```

**Step 4: 安装 TanStack Query 和 Zustand**

```bash
npm install @tanstack/react-query zustand
```

**Step 5: 安装图表库**

```bash
npm install recharts
```

**Step 6: 验证安装**

```bash
npm list drizzle-orm next-auth hono @tanstack/react-query zustand recharts
```

Expected: All packages installed without errors

**Step 7: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies (drizzle, auth, hono, query, zustand, recharts)"
```

---

### Task 1.2: 配置 Drizzle ORM

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Modify: `drizzle.config.ts`
- Create: `.env.local`

**Step 1: 更新 drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 2: 创建数据库 Schema**

Create `src/db/schema.ts`:

```typescript
import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().$type<'student' | 'merchant'>(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cafeterias table (static data)
export const cafeterias = pgTable('cafeterias', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 200 }).notNull(),
  image: varchar('image', { length: 500 }),
  order: integer('order').default(0).notNull(),
});

// Stalls table
export const stalls = pgTable('stalls', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  cafeteriaId: uuid('cafeteria_id').notNull().references(() => cafeterias.id),
  merchantId: uuid('merchant_id').references(() => users.id),
  image: varchar('image', { length: 500 }),
  avgRating: decimal('avg_rating', { precision: 2, scale: 1 }).default('0').notNull(),
  totalReviews: integer('total_reviews').default(0).notNull(),
  totalViews: integer('total_views').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Dishes table
export const dishes = pgTable('dishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  stallId: uuid('stall_id').notNull().references(() => stalls.id),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  image: varchar('image', { length: 500 }),
  isAvailable: boolean('is_available').default(true).notNull(),
  avgRating: decimal('avg_rating', { precision: 2, scale: 1 }).default('0').notNull(),
  totalReviews: integer('total_reviews').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => users.id),
  stallId: uuid('stall_id').notNull().references(() => stalls.id),
  dishId: uuid('dish_id').references(() => dishes.id),
  rating: integer('rating').notNull(),
  content: text('content').notNull(),
  images: text('images').array().default([]).notNull(),
  likes: integer('likes').default(0).notNull(),
  merchantReply: text('merchant_reply'),
  repliedAt: timestamp('replied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Review likes table (many-to-many)
export const reviewLikes = pgTable('review_likes', {
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.reviewId, table.studentId] }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  stalls: many(stalls),
  reviews: many(reviews),
  reviewLikes: many(reviewLikes),
}));

export const cafeteriasRelations = relations(cafeterias, ({ many }) => ({
  stalls: many(stalls),
}));

export const stallsRelations = relations(stalls, ({ one, many }) => ({
  cafeteria: one(cafeterias, {
    fields: [stalls.cafeteriaId],
    references: [cafeterias.id],
  }),
  merchant: one(users, {
    fields: [stalls.merchantId],
    references: [users.id],
  }),
  dishes: many(dishes),
  reviews: many(reviews),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  stall: one(stalls, {
    fields: [dishes.stallId],
    references: [stalls.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
  }),
  stall: one(stalls, {
    fields: [reviews.stallId],
    references: [stalls.id],
  }),
  dish: one(dishes, {
    fields: [reviews.dishId],
    references: [dishes.id],
  }),
  likes: many(reviewLikes),
}));

export const reviewLikesRelations = relations(reviewLikes, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewLikes.reviewId],
    references: [reviews.id],
  }),
  student: one(users, {
    fields: [reviewLikes.studentId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Cafeteria = typeof cafeterias.$inferSelect;
export type Stall = typeof stalls.$inferSelect;
export type Dish = typeof dishes.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ReviewLike = typeof reviewLikes.$inferSelect;
```

**Step 3: 创建数据库连接**

Create `src/db/index.ts`:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Step 4: 添加环境变量**

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:npg_XXXXXXXXX@XXXXXXXXXX-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Auth
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Upload
UPLOAD_DIR="./uploads"
```

**Step 5: Commit**

```bash
git add src/db/ drizzle.config.ts .env.local
git commit -m "feat: setup Drizzle ORM with complete database schema"
```

---

### Task 1.3: 初始化数据库和种子数据

**Files:**
- Create: `src/db/seed.ts`

**Step 1: 创建种子数据脚本**

Create `src/db/seed.ts`:

```typescript
import { db } from './index';
import { cafeterias, stalls, dishes, users } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed cafeterias
  const cafeteriaData = [
    { name: '东一食堂', description: '东区第一食堂，以川菜和家常菜为主', location: '东区学生宿舍区', order: 1 },
    { name: '东二食堂', description: '东区第二食堂，特色是面食和烧烤', location: '东区教学楼旁', order: 2 },
    { name: '北一食堂', description: '北区第一食堂，以湘菜和快餐为主', location: '北区宿舍区', order: 3 },
    { name: '北二食堂', description: '北区第二食堂，提供各地特色小吃', location: '北区图书馆旁', order: 4 },
  ];

  const insertedCafeterias = await db.insert(cafeterias).values(cafeteriaData).returning();
  console.log(`✅ Inserted ${insertedCafeterias.length} cafeterias`);

  // Seed a demo merchant
  const hashedPassword = await bcrypt.hash('password123', 10);
  const [demoMerchant] = await db.insert(users).values({
    email: 'merchant@example.com',
    password: hashedPassword,
    role: 'merchant',
    name: '张老板',
  }).returning();
  console.log('✅ Inserted demo merchant');

  // Seed a demo student
  const [demoStudent] = await db.insert(users).values({
    email: 'student@example.com',
    password: hashedPassword,
    role: 'student',
    name: '小明',
  }).returning();
  console.log('✅ Inserted demo student');

  // Seed stalls for each cafeteria
  const stallData = [
    { name: '川味小炒', description: '正宗四川口味，麻辣鲜香', cafeteriaId: insertedCafeterias[0].id, merchantId: demoMerchant.id },
    { name: '家常快餐', description: '营养均衡，价格实惠', cafeteriaId: insertedCafeterias[0].id },
    { name: '重庆小面', description: '地道重庆风味', cafeteriaId: insertedCafeterias[1].id },
    { name: '烧烤档', description: '夜宵首选，美味烧烤', cafeteriaId: insertedCafeterias[1].id },
    { name: '湘菜馆', description: '湖南特色，辣得过瘾', cafeteriaId: insertedCafeterias[2].id },
    { name: '快餐便当', description: '快捷方便，品种丰富', cafeteriaId: insertedCafeterias[2].id },
    { name: '小吃街', description: '各地特色小吃汇集', cafeteriaId: insertedCafeterias[3].id },
    { name: '甜品站', description: '奶茶甜品，休闲时光', cafeteriaId: insertedCafeterias[3].id },
  ];

  const insertedStalls = await db.insert(stalls).values(stallData).returning();
  console.log(`✅ Inserted ${insertedStalls.length} stalls`);

  // Seed dishes for each stall
  const dishData = [
    // 川味小炒
    { name: '宫保鸡丁', description: '经典川菜，鸡肉嫩滑', price: '18.00', stallId: insertedStalls[0].id },
    { name: '麻婆豆腐', description: '麻辣鲜香，下饭神器', price: '12.00', stallId: insertedStalls[0].id },
    { name: '回锅肉', description: '肥而不腻，香味浓郁', price: '22.00', stallId: insertedStalls[0].id },
    // 家常快餐
    { name: '红烧肉套餐', description: '肥瘦相间，入口即化', price: '20.00', stallId: insertedStalls[1].id },
    { name: '番茄炒蛋套餐', description: '家常美味，营养健康', price: '15.00', stallId: insertedStalls[1].id },
    // 重庆小面
    { name: '重庆小面', description: '麻辣鲜香，地道重庆味', price: '12.00', stallId: insertedStalls[2].id },
    { name: '豌杂面', description: '豌豆软烂，杂酱香浓', price: '14.00', stallId: insertedStalls[2].id },
  ];

  const insertedDishes = await db.insert(dishes).values(dishData).returning();
  console.log(`✅ Inserted ${insertedDishes.length} dishes`);

  console.log('✅ Seeding completed!');
  console.log('\nDemo accounts:');
  console.log('  Merchant: merchant@example.com / password123');
  console.log('  Student:  student@example.com / password123');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
```

**Step 2: 添加 seed 脚本到 package.json**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 3: 安装 tsx**

```bash
npm install -D tsx
```

**Step 4: Commit**

```bash
git add src/db/seed.ts package.json
git commit -m "feat: add database seed script with demo data"
```

---

## Phase 2: 认证系统

### Task 2.1: 配置 Auth.js

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/next-auth.d.ts`
- Modify: `src/app/layout.tsx`

**Step 1: 创建 Auth 配置**

Create `src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as 'student' | 'merchant';
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
  session: {
    strategy: 'jwt',
  },
};
```

**Step 2: 创建类型声明**

Create `src/types/next-auth.d.ts`:

```typescript
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'student' | 'merchant';
    };
  }

  interface User {
    role: 'student' | 'merchant';
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'merchant';
    id?: string;
  }
}
```

**Step 3: 创建 API 路由**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Step 4: 创建 Session Provider**

Create `src/components/providers/SessionProvider.tsx`:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Step 5: 更新 layout.tsx**

Modify `src/app/layout.tsx`:

```typescript
import { AuthProvider } from '@/components/providers/SessionProvider';

// ... existing imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

**Step 6: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts src/app/api/auth/ src/components/providers/ src/app/layout.tsx
git commit -m "feat: setup Auth.js with credentials provider"
```

---

### Task 2.2: 实现注册和登录页面

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/app/api/register/route.ts`

**Step 1: 创建注册 API**

Create `src/app/api/register/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['student', 'merchant']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role,
    }).returning();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

**Step 2: 创建登录页面**

Create `src/app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('邮箱或密码错误');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <div className="text-center">
            <Link href="/register" className="text-indigo-600 hover:text-indigo-500">
              还没有账号？立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: 创建注册页面**

Create `src/app/register/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as 'student' | 'merchant';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        setLoading(false);
        return;
      }

      router.push('/login');
    } catch (error) {
      setError('注册失败，请重试');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            注册
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    defaultChecked
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">学生</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="merchant"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">商家</span>
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
              已有账号？立即登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/login/ src/app/register/ src/app/api/register/
git commit -m "feat: implement login and register pages with API"
```

---

## Phase 3: API 层 (Hono.js)

### Task 3.1: 创建 Hono API 路由

**Files:**
- Create: `src/app/api/[[...route]]/route.ts`
- Create: `src/lib/hono.ts`

**Step 1: 创建 Hono 应用实例**

Create `src/lib/hono.ts`:

```typescript
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const app = new Hono().basePath('/api');

// Export handlers for Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
```

**Step 2: 创建 API 路由入口**

Create `src/app/api/[[...route]]/route.ts`:

```typescript
import { app } from '@/lib/hono';
import { handle } from 'hono/vercel';

// Import routes
import '@/app/api/routes/cafeterias';
import '@/app/api/routes/stalls';
import '@/app/api/routes/dishes';
import '@/app/api/routes/reviews';
import '@/app/api/routes/upload';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
```

**Step 3: 创建路由目录结构**

```bash
mkdir -p src/app/api/routes
```

**Step 4: Commit**

```bash
git add src/lib/hono.ts src/app/api/\[\[...route\]\]/ src/app/api/routes/
git commit -m "feat: setup Hono.js API framework"
```

---

### Task 3.2: 实现食堂和档口 API

**Files:**
- Create: `src/app/api/routes/cafeterias.ts`
- Create: `src/app/api/routes/stalls.ts`

**Step 1: 创建食堂 API**

Create `src/app/api/routes/cafeterias.ts`:

```typescript
import { app } from '@/lib/hono';
import { db } from '@/db';
import { cafeterias, stalls } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// Get all cafeterias
app.get('/cafeterias', async (c) => {
  const data = await db.query.cafeterias.findMany({
    orderBy: cafeterias.order,
  });
  return c.json({ success: true, data });
});
```

**Step 2: 创建档口 API**

Create `src/app/api/routes/stalls.ts`:

```typescript
import { app } from '@/lib/hono';
import { db } from '@/db';
import { stalls, dishes, reviews, users } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get stalls by cafeteria
app.get('/stalls', async (c) => {
  const cafeteriaId = c.req.query('cafeteriaId');
  
  const where = cafeteriaId ? eq(stalls.cafeteriaId, cafeteriaId) : undefined;
  
  const data = await db.query.stalls.findMany({
    where,
    orderBy: desc(stalls.totalReviews),
    with: {
      cafeteria: true,
    },
  });
  
  return c.json({ success: true, data });
});

// Get stall by ID
app.get('/stalls/:id', async (c) => {
  const id = c.req.param('id');
  
  const stall = await db.query.stalls.findFirst({
    where: eq(stalls.id, id),
    with: {
      cafeteria: true,
      merchant: true,
      dishes: true,
    },
  });
  
  if (!stall) {
    return c.json({ success: false, error: 'Stall not found' }, 404);
  }
  
  // Increment view count
  await db.update(stalls)
    .set({ totalViews: stall.totalViews + 1 })
    .where(eq(stalls.id, id));
  
  // Get recent reviews
  const recentReviews = await db.query.reviews.findMany({
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
  });
  
  return c.json({
    success: true,
    data: {
      ...stall,
      recentReviews,
    },
  });
});

// Update stall (merchant only)
app.put('/stalls/:id', async (c) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const id = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership
  const stall = await db.query.stalls.findFirst({
    where: and(
      eq(stalls.id, id),
      eq(stalls.merchantId, session.user.id)
    ),
  });
  
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
  
  const [updated] = await db.update(stalls)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(stalls.id, id))
    .returning();
  
  return c.json({ success: true, data: updated });
});

// Get stall stats (merchant only)
app.get('/stalls/:id/stats', async (c) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const id = c.req.param('id');
  
  // Verify ownership
  const stall = await db.query.stalls.findFirst({
    where: and(
      eq(stalls.id, id),
      eq(stalls.merchantId, session.user.id)
    ),
  });
  
  if (!stall) {
    return c.json({ success: false, error: 'Not found or not authorized' }, 403);
  }
  
  // Get 7-day rating trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.stallId, id),
      gte(reviews.createdAt, sevenDaysAgo)
    ),
  });
  
  // Calculate daily averages
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
  
  // Get dish stats
  const dishList = await db.query.dishes.findMany({
    where: eq(dishes.stallId, id),
  });
  
  const dishStats = await Promise.all(
    dishList.map(async (dish) => {
      const dishReviews = await db.query.reviews.findMany({
        where: eq(reviews.dishId, dish.id),
      });
      
      const avgRating = dishReviews.length > 0
        ? dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length
        : 0;
      
      return {
        dishId: dish.id,
        name: dish.name,
        reviewCount: dishReviews.length,
        avgRating: Number(avgRating.toFixed(1)),
      };
    })
  );
  
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
```

**Step 3: Commit**

```bash
git add src/app/api/routes/cafeterias.ts src/app/api/routes/stalls.ts
git commit -m "feat: implement cafeteria and stall APIs with stats"
```

---

### Task 3.3: 实现评价和上传 API

**Files:**
- Create: `src/app/api/routes/reviews.ts`
- Create: `src/app/api/routes/upload.ts`

**Step 1: 创建评价 API**

Create `src/app/api/routes/reviews.ts`:

```typescript
import { app } from '@/lib/hono';
import { db } from '@/db';
import { reviews, stalls, dishes, reviewLikes } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get reviews by stall
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

// Create review (student only)
app.post('/reviews', async (c) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'student') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  
  const reviewSchema = z.object({
    stallId: z.string().uuid(),
    dishId: z.string().uuid().optional(),
    rating: z.number().min(1).max(5),
    content: z.string().min(1),
    images: z.array(z.string()).default([]),
  });
  
  const data = reviewSchema.parse(body);
  
  // Create review
  const [review] = await db.insert(reviews).values({
    studentId: session.user.id,
    stallId: data.stallId,
    dishId: data.dishId,
    rating: data.rating,
    content: data.content,
    images: data.images,
  }).returning();
  
  // Update stall stats
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
  
  // Update dish stats if applicable
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
  
  return c.json({ success: true, data: review });
});

// Like/unlike review
app.post('/reviews/:id/like', async (c) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'student') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const reviewId = c.req.param('id');
  const studentId = session.user.id;
  
  // Check if already liked
  const existingLike = await db.query.reviewLikes.findFirst({
    where: and(
      eq(reviewLikes.reviewId, reviewId),
      eq(reviewLikes.studentId, studentId)
    ),
  });
  
  if (existingLike) {
    // Unlike
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
    // Like
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

// Merchant reply to review
app.post('/reviews/:id/reply', async (c) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'merchant') {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const reviewId = c.req.param('id');
  const body = await c.req.json();
  
  const replySchema = z.object({
    reply: z.string().min(1),
  });
  
  const { reply } = replySchema.parse(body);
  
  // Verify the review belongs to merchant's stall
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
```

**Step 2: 创建上传 API**

Create `src/app/api/routes/upload.ts`:

```typescript
import { app } from '@/lib/hono';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Ensure upload directory exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

app.post('/upload/image', async (c) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No image provided' }, 400);
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: 'Invalid file type' }, 400);
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: 'File too large (max 5MB)' }, 400);
    }
    
    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    
    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);
    
    // Return relative URL
    return c.json({
      success: true,
      data: {
        url: `/uploads/${filename}`,
        filename,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});
```

**Step 3: 配置静态文件服务**

Create `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
```

**Step 4: Commit**

```bash
git add src/app/api/routes/reviews.ts src/app/api/routes/upload.ts next.config.ts
git commit -m "feat: implement reviews and upload APIs"
```

---

## Phase 4: UI 层 - 核心页面

### Task 4.1: 安装 shadcn/ui 组件

**Files:**
- Modify: `package.json`

**Step 1: 安装 shadcn/ui 组件**

```bash
npx shadcn@latest add button card input textarea tabs avatar badge dialog sheet skeleton
```

**Step 2: 验证安装**

```bash
ls src/components/ui/
```

Expected: button.tsx, card.tsx, input.tsx, etc.

**Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: install shadcn/ui components"
```

---

### Task 4.2: 实现首页和食堂列表

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/layout/MobileHeader.tsx`
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/features/home/CafeteriaTabs.tsx`
- Create: `src/components/common/StallCard.tsx`

**Step 1: 创建布局组件**

Create `src/components/layout/MobileHeader.tsx`:

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function MobileHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-gray-900">校园食堂</h1>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              退出
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

Create `src/components/layout/BottomNav.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 2: 创建首页组件**

Create `src/components/features/home/CafeteriaTabs.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface Cafeteria {
  id: string;
  name: string;
}

export function CafeteriaTabs({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { data: cafeterias } = useQuery<Cafeteria[]>({
    queryKey: ['cafeterias'],
    queryFn: async () => {
      const res = await fetch('/api/cafeterias');
      const json = await res.json();
      return json.data;
    },
  });

  const [activeId, setActiveId] = useState<string>(cafeterias?.[0]?.id);

  const handleSelect = (id: string) => {
    setActiveId(id);
    onSelect(id);
  };

  if (!cafeterias) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex overflow-x-auto scrollbar-hide">
        {cafeterias.map((cafeteria) => (
          <button
            key={cafeteria.id}
            onClick={() => handleSelect(cafeteria.id)}
            className={`relative px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors ${
              activeId === cafeteria.id
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {cafeteria.name}
            {activeId === cafeteria.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Create `src/components/common/StallCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MessageCircle } from 'lucide-react';

interface Stall {
  id: string;
  name: string;
  description: string;
  image?: string;
  avgRating: string;
  totalReviews: number;
  cafeteria: { name: string };
}

export function StallCard({ stall, index }: { stall: Stall; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/stalls/${stall.id}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden active:scale-[0.98] transition-transform">
          <div className="flex p-4 gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
              {stall.image ? (
                <img
                  src={stall.image}
                  alt={stall.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  无图
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {stall.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {stall.description}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{stall.avgRating}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{stall.totalReviews}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
```

**Step 3: 创建首页**

Create `src/app/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { CafeteriaTabs } from '@/components/features/home/CafeteriaTabs';
import { StallCard } from '@/components/common/StallCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Stall {
  id: string;
  name: string;
  description: string;
  image?: string;
  avgRating: string;
  totalReviews: number;
  cafeteria: { name: string };
}

export default function HomePage() {
  const [selectedCafeteriaId, setSelectedCafeteriaId] = useState<string>('');

  const { data: stalls, isLoading } = useQuery<Stall[]>({
    queryKey: ['stalls', selectedCafeteriaId],
    queryFn: async () => {
      const params = selectedCafeteriaId
        ? `?cafeteriaId=${selectedCafeteriaId}`
        : '';
      const res = await fetch(`/api/stalls${params}`);
      const json = await res.json();
      return json.data;
    },
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <MobileHeader />
      
      <CafeteriaTabs onSelect={setSelectedCafeteriaId} />
      
      <main className="p-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">热门档口</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : stalls?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无档口数据
          </div>
        ) : (
          <div className="space-y-4">
            {stalls?.map((stall, index) => (
              <StallCard key={stall.id} stall={stall} index={index} />
            ))}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
```

**Step 4: 安装图标库**

```bash
npm install lucide-react
```

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/layout/ src/components/features/ src/components/common/ src/app/globals.css
ngit commit -m "feat: implement home page with cafeteria tabs and stall cards"
```

---

## Phase 5: 商家后台

### Task 5.1: 实现商家看板页面

**Files:**
- Create: `src/app/merchant/page.tsx`
- Create: `src/app/merchant/layout.tsx`
- Create: `src/components/layout/MerchantSidebar.tsx`

**Step 1: 创建商家布局**

Create `src/app/merchant/layout.tsx`:

```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MerchantSidebar } from '@/components/layout/MerchantSidebar';

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'merchant') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-6 ml-64">{children}</main>
      </div>
    </div>
  );
}
```

Create `src/components/layout/MerchantSidebar.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, UtensilsCrossed, MessageSquare } from 'lucide-react';

export function MerchantSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/merchant', label: '数据看板', icon: LayoutDashboard },
    { href: '/merchant/stall', label: '档口管理', icon: Store },
    { href: '/merchant/dishes', label: '菜品管理', icon: UtensilsCrossed },
    { href: '/merchant/reviews', label: '评价管理', icon: MessageSquare },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">商家后台</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 2: 创建商家看板页面**

Create `src/app/merchant/page.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Eye, Star, MessageSquare } from 'lucide-react';

interface Stats {
  totalViews: number;
  totalReviews: number;
  avgRating: number;
  ratingTrend: { date: string; avgRating: number; count: number }[];
  dishStats: { dishId: string; name: string; reviewCount: number; avgRating: number }[];
}

export default function MerchantDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['merchant', 'stats'],
    queryFn: async () => {
      // Note: Need to get the merchant's stall ID first
      const res = await fetch('/api/merchant/stall');
      const stallData = await res.json();
      
      if (!stallData.data?.id) {
        throw new Error('No stall found');
      }
      
      const statsRes = await fetch(`/api/stalls/${stallData.data.id}/stats`);
      const statsJson = await statsRes.json();
      return statsJson.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总评价数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Rating Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>近7天评分趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.ratingTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Dish Stats Chart */}
      <Card>
        <CardHeader>
          <CardTitle>菜品热度对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dishStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reviewCount" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/merchant/ src/components/layout/MerchantSidebar.tsx
git commit -m "feat: implement merchant dashboard with charts"
```

---

## Phase 6: 测试与优化

### Task 6.1: 运行应用并测试

**Step 1: 启动开发服务器**

```bash
npm run dev
```

**Step 2: 在浏览器中访问**

Open http://localhost:3000

**Step 3: 测试流程**

1. 访问首页，确认食堂列表加载
2. 注册学生账号
3. 注册商家账号
4. 商家登录后访问后台看板
5. 学生浏览档口并发布评价

**Step 4: 检查 TypeScript 错误**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add .
git commit -m "chore: final testing and type checking"
```

---

## Summary

This implementation plan covers:

1. **Phase 1**: Database setup with Drizzle ORM + Neon
2. **Phase 2**: Authentication with Auth.js
3. **Phase 3**: API layer with Hono.js
4. **Phase 4**: UI layer with Next.js + shadcn/ui
5. **Phase 5**: Merchant dashboard
6. **Phase 6**: Testing and optimization

Total estimated time: 8-12 hours of focused development.

---

**Next Step**: Run `superpowers:executing-plans` to implement this plan task-by-task.
