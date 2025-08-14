import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import i18next from 'eslint-plugin-i18next'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
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
    },
  },
])
