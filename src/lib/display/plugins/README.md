# Display label plugins

**Registry:** `displayLabelRegistry.ts` — resolves outlook area text, AQHI headline city token, and `data-rwc-label-template` for `#conditions`.

**Built-in bundle:** `bundles/ecccRetroBroadcast.bundle.ts` — configurable **arrays** (`ECCC_RETRO_*`) plus rule objects. Add a new file under `bundles/`, export a `DisplayLabelBundle`, and call `registerDisplayLabelBundle()` from app bootstrap when you need operator-specific packs.

**Call sites** should import only `lib/display/outlookRegionalLabel` (stable API) so core screens stay template-like.
