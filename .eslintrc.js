module.exports = {
  env: {
    es6: true,
    node: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    'jest/global': true,
  },
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb-base',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.prod.json'],
  },
  plugins: ['@typescript-eslint', 'jest'],
  rules: {
    // switch 文での prettier との競合を防ぐ
    indent: [2, 2, { SwitchCase: 1 }],
    'lines-between-class-members': 0,
    'no-console': 0,

    /**
     * eslint-plugin-import
     */
    'import/extensions': [
      2,
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
        json: 'never',
      },
    ],
    'import/no-unresolved': [0],
    'import/no-extraneous-dependencies': [1, { devDependencies: true }],
    'import/prefer-default-export': 0,

    /**
     * eslint と @typescript-eslint 競合を防ぐ
     */
    // typescript-eslint の no-use-before-define を有効にする
    'no-use-before-define': 0,
    '@typescript-eslint/no-use-before-define': 2,
    // typescript-eslint の no-unused-vars を有効にする
    'no-unused-vars': 0,
    '@typescript-eslint/no-unused-vars': 2,
    // TODO: あとで消す
    'class-methods-use-this': 0,
    'no-undef': 0,
    'arrow-body-style': 0,
  },
};
