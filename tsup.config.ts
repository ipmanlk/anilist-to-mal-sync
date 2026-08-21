import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { cli: 'src/cli/index.ts' },
  format: ['esm'],
  target: 'node24',
  dts: false,
  splitting: false,
  shims: false,
  clean: true,
  sourcemap: true,
  minify: false,
  banner: { js: '#!/usr/bin/env node' },
})
