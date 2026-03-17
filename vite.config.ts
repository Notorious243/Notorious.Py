import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dnd',
      'react-dnd-html5-backend',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
    exclude: ['lucide-react'],
  },
  
  // Warm-up des fichiers critiques
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/pages/Index.tsx',
        './src/contexts/WidgetContext.tsx',
        './src/contexts/DragContext.tsx',
      ],
    },
  },
  
  // Optimisation du build
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Drag and Drop
          'dnd': ['react-dnd', 'react-dnd-html5-backend'],
          
          // UI Components - Radix UI
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-accordion',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator',
          ],
          
          // Animations
          'animations': ['framer-motion'],
          
          // Icons
          'icons': ['lucide-react', '@radix-ui/react-icons'],
          
          // Syntax Highlighting
          'syntax-highlighter': ['react-syntax-highlighter'],
          
          // Form & Validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Theme
          'theme': ['next-themes'],
          
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          
          // Toast notifications
          'toast': ['sonner'],
          
          // Utils
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },
});
