// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    formatters: true,
    ignores: [
      // eslint ignore globs here
    ],
  },
  {
    rules: {
      'antfu/no-top-level-await': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': 'off',
    },
  },
)
