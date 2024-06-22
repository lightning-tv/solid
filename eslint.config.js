import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.js'],
    ...eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    rules: {
      // Allow us to write async functions that don't use await
      // Intresting commentary on this: https://github.com/standard/eslint-config-standard-with-typescript/issues/217
      '@typescript-eslint/require-await': 'off',
      // Temporary relaxed rules while we tighten up our TypeScript code
      // TODO: Remove these rules once we eliminate all of the unnecessary `any` types in the code
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
