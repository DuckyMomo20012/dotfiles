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
      //
      // Code blocks in Markdown are examples, not project code: they contain
      // `...`, partial snippets and several statements per line, and have no
      // tsconfig. The Markdown itself is still formatted.
      '**/*.md/**',
      '**/*.mdx/**',
    ],
  },
  {
    rules: {
      'antfu/no-top-level-await': 'off',
      'no-console': 'off',
      // NOTE: Too strict for this project: `if (process.env.X)` and
      // `if (name)` on strings are idiomatic in scripts.
      'ts/strict-boolean-expressions': 'off',
    },
  },
  {
    // NOTE: bun's `expect(...).rejects` is typed as a non-thenable, and
    // matchers such as `expect.arrayContaining` return `any`.
    files: ['tests/**/*.ts'],
    rules: {
      'ts/await-thenable': 'off',
      'ts/no-unsafe-argument': 'off',
    },
  },
  {
    // NOTE: Rules that need type information only work on files parsed by
    // @typescript-eslint/parser. Without `files`, they also ran on YAML, JSON
    // and Markdown files and crashed ESLint ("requires type information").
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
)
