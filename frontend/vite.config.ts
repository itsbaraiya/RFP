import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      "/files": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/files/, "/api/uploads"),
      },
    },
  },

  optimizeDeps: {
    exclude: ["jspdf"],
  },

  worker: {
    format: "es",
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom", "react-bootstrap", "framer-motion"],
          lottie: ["lottie-react", "lottie-web"],
          chart: ["recharts", "tsparticles", "react-tsparticles", "tsparticles-preset-links"],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
