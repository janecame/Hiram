# Testing Rules

## Current state

There are no tests. No test runner is installed. Do not add a test framework or write test files unless the user explicitly asks for it.

## When tests are added (future)

The expected stack based on the project's Vite + React + TypeScript setup:

- **Unit / component tests** — Vitest + React Testing Library
- **Hook tests** — `@testing-library/react` with a `QueryClientProvider` wrapper
- **API layer tests** — Vitest testing `src/api/items.ts` in isolation (no network, no browser)
- **E2E** — Playwright (likely Phase 2+, once a real backend exists)

## What to test first when tests land

1. `src/api/items.ts` — `listItems` filter + sort logic is pure business logic and easy to unit test
2. `src/schemas/item-form.ts` — Zod schema edge cases (min/max, coercion, empty strings)
3. `useItems` / `useItem` hooks — test with a mocked `QueryClient` and stub `api/items.ts`

## Hook for running tests

`.claude/hooks/test-runner.sh` exists but is currently empty. Wire it to `npm test` when a test script is added to `package.json`.