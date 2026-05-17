// FILE: apps/web/components/copilot/CopilotSidebar.tsx
'use client';
import { AICopilot } from './AICopilot';
import { Button } from '@/components/ui/button';
import { Bot, X, GripVertical } from 'lucide-react';
import { useCopilotStore } from '@/lib/store/copilotStore';
import { useState, useRef, useEffect } from 'react';

export function CopilotSidebar() {
  const { toggleCopilot, isOpen } = useCopilotStore();
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const minWidth = 300;
  const maxWidth = 800;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (sidebarRef.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      className="fixed right-0 top-0 bottom-0 animate-in slide-in-from-right duration-300"
      style={{ 
        width: `${width}px`,
        zIndex: 9999 // Maximum z-index
      }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-gray-700 hover:bg-rose-500 cursor-ew-resize transition-all"
        style={{ zIndex: 10000 }}
        onMouseDown={() => setIsResizing(true)}
      >
        <GripVertical className="w-4 h-4 text-gray-400 absolute left-0 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100" />
      </div>

      {/* Solid backdrop - this MUST be opaque */}
      <div 
        className="absolute inset-0 ml-1"
        style={{ 
          backgroundColor: '#0a0a0a',
          zIndex: 9998
        }}
      >
        {/* Sidebar Content */}
        <div className="h-full w-full flex flex-col border-l border-gray-800 shadow-2xl">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-gray-800 px-4 lg:h-[60px] lg:px-6 flex-shrink-0 bg-[#0a0a0a]">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Bot className="h-6 w-6" />
              <span>Copilot</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCopilot}
              className="hover:bg-gray-800 text-white"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close Copilot</span>
            </Button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden p-4 bg-[#0a0a0a]">
            <AICopilot />
          </div>
        </div>
      </div>
    </div>
  );
}