import {
  FLAVOUR_DEFAULT,
  FLAVOUR_DIRECTORY,
  FLAVOUR_NAME_MAX_LENGTH,
  SCREENS_WITH_AUTO_DURATION,
  SCREEN_DEFAULT_DISPLAY_LENGTH,
  SCREEN_MIN_DISPLAY_LENGTH,
  Screens,
} from "consts";
import { Flavour } from "types";
import uuid4 from "uuid4";
import fs from "fs";

/** Rotator does not set an outer dwell timer — the screen advances itself (per-page timers inside the component). */
export function isAutomaticScreen(screenID: Screens) {
  return SCREENS_WITH_AUTO_DURATION.includes(screenID);
}

/**
 * Flavour `duration` is interpreted as **seconds per page** for these screens (total time ≈ pages × duration).
 * Shown in the config UI with a “per page” hint.
 */
export function usesPerPageDwellInFlavourConfig(screenID: Screens): boolean {
  return (
    screenID === Screens.FORECAST || screenID === Screens.OUTLOOK || screenID === Screens.ALERTS
  );
}

/**
 * Coerce flavour JSON (`0`, missing, too small) for playout: missing/0 → default full step; 1–9 → {@link SCREEN_MIN_DISPLAY_LENGTH}.
 */
export function resolveScreenDwellSeconds(screen: { duration?: number }): number {
  const d = Number(screen.duration);
  if (!Number.isFinite(d) || d <= 0) return SCREEN_DEFAULT_DISPLAY_LENGTH;
  if (d < SCREEN_MIN_DISPLAY_LENGTH) return SCREEN_MIN_DISPLAY_LENGTH;
  return d;
}

/** New flavours start from the built-in default screen list (same as loading `default`). */
export function generateNewFlavour() {
  const now = new Date();
  return {
    name: "",
    created: now,
    modified: now,
    screens: FLAVOUR_DEFAULT.screens.map((s) => ({ ...s })),
  } as Flavour;
}

export function safeFlavourName(flavourName: string) {
  return flavourName
    .slice(0, FLAVOUR_NAME_MAX_LENGTH)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

export function saveFlavour(flavour: Flavour, isNew: boolean = false) {
  // give it a uuid
  if (isNew) flavour.uuid = uuid4();

  // make flavour name file safe
  const flavourFileName = safeFlavourName(flavour.name);

  // write it to file
  fs.writeFileSync(`${FLAVOUR_DIRECTORY}/${flavourFileName}.json`, JSON.stringify(flavour), "utf8");
}
