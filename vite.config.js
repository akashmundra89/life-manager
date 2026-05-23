import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path matches the GitHub repo name so assets resolve correctly on
// https://<user>.github.io/life-manager/. For Vercel/Netlify keep this '/'.
export default defineConfig({
  base: '/life-manager/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
