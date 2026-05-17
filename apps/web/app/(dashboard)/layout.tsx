// FILE: apps/web/app/(dashboard)/layout.tsx
'use client';
import React from 'react';
import { useCopilotStore } from '@/lib/store/copilotStore';
import { NavigationSidebar } from '@/components/layout/NavigationSidebar';
import { Header } from '@/components/layout/Header';
import { CopilotSidebar } from '@/components/copilot/CopilotSidebar';
import { useHighlightEffect } from '@/lib/hooks/useHighlightEffect';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useHighlightEffect();
  
  return (
    <div className="flex h-screen w-full bg-muted/40 overflow-hidden">
      <NavigationSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:px-6 md:gap-8">
          {children}
        </main>
      </div>
      {/* Copilot Sidebar - now renders as fixed overlay */}
      <CopilotSidebar />
    </div>
  );
}