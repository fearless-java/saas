'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, UtensilsCrossed } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      setError('邮箱或密码错误');
      setLoading(false);
      return;
    }

    localStorage.setItem('skipLanding', 'true');
    document.cookie = 'skipLanding=true; path=/; max-age=31536000';
    
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center p-4">
        <Link
          href="/landing"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col px-6 pt-8"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#D97706]/10 rounded-2xl flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-[#D97706]" />
          </div>
          <h1 className="text-[22px] font-bold text-black mb-2">欢迎回来</h1>
          <p className="text-[15px] text-gray-500">登录你的账号继续探索美食</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full h-[52px] pl-12 pr-4 bg-[#F8F8F8] border border-[#EEEEEE] rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full h-[52px] pl-12 pr-12 bg-[#F8F8F8] border border-[#EEEEEE] rounded-lg text-base text-black placeholder:text-gray-400 focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-sm text-[#D97706] hover:underline">
              忘记密码？
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-semibold text-base rounded-full transition-all duration-200 shadow-lg shadow-[#D97706]/25 active:scale-[0.98] mt-2"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="mt-auto pb-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            还没有账号？
            <Link href="/register" className="text-[#D97706] font-medium hover:underline ml-1">
              立即注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
