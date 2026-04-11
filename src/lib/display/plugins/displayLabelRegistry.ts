import type {
  AqhiHeadlineCityRule,
  ConditionsLabelTemplateId,
  ConditionsLabelTemplateRule,
  DisplayLabelBundle,
  DisplayLabelStationContext,
  OutlookAreaLabelRule,
} from "./displayLabelPlugin.types";
import { ecccRetroBroadcastBundle } from "./bundles/ecccRetroBroadcast.bundle";

const outlookRules: OutlookAreaLabelRule[] = [];
const aqhiRules: AqhiHeadlineCityRule[] = [];
const templateRules: ConditionsLabelTemplateRule[] = [];

let builtInsRegistered = false;

/** Register an add-on bundle (sorts by rule priority descending). */
export function registerDisplayLabelBundle(bundle: DisplayLabelBundle): void {
  outlookRules.push(...[...bundle.outlookAreaRules].sort((a, b) => b.priority - a.priority));
  aqhiRules.push(...[...bundle.aqhiHeadlineRules].sort((a, b) => b.priority - a.priority));
  templateRules.push(...[...bundle.conditionsTemplateRules].sort((a, b) => b.priority - a.priority));
}

function defaultCity(ctx: DisplayLabelStationContext): string {
  return (ctx.city ?? "").trim();
}

/** “Outlook for …” fragment — first matching rule wins, else MSC `city`. */
export function resolveOutlookAreaLabel(ctx: DisplayLabelStationContext): string {
  ensureBuiltInBundles();
  for (const r of outlookRules) {
    if (r.applies(ctx)) return r.getFragment(ctx);
  }
  return defaultCity(ctx);
}

/** AQHI headline city token — first matching rule wins, else MSC `city`. */
export function resolveAqhiHeadlineCity(ctx: DisplayLabelStationContext): string {
  ensureBuiltInBundles();
  for (const r of aqhiRules) {
    if (r.applies(ctx)) return r.getShortCity(ctx);
  }
  return defaultCity(ctx);
}

/** `data-rwc-label-template` on `#conditions` for bundle-specific SCSS without core `if` chains. */
export function resolveConditionsLabelTemplateId(ctx: DisplayLabelStationContext): ConditionsLabelTemplateId {
  ensureBuiltInBundles();
  for (const r of templateRules) {
    if (r.applies(ctx)) return r.getTemplateId(ctx);
  }
  return "generic";
}

function ensureBuiltInBundles(): void {
  if (builtInsRegistered) return;
  builtInsRegistered = true;
  registerDisplayLabelBundle(ecccRetroBroadcastBundle);
}
