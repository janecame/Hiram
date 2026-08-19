# Testing Rules

## Current state: tests exist and run

Both workspaces have a working test runner. Do not add a third framework.

| Workspace | Runner | Config | Command |
|---|---|---|---|
| `frontend` | Vitest 4 (+ `@vitest/ui`) | `vite.config.ts`, setup in `src/test/setup.ts` | `npm run test:fe` (or `npm run test` / `test:watch` in `frontend/`) |
| `backend` | Jest 30 + ts-jest | `backend/jest.config.js` | `npm run test:be` (or `npm test` in `backend/`) |

Run both from the repo root:

```bash
npm run test:fe      # vitest run
npm run test:be      # jest
```

Note: binaries are hoisted to the root `node_modules/.bin` by npm workspaces, so there is no
`backend/node_modules`. That is expected — it does not mean Jest is missing.

## Existing tests

- `frontend/src/test/format.test.ts` — formatter unit tests
- `frontend/src/test/setup.ts` — Vitest setup
- `backend/src/__tests__/item-types.test.ts` — asserts the `STATUSES` constant matches the `ItemStatus` union

Coverage is minimal — these are smoke tests, not a suite.

## What to test next

1. `frontend/src/api/items.ts` — filter + sort logic is close to pure and easy to unit test
2. `frontend/src/schemas/item-form.ts` — Zod edge cases (min/max, coercion, empty strings)
3. `backend/src/models/request.model.ts` — overlap-aware auto-decline is the highest-risk logic in the codebase
4. `useItems` / `useItem` hooks — with a mocked `QueryClient` and stubbed `api/items.ts`

React component tests would need React Testing Library, which is **not** currently installed — add it only when a component test is actually being written.

## Hook for running tests

`.claude/hooks/test-runner.sh` is an empty placeholder and is wired into no hook in `settings.json`.
Either wire it to `npm run test:fe && npm run test:be` or delete it — do not assume it runs.
