'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { MapPin, ChevronRight } from 'lucide-react';

const cafeterias = [
  { id: '1', name: '东一食堂', location: '东区学生宿舍区', stalls: 5, description: '川菜和家常菜为主' },
  { id: '2', name: '东二食堂', location: '东区教学楼旁', stalls: 5, description: '面食和烧烤特色' },
  { id: '3', name: '北一食堂', location: '北区宿舍区', stalls: 5, description: '湘菜和快餐为主' },
  { id: '4', name: '北二食堂', location: '北区图书馆旁', stalls: 6, description: '各地特色小吃' },
];

export default function CafeteriasPage() {
  const router = useRouter();

  const handleCafeteriaClick = (cafeteriaId: string) => {
    localStorage.setItem('selectedCafeteriaId', cafeteriaId);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="px-4 py-4 border-b border-[#EEEEEE]">
        <h1 className="text-lg font-bold text-black">食堂</h1>
      </header>

      <div className="px-4 py-4">
        <p className="text-sm text-gray-500 mb-4">点击食堂查看该食堂的档口</p>
        
        {cafeterias.map((cafe, index) => (
          <motion.div
            key={cafe.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleCafeteriaClick(cafe.id)}
            className="py-4 border-b border-[#EEEEEE] last:border-b-0 active:bg-[#F8F8F8] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium text-black">{cafe.name}</h2>
                  <span className="text-xs px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-full">
                    {cafe.stalls}个档口
                  </span>
                </div>
                <p className="text-[13px] text-gray-400 mt-1">{cafe.description}</p>
                <div className="flex items-center gap-1 mt-2 text-[13px] text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{cafe.location}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
