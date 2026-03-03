# 校园食堂 SaaS 平台 - 设计文档

**创建日期**: 2025-03-03  
**版本**: v1.0 - MVP 标准版  
**作者**: 毕业设计项目

---

## 1. 项目概述

### 1.1 项目简介

本项目是一个基于移动端优先（Mobile-first）设计的校园餐饮 UGC（用户生成内容）社区与 SaaS 管理平台。项目旨在解决校园食堂商家与学生之间信息不对称、缺乏有效反馈渠道的问题。通过建立评价与排行榜机制，帮助学生快速发现优质美食，同时为商家提供数据可视化的经营看板与用户互动渠道。

**核心亮点**：
- **极致的移动端体验**：全站采用响应式设计，结合 Framer Motion 实现丝滑的页面过渡与微交互
- **现代化的状态管理**：采用乐观更新（Optimistic Updates）与 TanStack Query 缓存机制，保障弱网环境下的流畅操作
- **轻量级全栈架构**：利用 Next.js 结合 Hono.js 构建高性能 API，数据层采用类型安全的 Drizzle ORM

### 1.2 角色与权限

| 角色 | 权限定义 | 核心能力 |
|------|----------|----------|
| **学生 (C端)** | 浏览者、内容创作者 | 注册登录、浏览档口/菜品、发布图文评价、打分、点赞 |
| **商家 (B端)** | 资产管理者、运营者 | 注册登录、绑定/管理专属档口、管理菜品信息、回复学生评价、查看数据看板 |

> **注**: 系统预设"东一、东二、北一、北二"四个固定食堂，商家注册后需选择并绑定其中之一，登录后自动通过鉴权路由锁定其操作权限，只能管理名下数据。

### 1.3 MVP 功能范围

| 模块 | 功能点 |
|------|--------|
| 用户系统 | 学生/商家注册登录、角色区分 |
| 首页探索 | 食堂 Tab 切换、档口热度排行 |
| 档口/菜品 | 详情展示、图片懒加载 |
| 评价系统 | 1-5 星评分、图文评价、点赞、商家回复 |
| 商家看板 | 核心指标、7天评分趋势、菜品热度图表 |
| 商家管理 | 档口信息编辑、菜品 CRUD |

---

## 2. 技术架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Next.js 16)                   │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │  App Router  │ shadcn/ui    │ Tailwind CSS │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                        API 层 (Hono.js)                      │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │  REST API    │ Auth.js      │ Zod 校验     │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                        数据层                                │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │  Drizzle ORM │ Neon PG      │ 本地文件存储  │              │
│  └──────────────┴──────────────┴──────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈清单

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Next.js 16 (App Router) | 全栈 React 框架 |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS + shadcn/ui | 原子化 CSS + 组件库 |
| 动画 | Framer Motion | 页面过渡、微交互 |
| API | Hono.js | 轻量高性能 API 层 |
| ORM | Drizzle ORM | 类型安全数据库操作 |
| 数据库 | Neon (PostgreSQL) | Serverless 数据库 |
| 认证 | Auth.js (Credentials) | 邮箱密码认证 |
| 状态管理 | TanStack Query + Zustand | 服务端状态 + UI 状态 |
| 图表 | Recharts | 数据可视化 |
| 校验 | Zod | 前后端共享 Schema |

### 2.3 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关路由组
│   ├── (main)/            # C端主页面
│   ├── (merchant)/        # B端商家后台
│   └── api/               # API 路由
├── components/            # 共享组件
│   ├── ui/               # shadcn/ui 组件
│   └── common/           # 业务通用组件
├── lib/                   # 工具函数
├── db/                    # Drizzle 配置和 Schema
├── hooks/                 # 自定义 Hooks
├── types/                 # 全局类型定义
└── styles/               # 全局样式
```

---

## 3. 数据库设计

### 3.1 ER 关系图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  cafeterias  │◄──────┤    stalls    │◄──────┤    dishes    │
│  (食堂)      │  1:N  │   (档口)     │  1:N  │   (菜品)     │
└──────────────┘       └──────┬───────┘       └──────────────┘
                              │
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │    reviews   │
                       │   (评价)     │
                       └──────┬───────┘
                              │
                              │ N:1
                              ▼
                       ┌──────────────┐
                       │    users     │
                       │   (用户)     │
                       └──────────────┘
```

### 3.2 表结构

#### `users` - 用户账户

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 用户唯一标识 |
| email | string (unique) | 登录邮箱 |
| password | string | bcrypt 加密后的密码 |
| role | enum('student', 'merchant') | 角色 |
| name | string | 显示名称 |
| avatar | string (nullable) | 头像URL |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### `cafeterias` - 食堂（静态数据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 唯一标识 |
| name | string | 东一、东二、北一、北二 |
| description | string (nullable) | 简介 |
| location | string | 位置描述 |
| image | string (nullable) | 食堂图片 |
| order | number | 排序 |

#### `stalls` - 档口

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 唯一标识 |
| name | string | 档口名称 |
| description | string | 简介 |
| cafeteriaId | uuid (FK) | 所属食堂 |
| merchantId | uuid (FK, nullable) | 绑定商家 |
| image | string (nullable) | 档口图片 |
| avgRating | decimal(2,1) | 平均评分 0.0-5.0 |
| totalReviews | number | 总评价数 |
| totalViews | number | 总浏览量 |
| isActive | boolean | 是否营业 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### `dishes` - 菜品

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 唯一标识 |
| name | string | 菜品名称 |
| description | string (nullable) | 简介 |
| stallId | uuid (FK) | 所属档口 |
| price | decimal(10,2) | 价格 |
| image | string (nullable) | 菜品图片 |
| isAvailable | boolean | 是否在售 |
| avgRating | decimal(2,1) | 平均评分 |
| totalReviews | number | 评价数 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### `reviews` - 评价（核心业务表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 唯一标识 |
| studentId | uuid (FK) | 评价学生 |
| stallId | uuid (FK) | 评价档口 |
| dishId | uuid (FK, nullable) | 评价具体菜品 |
| rating | integer(1-5) | 1-5星评分 |
| content | string | 评价内容 |
| images | string[] | 图片路径数组 |
| likes | number | 点赞数 |
| merchantReply | string (nullable) | 商家回复 |
| repliedAt | timestamp (nullable) | 回复时间 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

#### `review_likes` - 评价点赞

| 字段 | 类型 | 说明 |
|------|------|------|
| reviewId | uuid (FK, PK) | 评价ID |
| studentId | uuid (FK, PK) | 学生ID |
| createdAt | timestamp | 创建时间 |

### 3.3 索引设计

```sql
-- 加速查询
CREATE INDEX idx_stalls_cafeteria ON stalls(cafeteria_id);
CREATE INDEX idx_stalls_merchant ON stalls(merchant_id);
CREATE INDEX idx_dishes_stall ON dishes(stall_id);
CREATE INDEX idx_reviews_stall ON reviews(stall_id);
CREATE INDEX idx_reviews_student ON reviews(student_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- 唯一约束
CREATE UNIQUE INDEX idx_review_likes ON review_likes(review_id, student_id);
```

---

## 4. API 设计

### 4.1 路由结构

```
/api
├── /auth                    # Auth.js 认证
├── /cafeterias              # 食堂相关（公开）
├── /stalls                  # 档口相关
├── /dishes                  # 菜品相关
├── /reviews                 # 评价相关
└── /upload                  # 文件上传
```

### 4.2 核心接口

#### 发布评价
```
POST /api/reviews
Body: {
  stallId: string
  dishId?: string
  rating: number (1-5)
  content: string
  images?: string[]
}
Response: { success: true, review: Review }
```

#### 获取档口详情
```
GET /api/stalls/:id
Response: {
  id: string
  name: string
  description: string
  image: string
  avgRating: number
  totalReviews: number
  totalViews: number
  cafeteria: { id, name }
  merchant: { id, name }
  dishes: Dish[]
  recentReviews: Review[]
}
```

#### 商家统计数据
```
GET /api/stalls/:id/stats
Response: {
  totalViews: number
  totalReviews: number
  avgRating: number
  ratingTrend: { date: string, avgRating: number }[]
  dishStats: { dishId, name, reviewCount, avgRating }[]
}
```

---

## 5. 页面结构与路由

### 5.1 C 端页面（学生）

| 路由 | 页面名称 | 功能 |
|------|----------|------|
| `/` | 首页 | 食堂 Tab 切换、档口热度排行 |
| `/stalls/[id]` | 档口详情 | 档口信息、菜品列表、评价入口 |
| `/dishes/[id]` | 菜品详情 | 菜品信息、专属评价 |
| `/reviews/new` | 发布评价 | 评分、图文上传 |
| `/profile` | 个人中心 | 我的评价、设置 |

### 5.2 B 端页面（商家）

| 路由 | 页面名称 | 功能 |
|------|----------|------|
| `/merchant` | 数据看板 | 核心指标、图表展示 |
| `/merchant/stall` | 档口管理 | 编辑档口信息 |
| `/merchant/dishes` | 菜品管理 | CRUD 列表 |
| `/merchant/reviews` | 评价管理 | 评价列表、回复功能 |

### 5.3 认证页面

| 路由 | 页面名称 |
|------|----------|
| `/login` | 登录 |
| `/register` | 注册 |

---

## 6. 组件与状态管理

### 6.1 组件分层

```
components/
├── ui/                      # shadcn/ui 基础组件
├── common/                  # 业务通用组件
│   ├── StarRating.tsx
│   ├── ReviewCard.tsx
│   ├── DishCard.tsx
│   └── ImageUploader.tsx
├── layout/                  # 布局组件
│   ├── MobileHeader.tsx
│   ├── BottomNav.tsx
│   └── MerchantSidebar.tsx
└── features/                # 功能组件
    ├── home/
    ├── stall/
    ├── review/
    └── merchant/
```

### 6.2 状态管理策略

| 状态类型 | 管理工具 | 示例 |
|----------|----------|------|
| 服务端状态 | TanStack Query | 用户数据、档口列表、评价数据 |
| 全局 UI 状态 | Zustand | 当前食堂 Tab、登录弹窗显示 |
| 局部表单状态 | React useState | 评价表单输入、搜索关键词 |
| 服务器动作 | Server Actions | 登录、注册、文件上传 |

### 6.3 Query Keys 规范

```typescript
export const queryKeys = {
  cafeterias: ['cafeterias'],
  stalls: (cafeteriaId?: string) => ['stalls', cafeteriaId],
  stall: (id: string) => ['stall', id],
  stallStats: (id: string) => ['stall', id, 'stats'],
  dishes: (stallId: string) => ['dishes', stallId],
  dish: (id: string) => ['dish', id],
  reviews: (stallId: string) => ['reviews', stallId],
  myReviews: ['reviews', 'me'],
} as const;
```

---

## 7. 动画与交互

### 7.1 动画使用场景

| 场景 | 动画类型 | 实现工具 |
|------|----------|----------|
| 页面切换 | 滑动过渡 | Framer Motion |
| 列表加载 | stagger 渐入 | Framer Motion |
| 图片加载 | 淡入 + 缩放 | Framer Motion |
| Tab 切换 | 滑动 + 淡入 | Framer Motion |
| 点赞按钮 | 缩放 + 心跳 | Framer Motion |
| 弹窗/抽屉 | 底部滑入 | Framer Motion |
| 数字变化 | 滚动动画 | Framer Motion |

### 7.2 交互原则

- **即时响应**：所有点击操作在 100ms 内有视觉反馈
- **乐观更新**：点赞、评分等操作先更新 UI，再同步服务器
- **骨架屏**：长列表加载时使用骨架屏，避免闪屏
- **错误回滚**：乐观更新失败时平滑回滚并提示

---

## 8. 部署与运行

### 8.1 环境要求

- Node.js 18+
- Neon 数据库（免费版）
- 本地文件存储（演示环境）

### 8.2 环境变量

```bash
# 数据库
DATABASE_URL="postgresql://..."

# 认证
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 其他
UPLOAD_DIR="./uploads"
```

---

## 9. 开发策略

采用**渐进式分层架构**：

1. **数据层** → 2. **API层** → 3. **UI层**

每一层验证后再进入下一层，确保代码质量。

---

*文档结束*
