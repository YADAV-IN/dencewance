import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";

const getAppVersion = () => {
  const major = 6388;
  const baseMinor = 1;
  const baseVersionCommit = "25bbd5f";
  try {
    if (!/^[a-f0-9]{7,40}$/i.test(baseVersionCommit)) return "6388.01";
    const commitDelta = Number(execSync(`git rev-list --count ${baseVersionCommit}..HEAD`).toString().trim());
    const minor = baseMinor + Math.max(commitDelta, 0);
    return `${major}.${String(minor).padStart(2, "0")}`;
  } catch {
    return "6388.01";
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(getAppVersion()),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
