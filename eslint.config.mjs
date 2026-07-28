import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import next from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  {ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'dist/**', 'public/**']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {'@next/next': next},
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  /* CommonJS config files. */
  {
    files: ['postcss.config.js', 'tailwind.config.ts'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];