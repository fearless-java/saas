'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Moon, Globe, Shield, HelpCircle, Info } from 'lucide-react';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  showArrow?: boolean;
}

function SettingItem({ icon, title, showArrow = true }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#EEEEEE] last:border-b-0 active:bg-[#F8F8F8] transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center text-gray-600">
          {icon}
        </div>
        <span className="text-base font-medium text-black">{title}</span>
      </div>
      
      {showArrow && <ChevronRight className="w-5 h-5 text-gray-300" />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white pb-6">
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEEEEE]">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/profile">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-black">设置</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4"
      >
        <div className="py-2">
          <SettingItem icon={<Moon className="w-5 h-5" />} title="深色模式" />
          <SettingItem icon={<Globe className="w-5 h-5" />} title="语言" />
          <SettingItem icon={<Shield className="w-5 h-5" />} title="隐私设置" />
        </div>

        <div className="py-2 border-t border-[#EEEEEE]">
          <SettingItem icon={<HelpCircle className="w-5 h-5" />} title="帮助与反馈" />
          <SettingItem icon={<Info className="w-5 h-5" />} title="关于我们" />
        </div>

        <div className="py-6 text-center">
          <p className="text-[13px] text-gray-400">校园食堂 v1.0.0</p>
        </div>
      </motion.div>
    </div>
  );
}
