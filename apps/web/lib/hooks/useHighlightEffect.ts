// FILE: apps/web/lib/hooks/useHighlightEffect.ts
import { useEffect } from 'react';
import { useCopilotStore } from '../store/copilotStore';

/**
 * Enhanced React hook that listens for highlight commands from the Copilot store
 * and applies visual effects to multiple targeted UI elements simultaneously.
 */
export const useHighlightEffect = () => {
  const highlightedSelectors = useCopilotStore((state) => state.highlightedSelectors);
  const clearHighlights = useCopilotStore((state) => state.clearHighlights);

  useEffect(() => {
    // First, remove any existing highlights to avoid stale glows
    document.querySelectorAll('.glowing-highlight').forEach(el => {
      el.classList.remove('glowing-highlight');
    });

    if (highlightedSelectors.length > 0) {
      console.log(`Applying highlights to ${highlightedSelectors.length} elements:`, highlightedSelectors);
      
      const highlightedElements: HTMLElement[] = [];
      
      // Apply highlight to all selectors
      highlightedSelectors.forEach((selector, index) => {
        const element = document.getElementById(selector);
        if (element) {
          // Apply the highlight class
          element.classList.add('glowing-highlight');
          highlightedElements.push(element);
          
          // Scroll to the first element (primary focus)
          if (index === 0) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          console.log(`Highlighted element: ${selector}`);
        } else {
          console.warn(`Element not found: ${selector}`);
        }
      });

      // Automatically clear all highlights after 4 seconds
      const timer = setTimeout(() => {
        console.log('Auto-clearing highlights');
        clearHighlights();
      }, 4000);

      // Cleanup function to clear the timer
      return () => {
        clearTimeout(timer);
        // Remove highlights when component unmounts or selectors change
        highlightedElements.forEach(el => {
          el.classList.remove('glowing-highlight');
        });
      };
    }
  }, [highlightedSelectors, clearHighlights]); // Runs when highlightedSelectors array changes
};