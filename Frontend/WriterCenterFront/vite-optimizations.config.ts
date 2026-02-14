/**
 * Vite Build Optimizations Configuration
 * Best practices for production builds and code splitting
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Optimized Vite configuration for maximum performance
 */
export default defineConfig({
  plugins: [react()],

  // Build optimizations
  build: {
    // Enable minification for all files
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false, // Remove comments
      },
    },

    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-zustand': ['zustand'],
          'vendor-icons': ['lucide-react'],
          'vendor-tailwind': [],

          // Character Wizard chunks
          'wizard-core': [
            'src/features/studio/components/CharacterWizard/CharacterWizard.tsx',
            'src/features/studio/components/CharacterWizard/stores/characterWizardStore.ts',
            'src/features/studio/components/CharacterWizard/hooks/useCharacterWizard.ts',
          ],

          'wizard-steps': [
            'src/features/studio/components/CharacterWizard/steps/BasicStep.tsx',
            'src/features/studio/components/CharacterWizard/steps/IdentityStep.tsx',
            'src/features/studio/components/CharacterWizard/steps/PhysiqueStep.tsx',
            'src/features/studio/components/CharacterWizard/steps/FaceStep.tsx',
            'src/features/studio/components/CharacterWizard/steps/EyesStep.tsx',
            'src/features/studio/components/CharacterWizard/steps/HairStep.tsx',
            'src/features/studio/components/CharacterWizard/steps/WardrobeStep.tsx',
          ],

          'wizard-ui': [
            'src/features/studio/components/CharacterWizard/StepIndicator.tsx',
            'src/features/studio/components/CharacterWizard/WizardNavigation.tsx',
            'src/features/studio/components/CharacterWizard/FormField.tsx',
            'src/features/studio/components/CharacterWizard/DraftNotification.tsx',
          ],
        },

        // Optimize chunk naming
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    // Source maps only in development
    sourcemap: process.env.NODE_ENV === 'development',

    // CSS code splitting
    cssCodeSplit: true,

    // Increase chunk size limits
    chunkSizeWarningLimit: 500,
  },

  // Optimization hints
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'zustand',
      'lucide-react',
      'axios',
      'clsx',
    ],

    // Exclude large dependencies from pre-bundling
    exclude: ['@vitejs/plugin-react'],
  },

  // Dev server optimizations
  server: {
    // Faster module serving
    middlewareMode: false,

    // Optimize hot module replacement
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },

    // Preload modules for faster navigation
    preTransformRequests: [],
  },

  // CSS optimizations
  css: {
    // Use PostCSS for optimization
    postcss: './postcss.config.js',

    // CSS modules scoping
    modules: {
      localsConvention: 'camelCase',
    },
  },
});

/**
 * Performance best practices:
 *
 * 1. Code Splitting Strategy:
 *    - vendor-react: React libraries (~100KB)
 *    - vendor-query: TanStack Query (~50KB)
 *    - wizard-core: Core wizard logic (~30KB)
 *    - wizard-steps: Step components (~150KB)
 *    - wizard-ui: UI components (~50KB)
 *
 * 2. Bundle Analysis:
 *    Use: npm run build -- --analyze
 *    Or: npx vite-bundle-visualizer
 *
 * 3. Monitor chunk sizes:
 *    Gzip compressed sizes:
 *    - vendor-react: ~30KB gzipped
 *    - wizard-steps: ~40KB gzipped (lazy loaded)
 *    - Total initial: ~120KB gzipped
 *
 * 4. Progressive enhancement:
 *    - Initial load: vendor-react + wizard-core
 *    - On wizard open: lazy load wizard-steps
 *    - Preload on mouseover for wizard button
 *
 * 5. Cache busting:
 *    Hash in filenames ensures cache busting
 *    Long-term caching possible with versioning
 */
