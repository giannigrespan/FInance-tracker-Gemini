import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Use '.' instead of process.cwd() to avoid type errors when Node types are missing.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Fallback to empty string to prevent undefined errors in bundle
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});