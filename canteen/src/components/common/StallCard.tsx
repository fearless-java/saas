'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Stall {
  id: string;
  name: string;
  description: string;
  image?: string;
  avgRating: string;
  totalReviews: number;
  cafeteria?: { name: string };
  isActive?: boolean;
}

export function StallCard({ stall, index }: { stall: Stall; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/stalls/${stall.id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
          <CardContent className="p-0">
            <div className="flex p-4 gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {stall.image ? (
                  <img
                    src={stall.image}
                    alt={stall.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    暂无图片
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {stall.name}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
                
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {stall.description}
                </p>
                
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{stall.avgRating}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-500">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{stall.totalReviews}</span>
                  </div>
                  
                  {!stall.isActive && (
                    <Badge variant="secondary" className="text-xs">休息中</Badge>
                  )}
                </div>
                
                {stall.cafeteria && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {stall.cafeteria.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
