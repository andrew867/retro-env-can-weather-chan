import { useLayoutEffect } from "react";

/** Applies legacy vs official font CSS variables on `#weather_channel` (see `main.scss`). */
export function FontModeApply({ useOfficialFonts }: { useOfficialFonts: boolean }) {
  useLayoutEffect(() => {
    const el = document.getElementById("weather_channel");
    if (!el) return;
    if (useOfficialFonts) el.classList.remove("rwc-font-legacy");
    else el.classList.add("rwc-font-legacy");
  }, [useOfficialFonts]);
  return null;
}
