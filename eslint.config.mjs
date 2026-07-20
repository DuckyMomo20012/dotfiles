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
      'no-console': 'off',
    },
  },
)
