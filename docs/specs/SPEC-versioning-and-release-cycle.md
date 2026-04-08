# Specification: versioning and release cycle

## Goal

Define a predictable versioning model for ongoing development, release candidates, and stable maintenance without coupling it to the current visual/authenticity tranche.

## Current baseline

- `package.json` currently carries a single semver value (`2.6.3` at time of writing).
- `CHANGELOG.md` is the authoritative release history.
- `.release-it.json` exists, but current workflow is manual/controlled rather than a fully automated public release flow.

## Versioning model

### Development cycle

- **Even minor versions** are the active **development cycle**.
- Example: **`2.6.x`** is the current development line.
- During a dev cycle, increment the **patch** number for ongoing work:
  - feature increments
  - reliability work
  - layout/authenticity passes
  - bug fixes
  - documentation updates tied to the in-flight cycle
- Example sequence:
  - `2.6.3`
  - `2.6.4`
  - `2.6.5`

### Release-candidate cycle

- When the current development line is considered feature-complete enough for release hardening, cut a **release candidate** on the **next odd minor** target.
- Example:
  - dev line: `2.6.x`
  - first RC: **`2.7.0-rc1`**
  - later RCs as needed: `2.7.0-rc2`, `2.7.0-rc3`, etc.

### Stable / LTS release

- The target stable release after the `2.6.x` dev cycle is **`2.7.0`**.
- Once `2.7.0` ships, the **`2.7.x`** line is treated as **stable / LTS-style maintenance**:
  - bug fixes
  - security fixes
  - low-risk operational patches
- No new major feature tranche should begin on the stable line.

### Next development cycle

- After `2.7.0` stabilizes, the next active development cycle begins on the next **even minor**, e.g. **`2.8.x`**.

## Rules

### R1 — Source of truth

- `package.json` version and `CHANGELOG.md` must agree before a release or public publish.

### R2 — Dev-cycle patch bumps

- While on the active development line (example `2.6.x`), bump patch versions freely for iterative work.

### R3 — RC naming

- RC builds use the semver prerelease form `X.Y.Z-rcN`.
- The first RC for the next stable release must start at `-rc1`.

### R4 — Stable-line scope

- After `X.Y.0` stable ships, `X.Y.Z` maintenance releases should be limited to bugfix/security/operational work unless an explicit exception is recorded.

### R5 — Changelog discipline

- `CHANGELOG.md` must clearly identify:
  - dev-cycle releases
  - RC releases
  - stable releases

## Recommended future automation

- Add a small documented release checklist before using `release-it` for public tagging.
- Consider a future CI check that blocks release commits when `package.json` and `CHANGELOG.md` are out of sync.

## Why this model is reasonable

- It gives the current branch room to move quickly (`2.6.x`) while preserving a clear “next stable target” (`2.7.0`).
- RC builds provide a natural freeze point without forcing the development line to stop early.
- Stable maintenance remains easy to explain to operators and contributors.

## Alternative worth considering later

- A more conventional model would keep all feature work on `2.7.0-alpha` / `beta` / `rc` and use patch-only for already-shipped lines.
- That is cleaner semver in a strict sense, but your proposed model is simpler for day-to-day development and easier to read operationally, so it is a reasonable project-local policy.

## Related docs

- [PLAN-versioning-and-release-cycle.md](./PLAN-versioning-and-release-cycle.md)
- [TEST-PLAN-versioning-and-release-cycle.md](./TEST-PLAN-versioning-and-release-cycle.md)
- [CHANGELOG.md](../../CHANGELOG.md)
