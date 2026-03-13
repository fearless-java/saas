'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useSession } from 'next-auth/react';
import { ImageUpload } from '@/components/common/ImageUpload';

interface Dish {
  id: string;
  name: string;
}

function NewReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const stallId = searchParams.get('stallId');
  const dishId = searchParams.get('dishId');

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string>(dishId || '');

  // 获取档口菜品列表
  const { data: dishes } = useQuery<Dish[]>({
    queryKey: ['stall-dishes', stallId],
    queryFn: async () => {
      const res = await fetch(`/api/dishes?stallId=${stallId}`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!stallId,
  });

  // 如果 URL 中有 dishId，自动选中
  useEffect(() => {
    if (dishId) {
      setSelectedDishId(dishId);
    }
  }, [dishId]);

  if (!session?.user || session.user.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 mb-4">只有学生可以发布评价</p>
        <Link href="/login">
          <Button>去登录</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stallId,
          dishId: selectedDishId || undefined,
          rating,
          content,
          images,
        }),
      });

      if (res.ok) {
        // 使缓存失效，刷新档口和菜品详情页的评价
        await queryClient.invalidateQueries({ queryKey: ['stall', stallId] });
        if (selectedDishId) {
          await queryClient.invalidateQueries({ queryKey: ['dish', selectedDishId] });
        }
        await queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
        router.push(stallId ? `/stalls/${stallId}` : '/');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileHeader />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Link href={stallId ? `/stalls/${stallId}` : '/'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">发布评价</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* 菜品选择器 */}
            {stallId && dishes && dishes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">评价菜品（可选）</label>
                <div className="relative">
                  <select
                    value={selectedDishId}
                    onChange={(e) => setSelectedDishId(e.target.value)}
                    className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-lg appearance-none bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                  >
                    <option value="">对整个档口评分</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {selectedDishId && (
                  <p className="mt-2 text-sm text-[#D97706]">
                    正在为菜品写评价
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">评分</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">评价内容</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享您的用餐体验..."
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">上传图片</label>
              <ImageUpload images={images} onChange={setImages} maxImages={6} />
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? '发布中...' : '发布评价'}
        </Button>
      </motion.div>
    </>
  );
}

export default function NewReviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-4">加载中...</div>}>
        <NewReviewForm />
      </Suspense>
    </div>
  );
}
