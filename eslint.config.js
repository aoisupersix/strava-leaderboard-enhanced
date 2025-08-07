const js = require('@eslint/js')
const typescript = require('typescript-eslint')
const prettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = typescript.config(
  // Apply recommended configs
  js.configs.recommended,
  ...typescript.configs.recommended,
  prettierConfig,

  // Global configuration
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        node: true,
        es6: true,
        browser: true,
        chrome: true,
      },
    },
    rules: {
      semi: 'off',
      'prettier/prettier': 'error',
    },
  },

  // Ignore patterns (replacing .eslintignore)
  {
    ignores: ['dist/**/*', 'webpack/**/*', 'node_modules/**/*', '*.config.js'],
  }
)
