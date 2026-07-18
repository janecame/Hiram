# Git Workflow Rules

## Branch flow

```
feature branch  →  PR into pre-master-branch  →  PR into master
```

- Never push directly to `pre-master-branch` or `master` — both block direct pushes entirely.
- All work lands on `pre-master-branch` first. `master` only ever merges from `pre-master-branch`, never from a feature branch directly (enforced by the `Guard Master Source` check).

## Active GitHub rulesets

Source of truth: `https://github.com/janecame/Hiram/settings/rules`. Re-check there if a push fails unexpectedly — rules can change.

### `Protect pre-master-branch` (targets `pre-master-branch`)
- Restrict deletions
- Require a pull request before merging
- Require review from Code Owners (see CODEOWNERS below)
- Require status checks to pass — `Build & Lint`
- Block force pushes

### `Only pre-master-branch into master` (targets `master`)
- Restrict deletions
- Require a pull request before merging
- Require status checks to pass
- Block force pushes
- Enforced by `.github/workflows/guard-master-source.yml`, which fails any PR into `master` whose source branch isn't literally `pre-master-branch`

### `master-protection` (targets `master`)
- Restrict deletions
- Require status checks to pass — `Build & Lint`
- Block force pushes

## CODEOWNERS

`.github/CODEOWNERS`: `@janecame` must approve any PR touching `.github/**` (CI workflows, CODEOWNERS itself, repo config). Only enforced because `Protect pre-master-branch` has "Require review from Code Owners" on.

## CI trigger coverage

`.github/workflows/ci-pre-master.yml` ("Build & Lint") runs on:
- `push` to `pre-master-branch`
- `pull_request` into `pre-master-branch` or `master`

Because required-status-check evaluation for a PR uses the workflow file as it exists on the **base branch**, a trigger added only on a feature branch does nothing until that change is already merged into the base. If a required check ever seems impossible to satisfy, this is the first thing to check.

## Standard change flow

1. Branch off `pre-master-branch`: `git checkout -b my-feature`
2. Push the branch, open a PR into `pre-master-branch`
3. Wait for `Build & Lint` to pass (and Code Owners approval if `.github/**` changed)
4. Merge the PR
5. When ready to ship, open a PR from `pre-master-branch` into `master` — the PR title/source is auto-checked by `Guard Master Source`
6. Merge once `Build & Lint` passes

## Bootstrapping exception

If a workflow-trigger fix itself can't pass its own required check (chicken-and-egg — see above), a repo admin can use **"Merge without waiting for requirements to be met"** on the PR page to land it once. Re-verify normal flow works on the next PR before relying on it again.