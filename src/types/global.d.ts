// Global type declarations for the application

declare global {
  interface Window {
    /**
     * Caches sidebar collapsed state in browser environment
     * to prevent initial value flicker when component remounts
     */
    __sidebarCollapsed?: boolean;
  }

  interface HTMLVideoElement {
    /**
     * HLS.js instance for video streaming
     */
    hls?: any;
  }
}

// This file needs to be treated as a module
export {};
