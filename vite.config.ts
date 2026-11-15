import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Продакшн-збірка без https-адреси API мовчки б ходила на localhost (а ключ — відкритим текстом).
  if (mode === "production") {
    const url = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL ?? "";
    if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)) {
      throw new Error(
        "VITE_API_URL must be set to an https:// URL for a production build " +
          "(e.g. VITE_API_URL=https://your-backend.onrender.com npm run build).",
      );
    }
  }
  return { plugins: [react()], server: { port: 5173 } };
});
