'use client';

import React from 'react';
import MouraSidebar from '@/components/MouraSidebar';
import { MouraProvider } from '@/contexts/MouraContext';

export default function MouraSystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <MouraProvider>
      <div className="flex">
        <MouraSidebar />
        <div className="flex-1 ml-64">
          {children}
        </div>
      </div>
    </MouraProvider>
  );
}
