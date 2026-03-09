#!/usr/bin/env tsx

import { db, isLocalDB, sqliteSchema } from './index';
import { sql } from 'drizzle-orm';

console.log('🧪 本地数据库测试开始...\n');

if (!isLocalDB) {
  console.error('❌ 错误: 当前不是本地数据库模式');
  console.log('请使用: DB_PROVIDER=local tsx src/db/test-local.ts');
  process.exit(1);
}

console.log('✅ 已连接到本地 SQLite 数据库\n');

const tests = {
  passed: 0,
  failed: 0,
  results: [] as { name: string; status: 'passed' | 'failed'; error?: string }[],
};

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      tests.passed++;
      tests.results.push({ name, status: 'passed' });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      tests.failed++;
      tests.results.push({ name, status: 'failed', error: error.message });
      console.log(`❌ ${name}`);
      console.log(`   错误: ${error.message}`);
    }
  };
}

const runTests = async () => {
  await test('检查 users 表', async () => {
    const result = await db.select().from(sqliteSchema.users).limit(1);
    console.log(`   找到 ${result.length} 条用户记录`);
  })();

  await test('检查 cafeterias 表', async () => {
    const result = await db.select().from(sqliteSchema.cafeterias).limit(1);
    console.log(`   找到 ${result.length} 条食堂记录`);
  })();

  await test('检查 stalls 表', async () => {
    const result = await db.select().from(sqliteSchema.stalls).limit(1);
    console.log(`   找到 ${result.length} 条档口记录`);
  })();

  await test('检查 dishes 表', async () => {
    const result = await db.select().from(sqliteSchema.dishes).limit(1);
    console.log(`   找到 ${result.length} 条菜品记录`);
  })();

  await test('检查 reviews 表', async () => {
    const result = await db.select().from(sqliteSchema.reviews).limit(1);
    console.log(`   找到 ${result.length} 条评价记录`);
  })();

  await test('检查 reviewLikes 表', async () => {
    const result = await db.select().from(sqliteSchema.reviewLikes).limit(1);
    console.log(`   找到 ${result.length} 条点赞记录`);
  })();

  await test('检查 favorites 表', async () => {
    const result = await db.select().from(sqliteSchema.favorites).limit(1);
    console.log(`   找到 ${result.length} 条收藏记录`);
  })();

  await test('检查 messages 表', async () => {
    const result = await db.select().from(sqliteSchema.messages).limit(1);
    console.log(`   找到 ${result.length} 条消息记录`);
  })();

  await test('测试 relations 查询', async () => {
    const result = await db.query.stalls.findMany({
      limit: 1,
      with: {
        cafeteria: true,
      },
    });
    console.log(`   成功查询 stalls with cafeteria, 找到 ${result.length} 条`);
  })();

  await test('测试插入数据', async () => {
    const testUser = {
      id: crypto.randomUUID(),
      email: `test_${Date.now()}@example.com`,
      password: 'test123',
      role: 'student' as const,
      name: '测试用户',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(sqliteSchema.users).values(testUser);
    console.log(`   成功插入测试用户: ${testUser.email}`);
    
    const inserted = await db.select().from(sqliteSchema.users).where(sqliteSchema.users.email.equals(testUser.email));
    if (inserted.length === 0) {
      throw new Error('插入后未找到记录');
    }
    console.log(`   验证插入成功，用户ID: ${inserted[0].id}`);
  })();

  await test('测试事务回滚', async () => {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(sqliteSchema.users).values({
          id: 'test-tx-rollback',
          email: 'tx_test@example.com',
          password: 'test',
          role: 'student',
          name: 'TX Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        throw new Error('故意回滚');
      });
    } catch (e) {
      const result = await db.select().from(sqliteSchema.users).where(sqliteSchema.users.id.equals('test-tx-rollback'));
      if (result.length > 0) {
        throw new Error('事务回滚失败');
      }
      console.log('   事务回滚成功');
    }
  })();

  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总:');
  console.log(`   ✅ 通过: ${tests.passed}`);
  console.log(`   ❌ 失败: ${tests.failed}`);
  console.log(`   📈 总计: ${tests.passed + tests.failed}`);
  
  if (tests.failed === 0) {
    console.log('\n🎉 所有测试通过！本地数据库工作正常！');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分测试失败，请检查上述错误信息');
    process.exit(1);
  }
};

runTests().catch((error) => {
  console.error('❌ 测试运行失败:', error);
  process.exit(1);
});
