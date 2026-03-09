# 数据库切换与迁移指南

## 快速开始

### 1. 一键切换本地/云端数据库

```bash
# 使用 Neon 云端数据库（默认）
bun dev

# 使用本地 SQLite 数据库
DB_PROVIDER=local bun dev
# 或
bun run dev:local
```

### 2. 环境变量配置

在 `.env.local` 文件中：

```bash
# 数据库提供商: neon | local
DB_PROVIDER=neon

# Neon 数据库连接字符串（云端）
DATABASE_URL="postgresql://..."

# 本地数据库路径（可选，默认: ./data/local.db）
LOCAL_DB_PATH="./data/local.db"
```

---

## 数据同步方案

### 方案 A: Neon → 本地（开发时使用）

将云端数据同步到本地进行开发：

```bash
# 1. 导出 Neon 数据并导入到本地 SQLite
bun run db:migrate-to-local

# 2. 使用本地数据库启动
bun run dev:local
```

### 方案 B: 本地 → Neon（部署前）

开发完成后同步到云端：

```bash
# 1. 导出数据到 JSON
bun run db:export

# 2. 在 Neon 控制台导入
# 访问: https://console.neon.tech
# 选择项目 → SQL Editor → 导入
```

### 方案 C: 双写同步（实时）

在代码层实现双写（高级）：

```typescript
// 在关键操作中同时写入两个数据库
if (process.env.SYNC_DUAL_WRITE === 'true') {
  await Promise.all([
    neonDb.insert(...),
    sqliteDb.insert(...)
  ]);
}
```

---

## 迁移到新加坡区域（推荐）

当前数据库在美国东部（us-east-1），延迟约 200-300ms。
迁移到新加坡（ap-southeast-1）可将延迟降至 50-100ms。

### 步骤 1: 创建新加坡项目

```bash
# 使用 Neon CLI 创建新加坡项目
npx neonctl@latest projects create \
  --name canteen-sg \
  --region ap-southeast-1

# 输出示例:
# Project ID:     silent-snowflake-12345678
# Region:         aws-ap-southeast-1
# Connect string: postgresql://...ap-southeast-1.aws.neon.tech/...
```

或在 Neon 控制台操作：
1. 访问 https://console.neon.tech
2. 点击 "New Project"
3. Region 选择 **Singapore (aws-ap-southeast-1)**

### 步骤 2: 导出原数据库数据

```bash
# 方法 1: 使用 pg_dump（需要安装 PostgreSQL）
pg_dump "$DATABASE_URL" > backup.sql

# 方法 2: 使用我们的导出脚本
bun run db:export
# 数据将保存在 data/db-backup.json
```

### 步骤 3: 导入到新数据库

```bash
# 方法 1: 使用 psql
psql "新数据库连接字符串" < backup.sql

# 方法 2: 在 Neon 控制台使用 SQL Editor
# 1. 打开新项目的 SQL Editor
# 2. 粘贴 backup.sql 内容执行
```

### 步骤 4: 更新连接字符串

```bash
# 更新 .env.local
DATABASE_URL="postgresql://[新连接字符串]"

# 重启开发服务器
bun dev
```

### 步骤 5: 验证

```bash
# 检查延迟
curl -w "@curl-format.txt" -o /dev/null -s "https://[新主机名]"

# 或使用我们的测试脚本
bun run test:db-connection
```

---

## 目录结构

```
canteen/
├── src/
│   └── db/
│       ├── index.ts           # 数据库连接入口（自动切换）
│       ├── schema.ts          # PostgreSQL schema
│       ├── schema.sqlite.ts   # SQLite schema
│       ├── seed.ts            # 数据种子
│       └── sync.ts            # 数据同步工具
├── data/
│   ├── local.db               # SQLite 数据库（本地开发）
│   └── db-backup.json         # 导出的数据备份
├── .env.local                 # 环境变量配置
└── docs/
    └── database-guide.md      # 本指南
```

---

## 常见问题

### Q: 本地和云端 schema 不一致怎么办？

A: 每次修改 schema.ts 后，需要同时更新 schema.sqlite.ts：

```bash
# PostgreSQL
bun run db:push

# SQLite（手动执行）
DB_PROVIDER=local bun run db:push
```

### Q: UUID 在 SQLite 中如何处理？

A: SQLite 使用 TEXT 类型存储 UUID，已在 schema.sqlite.ts 中兼容。

### Q: 如何保持数据一致性？

A: 推荐工作流：
1. 开发时使用本地数据库（速度快）
2. 定期导出云端数据到本地同步
3. 部署前确保 schema 一致
4. 生产环境只用 Neon

### Q: 连接超时问题？

A: 当前已配置 30 秒超时和重试机制，但最佳方案是迁移到新加坡区域。

---

## 推荐配置

### 开发环境 (.env.local)

```bash
# 本地开发使用 SQLite（无网络延迟）
DB_PROVIDER=local
LOCAL_DB_PATH="./data/local.db"

# 定期同步时临时切换到 Neon
# DATABASE_URL="postgresql://..."
```

### 生产环境 (Vercel 环境变量)

```bash
# 生产环境必须使用 Neon
DB_PROVIDER=neon
DATABASE_URL="postgresql://...ap-southeast-1.aws.neon.tech/..."
```

---

## 一键迁移脚本

```bash
#!/bin/bash
# migrate-to-singapore.sh

echo "🚀 开始迁移到新加坡..."

# 1. 导出数据
echo "📤 导出当前数据库..."
bun run db:export

# 2. 提示用户创建新项目
echo ""
echo "请在 Neon 控制台创建新加坡项目:"
echo "https://console.neon.tech"
echo "Region: Singapore (ap-southeast-1)"
echo ""
read -p "输入新项目的连接字符串: " NEW_URL

# 3. 更新环境变量
echo "DATABASE_URL=\"$NEW_URL\"" >> .env.local

# 4. 验证连接
echo "🔍 测试连接..."
DATABASE_URL="$NEW_URL" bun run test:db-connection

echo "✅ 迁移完成！"
```

运行：`bash migrate-to-singapore.sh`
