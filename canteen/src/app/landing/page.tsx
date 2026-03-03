'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Star, Store, ChevronRight } from 'lucide-react';

const carouselItems = [
  {
    icon: UtensilsCrossed,
    title: '发现美食',
    subtitle: '浏览各个食堂的热门档口',
    color: '#D97706',
  },
  {
    icon: Star,
    title: '真实评价',
    subtitle: '查看同学们的真实用餐体验',
    color: '#D97706',
  },
  {
    icon: Store,
    title: '优质档口',
    subtitle: '评分系统帮你找到最好吃的',
    color: '#D97706',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleGuest = () => {
    localStorage.setItem('skipLanding', 'true');
    document.cookie = 'skipLanding=true; path=/; max-age=31536000';
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
          <div className="relative w-full max-w-sm h-64">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                {(() => {
                  const Icon = carouselItems[currentSlide].icon;
                  return (
                    <>
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                        style={{ backgroundColor: `${carouselItems[currentSlide].color}15` }}
                      >
                        <Icon
                          className="w-10 h-10"
                          style={{ color: carouselItems[currentSlide].color }}
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-black mb-3">
                        {carouselItems[currentSlide].title}
                      </h2>
                      <p className="text-[15px] text-gray-500 text-center">
                        {carouselItems[currentSlide].subtitle}
                      </p>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 mt-8">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-6 bg-[#D97706]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pb-8 pt-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black mb-2">校园食堂</h1>
            <p className="text-[15px] text-gray-500">发现校园美食，分享用餐体验</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full h-[52px] bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-base rounded-full transition-all duration-200 shadow-lg shadow-[#D97706]/25 active:scale-[0.98]"
            >
              登 录
            </button>

            <button
              onClick={handleRegister}
              className="w-full h-[52px] bg-white border border-black text-black font-semibold text-base rounded-full transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
            >
              注 册
            </button>
          </div>

          <button
            onClick={handleGuest}
            className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            游客浏览
          </button>
        </div>
      </div>
    </div>
  );
}
