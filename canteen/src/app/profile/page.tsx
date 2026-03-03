'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Store, MessageCircle, Heart, Settings, ChevronRight, LogOut } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useQuery } from '@tanstack/react-query';
import { getDefaultAvatar } from '@/lib/utils';

interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  showArrow?: boolean;
}

function MenuItem({ href, icon, title, badge, showArrow = true }: MenuItemProps) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between py-4 border-b border-[#EEEEEE] active:bg-[#F8F8F8] transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-gray-600">
            {icon}
          </div>
          <span className="text-base font-medium text-black">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[15px] text-gray-400">{badge}</span>
          )}
          {showArrow && <ChevronRight className="w-5 h-5 text-gray-300" />}
        </div>
      </div>
    </Link>
  );
}

interface Stats {
  reviews: number;
  favorites: number;
  unreadMessages: number;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats', 'my'],
    queryFn: async () => {
      const res = await fetch('/api/stats/my');
      const json = await res.json();
      return json.data;
    },
    enabled: !!session?.user,
  });

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-6 overflow-hidden">
          <img
            src={getDefaultAvatar('guest')}
            alt="游客"
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-gray-500 mb-6">请先登录</p>

        <Link href="/login">
          <button className="w-full h-[52px] bg-[#D97706] text-white font-semibold text-base rounded-full transition-all duration-200">
            去登录
          </button>
        </Link>

        <BottomNav />
      </div>
    );
  }

  const menuItems: MenuItemProps[] = [
    {
      href: '/profile/reviews',
      icon: <User className="w-5 h-5" />,
      title: '我的评价',
      badge: stats ? `${stats.reviews}条` : undefined,
    },
    {
      href: '/profile/favorites',
      icon: <Heart className="w-5 h-5" />,
      title: '我的收藏',
      badge: stats ? `${stats.favorites}个` : undefined,
    },
    {
      href: '/messages',
      icon: <MessageCircle className="w-5 h-5" />,
      title: '消息通知',
      badge: stats?.unreadMessages ? `${stats.unreadMessages}条` : undefined,
    },
  ];

  if (session.user.role === 'merchant') {
    menuItems.push({
      href: '/merchant',
      icon: <Store className="w-5 h-5" />,
      title: '商家后台',
    });
  }

  menuItems.push(
    {
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
      title: '设置',
    }
  );

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="px-4 py-4 border-b border-[#EEEEEE]">
        <h1 className="text-lg font-bold text-black">我的</h1>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4"
      >
        <div className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden">
              <img
                src={getDefaultAvatar(session.user.id)}
                alt={session.user.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-lg font-bold text-black">{session.user.name}</h2>
              <p className="text-[15px] text-gray-400 mt-0.5">{session.user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
                  {session.user.role === 'merchant' ? '商家' : '学生'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="py-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MenuItem {...item} />
            </motion.div>
          ))}
        </div>

        <div className="py-6">
          <button
            onClick={() => signOut({ callbackUrl: '/landing' })}
            className="w-full h-[52px] border border-black text-black font-semibold text-base rounded-full hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
