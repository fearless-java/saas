'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Store, 
  UtensilsCrossed, 
  MessageSquare, 
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/merchant', label: '数据看板', icon: LayoutDashboard },
  { href: '/merchant/stall', label: '档口管理', icon: Store },
  { href: '/merchant/dishes', label: '菜品管理', icon: UtensilsCrossed },
  { href: '/merchant/reviews', label: '评价管理', icon: MessageSquare },
];

export function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">商家后台</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">
              {session?.user?.name}
            </span>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex overflow-x-auto scrollbar-hide px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2",
                  isActive
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="merchantActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="p-4 pb-20">
        {children}
      </main>
    </div>
  );
}
