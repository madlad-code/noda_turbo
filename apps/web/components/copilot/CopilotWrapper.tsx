// FILE: apps/web/components/copilot/CopilotWrapper.tsx
"use client";
import React from 'react';
import { CopilotSidebar } from './CopilotSidebar';

/**
 * A simple wrapper component for the Copilot UI.
 * Its primary purpose is to provide a clean entry point for the Copilot feature.
 * All state management is now handled by the useCopilotStore.
 */
const CopilotWrapper: React.FC = () => {
  return (
    <>
      <CopilotSidebar />
    </>
  );
};

export default CopilotWrapper;