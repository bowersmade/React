import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'build', 'node_modules', 'scripts/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // `eslint-plugin-react-hooks` v7 ships a much larger React-Compiler
      // readiness ruleset under `recommended-latest` (immutability, purity,
      // set-state-in-effect, ...). Scoped down to the two classic rules —
      // rules-of-hooks and exhaustive-deps — since those are what was asked
      // for; the rest would flag real effects across the app that aren't
      // being touched right now.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Console output is how this app surfaces cache/perf debugging info
      // (see useDescriptions, build-data.js) — warn instead of ban.
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Plain JS config files run under Node, not the browser.
    files: ['*.config.js', '*.config.ts', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  }
);
