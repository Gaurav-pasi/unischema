import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/backend/index': 'src/adapters/backend/index.ts',
    'adapters/frontend/index': 'src/adapters/frontend/index.ts',
    // Granular validator exports for tree-shaking
    'validators/index': 'src/validators/index.ts',
    'validators/string': 'src/validators/string/index.ts',
    'validators/number': 'src/validators/number/index.ts',
    'validators/date': 'src/validators/date/index.ts',
    'validators/array': 'src/validators/array/index.ts',
    'validators/object': 'src/validators/object/index.ts',
    'validators/common': 'src/validators/common/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true, // Enable code splitting for better tree-shaking
  sourcemap: false, // Disable sourcemaps for smaller bundle size
  clean: true,
  treeshake: true,
  minify: false, // Can enable in production if needed
});
