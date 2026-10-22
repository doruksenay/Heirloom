/// <reference types="vitest" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "preview" mode builds one self-contained HTML file (for sharing a playable test build).
// The normal build is what Capacitor wraps into the iOS / Android apps.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'preview' ? [preact(), viteSingleFile()] : [preact()],
  build: {
    outDir: mode === 'preview' ? 'dist-preview' : 'dist',
    target: 'es2020',
  },
  test: {
    environment: 'node',
  },
}));
