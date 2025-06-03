module.exports = {
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'script'
  },
  rules: {
    // Allow CommonJS in Lambda functions
    '@typescript-eslint/no-var-requires': 'off',
    'import/no-unresolved': 'off'
  }
}; 