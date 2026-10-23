/// <reference types="vitest" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// "preview" mode builds one self-contained HTML file (for sharing a playable test build).
// The normal build is what Capacitor wraps into the iOS / Android apps.
export default defineConfig(({ mode }) => ({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: mode === 'preview' ? [preact(), viteSingleFile()] : [preact()],
  build: {
    outDir: mode === 'preview' ? 'dist-preview' : 'dist',
    target: 'es2020',
  },
  test: {
    environment: 'node',
  },
}));
