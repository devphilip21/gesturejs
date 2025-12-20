import { resolve } from 'node:path';
import type { UserConfig } from 'vite';

export default ({ dirname }: { dirname: string }): UserConfig => ({
  build: {
    lib: {
      entry: {
        index: resolve(dirname, 'src/index.ts'),
        'core/index': resolve(dirname, 'src/core/index.ts'),
        'single-pointer/index': resolve(dirname, 'src/single-pointer/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ['@gesturejs/stream'],
    },
  },
});
