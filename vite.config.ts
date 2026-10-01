import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const getBase = () => {
    if (process.env.BASE_PATH) {
      const b = process.env.BASE_PATH;
      return b.endsWith('/') ? b : `${b}/`;
    }
    if (process.env.GITHUB_REPOSITORY) {
      const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
      if (repoName && repoName.toLowerCase().endsWith('.github.io')) {
        return '/';
      }
      return `/${repoName}/`;
    }
    return './';
  };

  return {
    base: getBase(),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const norm = id.replace(/\\/g, '/');
            const inPkg = (name: string) => norm.includes(`/node_modules/${name}/`);
            if (inPkg('firebase') || inPkg('@firebase')) return 'vendor-firebase';
            if (inPkg('lucide-react')) return 'vendor-icons';
            if (inPkg('jspdf') || inPkg('jspdf-autotable') || inPkg('xlsx')) return 'vendor-utils';
            if (norm.includes('/src/pages/')) {
              const pageName = norm.split('/src/pages/')[1].split('.')[0].toLowerCase();
              return `page-${pageName}`;
            }
          },
        },
      },
    },
  };
});
