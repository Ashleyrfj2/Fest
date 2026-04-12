module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'web-build/',
    'coverage/',
    'supabase/.temp/',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/array-type': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-console': 'off',
  },
};
