// Flat config para ESLint v9+
import tseslint from 'typescript-eslint';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  // Configuração recomendada SEM type-check para evitar necessidade de project parsing em cada arquivo
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    plugins: {
      import: eslintPluginImport,
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
    rules: {
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
  // Regras que não exigem type-check
    },
    ignores: ['dist/**', 'node_modules/**', '.husky/**'],
  },
];
