// Global type declarations for the application

declare global {
  // interface Window {}

  interface HTMLVideoElement {
    /**
     * HLS.js instance for video streaming
     */
    hls?: any;  
  }
}

// This file needs to be treated as a module
export {};
