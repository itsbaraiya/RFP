//
// File URL Utility
// Handles file URLs for different environments (local, Render, AWS S3)
//

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5001/api";
const BACKEND_URL = BASE_URL.replace("/api", "");

/**
 * Get the full URL for accessing a file
 * @param filePath - Path stored in database (e.g., "uploads/rfps/generated/file.pdf")
 * @returns Full URL to access the file
 */
export const getFileURL = (filePath: string | null | undefined): string | null => {
  if (!filePath) return null;

  // If it's already a full URL (http/https), return as is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // Remove leading slash if present
  let cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  // Remove "uploads/" prefix if present (database stores it with prefix)
  if (cleanPath.startsWith("uploads/")) {
    cleanPath = cleanPath.replace("uploads/", "");
  }

  // Construct URL
  // For Vercel deployment, use the /files proxy route
  // For local/dev, use direct backend URL
  if (import.meta.env.PROD && !BACKEND_URL.includes("localhost")) {
    // Production: Use Vercel proxy route
    return `/files/${cleanPath}`;
  } else {
    // Development: Use direct backend URL
    return `${BACKEND_URL}/api/uploads/${cleanPath}`;
  }
};

/**
 * Open file in new tab
 */
export const openFile = (filePath: string | null | undefined) => {
  const url = getFileURL(filePath);
  if (url) {
    window.open(url, "_blank");
  }
};

/**
 * Download file (forces download instead of opening in browser)
 */
export const downloadFile = async (filePath: string | null | undefined, fileName?: string) => {
  const url = getFileURL(filePath);
  if (!url) return;

  try {
    // Fetch the file as a blob to force download
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || filePath?.split("/").pop() || "download.pdf";
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download error:", error);
    // Fallback: try direct download (may open in browser for cross-origin)
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || filePath?.split("/").pop() || "download.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

