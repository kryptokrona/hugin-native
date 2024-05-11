module.exports = {
  root: true,
  // extends: '@react-native',
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    '@react-native-community',
    'prettier',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  ignorePatterns: [
    '**/*/*.js',
    '*.js',
    '*.svg',
    '*.json',
    '*.png',
    '**/node_modules/**',
    'package.json',
    'package-lock.json',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'import',
    'react',
    'react-native',
    'prettier',
    'react-hooks',
    '@typescript-eslint',
    'promise',
    'unused-imports',
  ],
  env: {
    browser: true,
    node: true,
    es2021: true,
    'react-native/react-native': true,
  },
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],
    'max-len': ['error', 150],
    '@typescript-eslint/ban-ts-comment': 2,
    '@typescript-eslint/no-explicit-any': 1,
    'react-native/no-unused-styles': 2,
    'react-native/no-inline-styles': 1,
    '@typescript-eslint/no-empty-interface': 1,
    'react-hooks/rules-of-hooks': 2,
    'react-hooks/exhaustive-deps': 0,
    'prefer-destructuring': 2,
    'no-nested-ternary': 2,
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'import/no-unused-modules': 'error',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'react-native',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@*/*',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '**/*.+(ts|tsx|js|jsx)',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '.*/*',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'react-native'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'sort-imports': [
      'error',
      {
        allowSeparatedGroups: true,
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
      },
    ],
    'sort-keys-plus/sort-keys': 'warning',
    'unused-imports/no-unused-imports': 'warning',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        vars: 'all',
        varsIgnorePattern: '^_',
      },
    ],
  },
};
