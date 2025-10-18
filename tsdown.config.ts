import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'browser',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
});
