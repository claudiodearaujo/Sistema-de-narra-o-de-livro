import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        crypto: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        btoa: 'readonly',
        TextEncoder: 'readonly',
        URLSearchParams: 'readonly',
        Uint8Array: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        prompt: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      // TypeScript already resolves symbols/types; this rule causes false positives on TS type names.
      'no-undef': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts'],
  },
];
