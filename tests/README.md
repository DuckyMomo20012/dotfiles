# tests

Unit tests of [`lib/`](../lib/README.md), run with bun's test runner:

```bash
bun test                      # all
bun test tests/files          # one file (name filter)
bun test --test-name-pattern "backup"
```

| File              | Covers                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `files.test.ts`   | `linkFile`, `symlinkDotfileDir` (backup, `--no-backup`, repeated runs, binary files, dry run), `appendUniqueLine`, `backupFile`, `mergeDir` |
| `shellrc.test.ts` | `appendToShellRc`, `cobraCompletion` (same lines the old scripts wrote)                                                                     |
| `runner.test.ts`  | Discovery, order, `ignores`/`only`/`priority`, `runMainSetupOnly`, failures, `keepGoing`                                                    |
| `config.test.ts`  | The global switches                                                                                                                         |
| `helpers.ts`      | `makeSandbox()`: a temp directory with `write()`, `path()` and `cleanup()`                                                                  |

Rules for new tests:

- Work inside `makeSandbox()`; never use the real `$HOME`. When a helper reads
  `HOME`, set `process.env.HOME` in `beforeEach` and restore it in `afterEach`.
- Do not call helpers that change the system without a dry run.
- The file names must not end in `setup.ts` (those are executed by the
  bootstrap).
- Test the second run: a helper that is meant to be idempotent needs a test that
  runs it twice and checks that nothing changed.
