import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import importPlugin from 'eslint-plugin-import'
import jsxAccessibility from 'eslint-plugin-jsx-a11y'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        React: 'readonly',
        toast: 'readonly',
        axios: 'readonly',
        format: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': react,
      'import': importPlugin,
      'jsx-a11y': jsxAccessibility,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxAccessibility.configs.recommended.rules,

      // Possible Errors
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
      }],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      
      // Best Practices
      'no-throw-literal': 'error',
      'no-unneeded-ternary': 'error',
      'prefer-object-spread': 'error',
      'yoda': 'error',
      
      // React Specific
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-is-mounted': 'error',
      'react/no-unknown-property': 'error',
      'react/react-in-jsx-scope': 'error',
      'react/require-render-return': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      
      // Import/Export
      'import/order': ['error', {
        'newlines-between': 'always',
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      }],
      'import/no-unresolved': 'error',
      'import/no-webpack-loader-syntax': 'error',
      'import/no-duplicates': 'error',
      'import/export': 'error',
      'import/first': 'error',
      'import/namespace': ['error', { allowComputed: true }],
      'import/default': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-deprecated': 'warn',
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: ['**/*.test.js', '**/*.spec.js'],
        optionalDependencies: false,
        peerDependencies: false,
      }],
      'import/no-mutable-exports': 'error',
      'import/no-commonjs': 'error',
      'import/no-amd': 'error',
      'import/no-nodejs-modules': 'error',
      'import/unambiguous': 'error',
      'import/no-internal-modules': 'error',
      'import/no-relative-packages': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-import-module-exports': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': ['warn', { maxDepth: '∞' }],
      'import/no-useless-path-segments': 'error',
      'import/no-unused-modules': ['error', { unusedExports: true }],
      
      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]