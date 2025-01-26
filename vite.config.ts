import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      components: path.resolve(__dirname, "./src/components"),
      lib: path.resolve(__dirname, "./src/lib"),
      types: path.resolve(__dirname, "./src/types"),
      contexts: path.resolve(__dirname, "./src/contexts"),
      hooks: path.resolve(__dirname, "./src/hooks"),
    },
    // Ensure all extensions are handled
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    // Add fallback directories
    modules: [
      path.resolve(__dirname, "src"),
      path.resolve(__dirname, "node_modules"),
    ],
  },
  build: {
    // Improve path resolution during build
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "lucide-react",
          ],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
        },
      },
    },
    // Ensure source files are properly resolved
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== "production",
  },
  server: {
    host: "0.0.0.0",
    // Improve dev server configuration
    fs: {
      // Allow serving files from project root
      allow: [".."],
    },
    watch: {
      // Use polling in environments that require it
      usePolling: true,
      interval: 100,
    },
    // Add proper headers
    headers: {
      "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
