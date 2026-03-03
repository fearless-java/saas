'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Cafeteria {
  id: string;
  name: string;
}

export function CafeteriaTabs({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { data: cafeterias, isLoading } = useQuery<Cafeteria[]>({
    queryKey: ['cafeterias'],
    queryFn: async () => {
      const res = await fetch('/api/cafeterias');
      const json = await res.json();
      return json.data;
    },
  });

  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (cafeterias?.length && !activeId) {
      setActiveId(cafeterias[0].id);
      onSelect(cafeterias[0].id);
    }
  }, [cafeterias, activeId, onSelect]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    onSelect(id);
  };

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-4 px-4 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!cafeterias?.length) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex overflow-x-auto scrollbar-hide">
        {cafeterias.map((cafeteria) => (
          <button
            key={cafeteria.id}
            onClick={() => handleSelect(cafeteria.id)}
            className={cn(
              "relative px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors",
              activeId === cafeteria.id
                ? "text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {cafeteria.name}
            {activeId === cafeteria.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
