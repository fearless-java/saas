'use client';

import { motion } from 'framer-motion';
import { BottomNav } from '@/components/layout/BottomNav';
import { Flame, TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="px-4 py-4 border-b border-[#EEEEEE]">
        <h1 className="text-lg font-bold text-black">热门</h1>
      </header>

      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-[#FEF3C7] rounded-full flex items-center justify-center mb-6"
        >
          <Flame className="w-10 h-10 text-[#D97706]" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-black mb-2">热门排行</h2>
        <p className="text-[15px] text-gray-500 text-center mb-8">
          即将上线，敬请期待
        </p>
        
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span>基于用户评价和热度</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
