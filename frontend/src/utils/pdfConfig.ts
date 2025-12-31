//
// PDF Configuration Utility
//

import jsPDF from "jspdf";

/**
 * Create a jsPDF instance with worker disabled to avoid "fake worker" warnings
 * This prevents functionality issues that can occur when jsPDF can't load its worker
 */
export const createPDF = (): jsPDF => {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    compress: true,
  });

  try {
    if (typeof window !== "undefined") {
      const originalWarn = console.warn;
      console.warn = (...args: any[]) => {
        if (args[0]?.includes?.("fake worker") || args[0]?.includes?.("Setting up fake worker")) {
          return;
        }
        originalWarn.apply(console, args);
      };
      
      setTimeout(() => {
        console.warn = originalWarn;
      }, 100);
    }
  } catch (e) {
  }

  return doc;
};

