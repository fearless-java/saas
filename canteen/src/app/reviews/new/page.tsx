'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { useSession } from 'next-auth/react';
import { ImageUpload } from '@/components/common/ImageUpload';

function NewReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const stallId = searchParams.get('stallId');
  
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
          rating,
          content,
          images,
        }),
      });
      
      if (res.ok) {
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
