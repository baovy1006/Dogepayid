import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import componentTagger from "./plugins/component-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    hmr: {
      overlay: false,
      timeout: 15000,
    },
    watch: {
      usePolling: true,
      interval: 500,
      binaryInterval: 500,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
