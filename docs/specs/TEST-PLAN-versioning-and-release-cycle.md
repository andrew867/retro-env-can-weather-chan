# Test plan: versioning and release cycle

## Principles

- This plan validates consistency and process, not runtime code behavior.
- The policy docs should be usable before any live version change is made.
- Future automation should enforce the policy, but documentation comes first.

## Current checks to preserve

- `package.json` carries the canonical app version string.
- `CHANGELOG.md` remains the release-history source of truth.

## New / updated validation categories

### T1 — Policy clarity

| ID | Case | Assert |
|----|------|--------|
| T1.1 | Development line | Docs clearly state that even minor lines (example `2.6.x`) are the active development cycle |
| T1.2 | RC line | Docs clearly state the cutover example to `2.7.0-rc1` |
| T1.3 | Stable line | Docs clearly state that `2.7.x` is stable/LTS-style bugfix/security maintenance only |

### T2 — Consistency targets

| ID | Case | Assert |
|----|------|--------|
| T2.1 | Version source of truth | Docs identify `package.json` and `CHANGELOG.md` as the required sync points |
| T2.2 | RC naming | Docs specify `-rcN` prerelease format |
| T2.3 | Next cycle | Docs specify that the next active development line after `2.7.x` would be `2.8.x` |

### T3 — Future implementation readiness

| ID | Case | Assert |
|----|------|--------|
| T3.1 | Patch bump readiness | Maintainers can identify when to apply `2.6.4`-style bumps without rewriting the policy |
| T3.2 | RC readiness | Maintainers can identify when to cut `2.7.0-rc1` |
| T3.3 | Automation readiness | Docs identify likely future enforcement points (`CHANGELOG.md`, `package.json`, `.release-it.json`, CI) |

## Manual review checklist

- Read the spec and confirm it matches intended project behavior
- Confirm the plan does not require immediate version changes
- Confirm the policy can be implemented later without rethinking the structure

## Definition of done

- T1–T3 are satisfied by the docs
- Maintainers can defer implementation safely until after the current visual/authenticity tranche

## Related docs

- [SPEC-versioning-and-release-cycle.md](./SPEC-versioning-and-release-cycle.md)
- [PLAN-versioning-and-release-cycle.md](./PLAN-versioning-and-release-cycle.md)
