import {fileURLToPath} from 'node:url'

import js from '@eslint/js'
import {importX} from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import unusedImports from 'eslint-plugin-unused-imports'
import {defineConfig, globalIgnores} from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'import-x': importX,
      sonarjs,
      'unused-imports': unusedImports,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
        node: true,
      },
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/require-await': 'error',
      'no-console': ['warn', {allow: ['warn', 'error']}],
      'prefer-const': 'error',
      eqeqeq: 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-named-as-default': 'off',
      'sonarjs/no-collection-size-mischeck': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-gratuitous-expressions': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-inverted-boolean-check': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-use-of-empty-return-value': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/require-await': 'off',
    },
    languageOptions: {
      globals: globals.vitest,
    },
  },
  {
    files: ['vite.config.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
])
