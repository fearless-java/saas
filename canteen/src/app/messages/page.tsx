'use client';

import { motion } from 'framer-motion';
import { BottomNav } from '@/components/layout/BottomNav';
import { MessageCircle, Bell } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="px-4 py-4 border-b border-[#EEEEEE]">
        <h1 className="text-lg font-bold text-black">消息</h1>
      </header>

      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-[#F8F8F8] rounded-full flex items-center justify-center mb-6"
>
          <Bell className="w-10 h-10 text-gray-400" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-black mb-2">暂无消息</h2>
        <p className="text-[15px] text-gray-500 text-center">
          商家回复和系统通知将显示在这里
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
