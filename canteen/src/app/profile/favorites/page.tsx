'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-white pb-6">
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEEEEE]">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/profile">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-black">我的收藏</h1>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-[#F8F8F8] rounded-full flex items-center justify-center mb-6"
        >
          <Heart className="w-10 h-10 text-gray-400" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-black mb-2">暂无收藏</h2>
        <p className="text-[15px] text-gray-500 text-center">
          收藏喜欢的档口，方便下次查看
        </p>
      </div>
    </div>
  );
}
