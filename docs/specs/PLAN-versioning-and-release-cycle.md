# Phased plan: versioning and release cycle

**Status: planned**. This doc is preparatory only and is intentionally separate from the current VHS/layout tranche.

---

## Phase 1 — Document the policy

| # | Work item | Target files |
|---|-----------|--------------|
| **1.1** | Record the versioning model for active dev cycle, RCs, and stable/LTS maintenance | `docs/specs/SPEC-versioning-and-release-cycle.md` |
| **1.2** | Cross-check wording with current `package.json`, `CHANGELOG.md`, and `.release-it.json` | `package.json`, `CHANGELOG.md`, `.release-it.json` |

**Phase 1 exit criteria:** The policy is documented and understandable without changing the live version immediately.

---

## Phase 2 — Prepare implementation changes (later)

| # | Work item | Target files |
|---|-----------|--------------|
| **2.1** | Decide when to bump from current `2.6.x` patch to the next patch (example `2.6.4`) | `package.json`, `CHANGELOG.md` |
| **2.2** | Define the cutover point for `2.7.0-rc1` | `CHANGELOG.md`, release checklist docs |
| **2.3** | Define stable maintenance expectations for `2.7.x` | `CHANGELOG.md`, `OPERATORS.md` if needed |

**Phase 2 exit criteria:** The repo maintainers can apply the version policy cleanly when they are ready.

---

## Phase 3 — Optional tooling / automation

| # | Work item | Target files |
|---|-----------|--------------|
| **3.1** | Add a documented release checklist for manual or semi-automated releases | `OPERATORS.md` and/or a future release doc |
| **3.2** | Add consistency checks so release commits cannot drift between `package.json` and `CHANGELOG.md` | CI workflow and/or scripts |
| **3.3** | Revisit `.release-it.json` behavior for RC/stable tagging if automation becomes desirable | `.release-it.json` |

**Phase 3 exit criteria:** Releases are easier to execute consistently, but this is not required for the current development tranche.

---

## Deferred until maintainers decide to apply the policy

- Changing the live version number now
- Editing `CHANGELOG.md` solely for the policy docs
- Tagging RCs or stable releases
- Modifying public release automation

## Related docs

- [SPEC-versioning-and-release-cycle.md](./SPEC-versioning-and-release-cycle.md)
- [TEST-PLAN-versioning-and-release-cycle.md](./TEST-PLAN-versioning-and-release-cycle.md)
