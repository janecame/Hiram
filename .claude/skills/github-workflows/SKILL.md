# /github-workflows

Reference for how Hiram ships code through GitHub Actions: the branch strategy, the three
workflows, and the full commit-to-production lifecycle. Use this when adding, editing, or
reasoning about anything in `.github/workflows/`.

> Scope: GitHub Actions + branching only. The AWS deploy targets (Elastic Beanstalk, S3,
> CloudFront, RDS), their secrets, and infra gaps live in the separate AWS deployment
> skill — do not duplicate them here.

## When to use

- Adding or modifying a workflow in `.github/workflows/`
- Adding a trigger or gate to a branch (e.g. a required check)
- Explaining or debugging why a workflow did or did not run
- Onboarding: understanding how a change reaches production

## 1 — Branch model

```
feature/*, experiment/*        disposable work branches
        |  merge when ready
        v
pre-master-branch              PRE-DEPLOYMENT (staging): integrate + test everything
        |  PR when stable
        v
master                         PRODUCTION: merging here auto-deploys to AWS
```

Two branches matter: `pre-master-branch` (safe place to integrate and test) and `master`
(production — a merge here ships to real users). Feature/experiment branches are
disposable and always feed into `pre-master-branch` first, never directly into `master`.

## 2 — The three workflows

All live in `.github/workflows/`.

| Workflow | Trigger | Path filter | What it does | Purpose |
|---|---|---|---|---|
| `ci-pre-master.yml` | `push -> pre-master-branch` | none (builds everything) | `npm ci` -> `npm run build` -> `npm run lint` | Verify staging stays green |
| `deploy-backend.yml` | `push -> master` | `backend/**` | `npm ci` -> build backend -> zip `dist/`+`package.json`+`Procfile` -> deploy | Ship backend |
| `deploy-frontend.yml` | `push -> master` | `frontend/**` | `npm ci` -> `vite build` -> sync `dist/` -> invalidate CDN | Ship frontend |

Core rule — **filter on deploy, do not filter on verify**:

- Deploy workflows are path-filtered so a frontend-only change never redeploys the
  backend (and vice-versa).
- The CI check is unfiltered — it always builds BOTH workspaces, because the frontend and
  backend share types by manual sync, so a "frontend" change can break the backend build.
  A gate must check everything.

## 3 — End-to-end lifecycle

```
1. Dev branches off pre-master -> feature/x
2. Opens PR -> pre-master-branch, merges
3. push to pre-master-branch
     -> ci-pre-master.yml runs: build + lint
          green -> staging is trustworthy, test the app here
          red   -> fix before relying on staging
4. When staging is solid: PR pre-master-branch -> master
5. merge -> push to master
     -> deploy-backend.yml   (if backend/** changed)
     -> deploy-frontend.yml  (if frontend/** changed)
6. Live in production
```

## Conventions when editing workflows

- **Node version**: `"22"` with `cache: "npm"` — match the existing workflows.
- **Actions**: `actions/checkout@v4`, `actions/setup-node@v4`.
- **Install**: always `npm ci` (clean, lockfile-exact) — never `npm install` in CI.
- **Monorepo**: `npm run build` at the root builds both workspaces; scope with
  `npm run build --workspace=frontend|backend` when a job targets only one.
- **Verify vs deploy**: verify jobs (CI) stay unfiltered; deploy jobs stay path-filtered.
- **Name jobs** clearly — a job's name is what branch protection later requires as a
  status check.
- **No secrets in CI checks**: build/lint need none; only deploy workflows use AWS secrets.

## How to add a required gate to master (Phase 2, not yet done)

1. Add a `pull_request` trigger targeting `master` to the CI workflow.
2. In GitHub -> Settings -> Branches -> add a rule for `master` -> Require status checks
   to pass before merging -> select the CI job.
3. The workflow reports pass/fail; the branch rule is what actually locks the merge
   button. Both are required — a workflow alone does not block.

## Rules

- Keep AWS deploy internals (targets, secrets, invalidation, RDS) OUT of this skill —
  defer to the AWS deployment skill.
- Never widen a deploy trigger beyond `master` without an explicit reason.
- Never auto-push or auto-merge; branch protection and human review gate production.
- When changing a workflow, state which branch/trigger is affected and whether it runs on
  verify (all branches of interest) or deploy (master only).
