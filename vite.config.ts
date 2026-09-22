import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites under /<repo>/; the deploy workflow sets
// BASE_PATH accordingly. Local dev and plain builds stay at the root.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
