// FILE: apps/web/components/layout/NavigationSidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bot,
  Settings,
  LayoutGrid,
  LineChart,
  Building,
  BarChartHorizontal,
} from 'lucide-react';
import { useCopilotStore } from '@/lib/store/copilotStore';

export function NavigationSidebar() {
  const pathname = usePathname();
  const { toggleCopilot } = useCopilotStore();
  
  const routes = [
    { href: '/', label: 'Overview', icon: LayoutGrid, active: pathname === '/' },
    { href: '/retrospect', label: 'Retrospect', icon: LineChart, active: pathname === '/retrospect' },
    { href: '/building', label: 'Building', icon: Building, active: pathname === '/building' },
    { href: '/demand', label: 'Demand', icon: BarChartHorizontal, active: pathname === '/demand' },
  ];

  return (
    <aside className="hidden w-14 flex-col border-r bg-background sm:flex z-20">
      <TooltipProvider delayDuration={200}>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <button
            onClick={toggleCopilot}
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base hover:scale-110 transition-transform"
          >
            <Bot className="h-4 w-4" />
            <span className="sr-only">NODA Copilot</span>
          </button>
          
          {routes.map((route) => (
            <Tooltip key={route.href}>
              <TooltipTrigger asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    route.active && "bg-accent text-accent-foreground"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  <span className="sr-only">{route.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                {route.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Settings
            </TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}