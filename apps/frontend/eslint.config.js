import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import tseslint from 'typescript-eslint'
import i18next from 'eslint-plugin-i18next'
import { FlatCompat } from '@eslint/eslintrc'
import { globalIgnores } from 'eslint/config'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const reactConfig = {
  settings: {
    react: {
      version: '19.1.1',
    },
  },
}

export default tseslint.config([
  globalIgnores(['dist', '*.cjs', '**/*.cjs']),
  reactConfig,
  ...compat.extends(
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: '19.1.1',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      sonarjs,
      i18next,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'react-refresh/only-export-components': ['error', { allowExportNames: ['useAuth'] }],
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          ignoreAttribute: ['to', 'className', 'id', 'key', 'aria-hidden', 'aria-current', 'data-*', 'value', 'type', 'src', 'href'],
        },
      ],
      // Allow inline styles for dynamic content (virtualization, progress bars, etc.)
      'react/forbid-dom-props': 'off',
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // SonarJS rules
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
    },
  },
])
