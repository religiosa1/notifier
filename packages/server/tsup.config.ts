import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./index.ts'],
	target: "node22",
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  format: ["esm"],
})
