'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MobileHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">校园食堂</h1>
        </Link>
        
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>个人中心</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {session.user.name?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                  </div>
                  
                  <Link href="/profile">
                    <Button variant="outline" className="w-full">
                      我的评价
                    </Button>
                  </Link>
                  
                  {session.user.role === 'merchant' && (
                    <Link href="/merchant">
                      <Button variant="outline" className="w-full">
                        商家后台
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    退出登录
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
