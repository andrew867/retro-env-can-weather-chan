import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  GFX_DEFAULT_SCANLINES_OPACITY,
  GFX_RELOAD_LINE_MS_DEFAULT,
  GFX_RELOAD_LINE_MS_MAX,
  GFX_RELOAD_LINE_MS_MIN,
} from "consts";
import { useSaveConfigOption } from "hooks";
import { FormEvent, useEffect, useState } from "react";
import type {
  AuthenticRefreshConfig,
  GfxDisplayAspectRatio,
  GfxDisplayResolution,
  GfxFeatureFlags,
  GfxRetroColourPreset,
  GfxRuntimeConfig,
} from "types";

type GfxConfigProps = {
  gfx: GfxRuntimeConfig;
  authenticRefresh?: AuthenticRefreshConfig;
  /** Widescreen frame is only applied with REC-era official fonts (new look & feel). */
  useOfficialFonts: boolean;
};

export function GfxConfig({ gfx, authenticRefresh: initAuthentic, useOfficialFonts }: GfxConfigProps) {
  const toast = useToast();
  const saveGfx = useSaveConfigOption("gfx");

  const [authenticRefresh, setAuthenticRefresh] = useState(!!gfx?.features?.authenticRefreshEnabled);
  const [nextGenLayers, setNextGenLayers] = useState(!!gfx?.features?.nextGenVisualLayersEnabled);
  const [scanlines, setScanlines] = useState(gfx?.retro?.scanlinesOpacity ?? GFX_DEFAULT_SCANLINES_OPACITY);
  const [vignette, setVignette] = useState(gfx?.retro?.vignetteStrength ?? 0.12);
  const [colourPreset, setColourPreset] = useState<GfxRetroColourPreset>(gfx?.retro?.phosphorTint ?? "none");
  const [safeTop, setSafeTop] = useState(gfx?.safeArea?.top ?? 0.02);
  const [safeBottom, setSafeBottom] = useState(gfx?.safeArea?.bottom ?? 0.06);
  const [safeLeft, setSafeLeft] = useState(gfx?.safeArea?.left ?? 0.02);
  const [safeRight, setSafeRight] = useState(gfx?.safeArea?.right ?? 0.02);
  const [vhsAnalog, setVhsAnalog] = useState(!!gfx?.retro?.vhsAnalogLayerEnabled);
  const [vhsHeadSwitchTear, setVhsHeadSwitchTear] = useState(!!gfx?.retro?.vhsHeadSwitchTearEnabled);
  const [reloadLineMs, setReloadLineMs] = useState(gfx?.retro?.reloadLineMs ?? GFX_RELOAD_LINE_MS_DEFAULT);
  const [displayAspect, setDisplayAspect] = useState<GfxDisplayAspectRatio>(gfx?.displayAspectRatio ?? "4:3");
  const [displayResolution, setDisplayResolution] = useState<GfxDisplayResolution>(gfx?.displayResolution ?? "sd");
  const [arCps, setArCps] = useState(initAuthentic?.charsPerSecond ?? 100);
  const [arJitter, setArJitter] = useState(initAuthentic?.jitterMsPerCharMax ?? 12);
  const [continuationGraphemeReveal, setContinuationGraphemeReveal] = useState(
    initAuthentic?.continuationGraphemeReveal !== false
  );

  useEffect(() => {
    setAuthenticRefresh(!!gfx?.features?.authenticRefreshEnabled);
    setNextGenLayers(!!gfx?.features?.nextGenVisualLayersEnabled);
    setScanlines(gfx?.retro?.scanlinesOpacity ?? GFX_DEFAULT_SCANLINES_OPACITY);
    setVignette(gfx?.retro?.vignetteStrength ?? 0.12);
    setColourPreset(gfx?.retro?.phosphorTint ?? "none");
    setSafeTop(gfx?.safeArea?.top ?? 0.02);
    setSafeBottom(gfx?.safeArea?.bottom ?? 0.06);
    setSafeLeft(gfx?.safeArea?.left ?? 0.02);
    setSafeRight(gfx?.safeArea?.right ?? 0.02);
    setVhsAnalog(!!gfx?.retro?.vhsAnalogLayerEnabled);
    setVhsHeadSwitchTear(!!gfx?.retro?.vhsHeadSwitchTearEnabled);
    setReloadLineMs(gfx?.retro?.reloadLineMs ?? GFX_RELOAD_LINE_MS_DEFAULT);
    setDisplayAspect(gfx?.displayAspectRatio === "16:9" ? "16:9" : "4:3");
    setDisplayResolution(gfx?.displayResolution === "hd" ? "hd" : "sd");
    setArCps(initAuthentic?.charsPerSecond ?? 100);
    setArJitter(initAuthentic?.jitterMsPerCharMax ?? 12);
    setContinuationGraphemeReveal(initAuthentic?.continuationGraphemeReveal !== false);
  }, [gfx, initAuthentic]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: GfxRuntimeConfig & { authenticRefresh?: AuthenticRefreshConfig } = {
      displayAspectRatio: useOfficialFonts ? displayAspect : "4:3",
      displayResolution,
      features: {
        authenticRefreshEnabled: authenticRefresh,
        nextGenVisualLayersEnabled: nextGenLayers,
      } as GfxFeatureFlags,
      safeArea: {
        top: safeTop,
        bottom: safeBottom,
        left: safeLeft,
        right: safeRight,
      },
      retro: {
        scanlinesOpacity: scanlines,
        vignetteStrength: vignette,
        phosphorTint: colourPreset,
        vhsAnalogLayerEnabled: vhsAnalog,
        vhsHeadSwitchTearEnabled: vhsHeadSwitchTear,
        reloadLineMs: Math.min(
          GFX_RELOAD_LINE_MS_MAX,
          Math.max(GFX_RELOAD_LINE_MS_MIN, Math.round(Number(reloadLineMs)) || GFX_RELOAD_LINE_MS_DEFAULT)
        ),
      },
      authenticRefresh: {
        enabled: authenticRefresh,
        charsPerSecond: Math.min(120, Math.max(1, Math.round(Number(arCps)) || 100)),
        jitterMsPerCharMax: Math.min(100, Math.max(0, Math.round(Number(arJitter)) || 12)),
        respectReducedMotion: initAuthentic?.respectReducedMotion !== false,
        streamUnit: initAuthentic?.streamUnit === "word" ? "word" : "grapheme",
        continuationGraphemeReveal,
      },
    };
    await saveGfx.saveConfigOption(payload);
    if (saveGfx.wasError)
      return toast({ title: "Unable to save graphics", status: "error" });
    if (saveGfx.wasSuccess)
      return toast({
        title: "Graphics saved",
        status: "success",
      });
  };

  return (
    <Stack spacing={6}>
      <form onSubmit={onSubmit}>
        <Stack spacing={6}>
          <Heading size="md">Motion & layers</Heading>
          <Text fontSize="sm" color="gray.600">
            Authentic refresh and next-gen layers are <strong>on</strong> in fresh installs; turn off here if you need
            legacy line-only reloads or a minimal raster.
          </Text>
          <FormControl>
            <FormLabel htmlFor="gfx-auth-refresh">Authentic refresh</FormLabel>
            <Switch
              id="gfx-auth-refresh"
              isChecked={authenticRefresh}
              onChange={(e) => setAuthenticRefresh(e.target.checked)}
            />
            <FormHelperText>
              Grapheme-by-grapheme forecast typing reveal on reload. Respects reduced-motion when enabled in config.
            </FormHelperText>
          </FormControl>

          {authenticRefresh && (
            <Stack spacing={3} pl={2} borderLeftWidth={2} borderColor="gray.200">
              <FormControl>
                <FormLabel htmlFor="gfx-ar-cps">Reveal speed (chars / sec)</FormLabel>
                <Input
                  id="gfx-ar-cps"
                  type="number"
                  maxW="xs"
                  min={1}
                  max={120}
                  value={arCps}
                  onChange={(e) => setArCps(Number(e.target.value))}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="gfx-ar-jitter">Jitter max (ms / char)</FormLabel>
                <Input
                  id="gfx-ar-jitter"
                  type="number"
                  maxW="xs"
                  min={0}
                  max={100}
                  value={arJitter}
                  onChange={(e) => setArJitter(Number(e.target.value))}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="gfx-ar-cont-grapheme">Continuation grapheme reveal</FormLabel>
                <Switch
                  id="gfx-ar-cont-grapheme"
                  isChecked={continuationGraphemeReveal}
                  onChange={(e) => setContinuationGraphemeReveal(e.target.checked)}
                />
                <FormHelperText>
                  When on, “forecast cont..” pages type out character-by-character like the first forecast page; the
                  playlist waits until the reveal finishes before advancing.
                </FormHelperText>
              </FormControl>
            </Stack>
          )}

          <FormControl>
            <FormLabel htmlFor="gfx-next-layers">Next-gen visual layers</FormLabel>
            <Switch
              id="gfx-next-layers"
              isChecked={nextGenLayers}
              onChange={(e) => setNextGenLayers(e.target.checked)}
            />
            <FormHelperText>
              Reserves a top overlay slot (safe-area aware) for future branding or motion without redeploying assets.
            </FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="gfx-display-resolution">Logical resolution</FormLabel>
            <Select
              id="gfx-display-resolution"
              maxW="md"
              value={displayResolution}
              onChange={(e) => setDisplayResolution(e.target.value as GfxDisplayResolution)}
            >
              <option value="sd">SD — 640×480 logical (default)</option>
              <option value="hd">HD — 2× logical scale (1280×960) for OBS / streaming</option>
            </Select>
            <FormHelperText>Scales the fixed-layout canvas via `--rwc-ui-scale` on the display host.</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="gfx-display-aspect">Display frame (4:3 vs 16:9)</FormLabel>
            <Select
              id="gfx-display-aspect"
              maxW="md"
              value={useOfficialFonts ? displayAspect : "4:3"}
              isDisabled={!useOfficialFonts}
              onChange={(e) => setDisplayAspect(e.target.value as GfxDisplayAspectRatio)}
            >
              <option value="4:3">4:3 — classic 640×480 SD canvas (centered, black matting)</option>
              <option value="16:9">16:9 — widescreen; 4:3 content centered; side pillars match screen colour</option>
            </Select>
            <FormHelperText>
              Widescreen keeps the REC layout in the same 640×480 safe area; left/right bands follow the current screen
              background (blue/red) for a future HD stream. Requires official fonts (new look &amp; feel) in Display
              settings.
            </FormHelperText>
          </FormControl>

          <Heading size="md">Timing &amp; broadcast analog</Heading>
          <Text fontSize="sm" color="gray.600">
            Optional CRT-style overlays on top of full-colour graphics—no terminal/mono mode.
          </Text>
          <FormControl>
            <FormLabel htmlFor="gfx-reload-line-ms">Line reveal interval (ms)</FormLabel>
            <Input
              id="gfx-reload-line-ms"
              type="number"
              maxW="xs"
              min={GFX_RELOAD_LINE_MS_MIN}
              max={GFX_RELOAD_LINE_MS_MAX}
              value={Number.isFinite(reloadLineMs) ? reloadLineMs : GFX_RELOAD_LINE_MS_DEFAULT}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setReloadLineMs(GFX_RELOAD_LINE_MS_DEFAULT);
                  return;
                }
                const n = Number(v);
                setReloadLineMs(Number.isFinite(n) ? n : GFX_RELOAD_LINE_MS_DEFAULT);
              }}
            />
            <FormHelperText>
              Delay between each line when conditions reload on the forecast screen ({GFX_RELOAD_LINE_MS_MIN}–
              {GFX_RELOAD_LINE_MS_MAX} ms; default {GFX_RELOAD_LINE_MS_DEFAULT} ms).
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="gfx-vhs-analog">Broadcast analog layer (VHS-style)</FormLabel>
            <Switch id="gfx-vhs-analog" isChecked={vhsAnalog} onChange={(e) => setVhsAnalog(e.target.checked)} />
            <FormHelperText>
              Subtle grain + bottom-band shimmer over the frame; works with colour presets and scanlines.
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="gfx-vhs-tear">VHS head-switch tear (tape dub)</FormLabel>
            <Switch
              id="gfx-vhs-tear"
              isChecked={vhsHeadSwitchTear}
              isDisabled={!vhsAnalog}
              onChange={(e) => setVhsHeadSwitchTear(e.target.checked)}
            />
            <FormHelperText>
              Bottom horizontal band with slow horizontal wobble (head-switch / tracking feel). Turn <strong>off</strong>{" "}
              for clean RF-style broadcast analog with grain only; turn <strong>on</strong> for nth-generation tape
              captures. Requires the analog layer above.
            </FormHelperText>
          </FormControl>

          <Heading size="md">Retro TV &amp; colour grading</Heading>
          <Text fontSize="sm" color="gray.600">
            Like shader presets in RetroArch: combine scanlines + vignette with an optional grading pass.{" "}
            <strong>None</strong> keeps true broadcast colour; NES/C64 are stylized; green/amber simulate monochrome CRTs.
          </Text>

          <FormControl>
            <FormLabel>Scanlines opacity ({scanlines.toFixed(3)})</FormLabel>
            <Slider min={0} max={0.2} step={0.005} value={scanlines} onChange={setScanlines}>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <FormHelperText>Horizontal lines over the frame; 0 = off.</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>Vignette ({vignette.toFixed(2)})</FormLabel>
            <Slider min={0} max={1} step={0.02} value={vignette} onChange={setVignette}>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <FormHelperText>Edge darkening (tube-style).</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>Colour preset</FormLabel>
            <Select
              value={colourPreset}
              onChange={(e) => setColourPreset(e.target.value as GfxRetroColourPreset)}
              maxW="md"
            >
              <option value="none">None — broadcast colour (default)</option>
              <option value="nes">NES-style — punchy 8-bit feel</option>
              <option value="c64">C64-style — cooler, home-computer bias</option>
              <option value="green">CRT green — monochrome phosphor</option>
              <option value="amber">CRT amber — monochrome phosphor</option>
            </Select>
            <FormHelperText>
              CSS grading only; the map and data stay full colour underneath unless you pick a CRT mono preset.
            </FormHelperText>
          </FormControl>

          <Heading size="md">Safe area (0–1)</Heading>
          <Text fontSize="sm" color="gray.600">
            Insets from each edge of the 640×480 frame reserved for legibility before future overlays.
          </Text>
          <FormControl>
            <FormLabel>Top / bottom</FormLabel>
            <Stack direction="row" spacing={4}>
              <Slider min={0} max={0.2} step={0.005} value={safeTop} onChange={setSafeTop}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Slider min={0} max={0.2} step={0.005} value={safeBottom} onChange={setSafeBottom}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Stack>
            <FormHelperText>
              Top: {safeTop.toFixed(3)} · Bottom: {safeBottom.toFixed(3)}
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Left / right</FormLabel>
            <Stack direction="row" spacing={4}>
              <Slider min={0} max={0.2} step={0.005} value={safeLeft} onChange={setSafeLeft}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Slider min={0} max={0.2} step={0.005} value={safeRight} onChange={setSafeRight}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Stack>
            <FormHelperText>
              Left: {safeLeft.toFixed(3)} · Right: {safeRight.toFixed(3)}
            </FormHelperText>
          </FormControl>

          <Button type="submit" colorScheme="teal" isLoading={saveGfx.isSaving}>
            Save graphics
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
