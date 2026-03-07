import {defineConfig} from 'eslint/config'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import globals from 'globals'

export default defineConfig([
  {
    files: ['src/**/*.{tsx,jsx}'],
    ignores: ['dist/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: globals.browser,
    },
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/jsx-no-constructed-context-values': 'error',
    },
  },
])
