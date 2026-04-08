import { coerceStringLines } from "lib/display/safeData";

type InfoScreenProps = {
  lines?: unknown;
};

/**
 * Custom text page when the active flavour includes {@link Screens.INFO}.
 * Lines come from `infoScreen` in `cfg/rwc-config.json` (array of strings).
 */
export function InfoScreen(props: InfoScreenProps) {
  const display = coerceStringLines(props?.lines)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!display.length) {
    return (
      <div id="info_screen" className="centre-align">
        <div>Set &quot;infoScreen&quot; in cfg/rwc-config.json</div>
        <div>(array of strings, one row each)</div>
      </div>
    );
  }

  return (
    <div id="info_screen" className="centre-align">
      {display.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
