// Lint = the frontend's second gate next to `tsc -b --noEmit`. The
// react-hooks rules catch the bug class TypeScript cannot: stale closures
// and missing effect dependencies. Where the code intentionally departs
// from a rule (the typewriter effect), the inline eslint-disable comment
// names it — this config is what makes those comments enforceable.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Destructuring to EXCLUDE a prop before spreading the rest is
      // idiomatic ({ node, ...props }) — don't flag the excluded name.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
);
