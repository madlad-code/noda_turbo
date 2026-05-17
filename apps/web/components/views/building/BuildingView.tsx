'use client';

import { useHighlightEffect } from '@/lib/hooks/useHighlightEffect';

export default function BuildingView() {
  // Add the highlighting hook
  useHighlightEffect();
  
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Building</h1>
      <p className="mt-4 text-muted-foreground">
        Building details page - coming soon with highlighting support!
      </p>
    </div>
  );
}