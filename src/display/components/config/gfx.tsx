import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
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
import { useSaveConfigOption } from "hooks";
import { FormEvent, useEffect, useState } from "react";
import type { GfxFeatureFlags, GfxPhosphorTint, GfxRuntimeConfig } from "types";

type GfxConfigProps = {
  gfx: GfxRuntimeConfig;
};

export function GfxConfig({ gfx }: GfxConfigProps) {
  const toast = useToast();
  const saveGfx = useSaveConfigOption("gfx");

  const [authenticRefresh, setAuthenticRefresh] = useState(!!gfx?.features?.authenticRefreshEnabled);
  const [nextGenLayers, setNextGenLayers] = useState(!!gfx?.features?.nextGenVisualLayersEnabled);
  const [scanlines, setScanlines] = useState(gfx?.retro?.scanlinesOpacity ?? 0);
  const [vignette, setVignette] = useState(gfx?.retro?.vignetteStrength ?? 0);
  const [tint, setTint] = useState<GfxPhosphorTint>(gfx?.retro?.phosphorTint ?? "none");
  const [safeTop, setSafeTop] = useState(gfx?.safeArea?.top ?? 0.02);
  const [safeBottom, setSafeBottom] = useState(gfx?.safeArea?.bottom ?? 0.06);
  const [safeLeft, setSafeLeft] = useState(gfx?.safeArea?.left ?? 0.02);
  const [safeRight, setSafeRight] = useState(gfx?.safeArea?.right ?? 0.02);

  useEffect(() => {
    setAuthenticRefresh(!!gfx?.features?.authenticRefreshEnabled);
    setNextGenLayers(!!gfx?.features?.nextGenVisualLayersEnabled);
    setScanlines(gfx?.retro?.scanlinesOpacity ?? 0);
    setVignette(gfx?.retro?.vignetteStrength ?? 0);
    setTint(gfx?.retro?.phosphorTint ?? "none");
    setSafeTop(gfx?.safeArea?.top ?? 0.02);
    setSafeBottom(gfx?.safeArea?.bottom ?? 0.06);
    setSafeLeft(gfx?.safeArea?.left ?? 0.02);
    setSafeRight(gfx?.safeArea?.right ?? 0.02);
  }, [gfx]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: GfxRuntimeConfig = {
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
        phosphorTint: tint,
      },
    };
    await saveGfx.saveConfigOption(payload);
    if (saveGfx.wasError)
      return toast({ title: "Unable to save graphics", status: "error" });
    if (saveGfx.wasSuccess)
      return toast({ title: "Graphics saved", description: "Display will pick this up on the next init poll.", status: "success" });
  };

  return (
    <Stack spacing={6}>
      <Text>
        Faithful REC-era look: scanlines, phosphor tint, and safe-area padding for future overlays. Changes apply after
        the display polls <code>/api/v1/init</code> (a few seconds).
      </Text>

      <form onSubmit={onSubmit}>
        <Stack spacing={6}>
          <Heading size="md">Feature flags</Heading>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb={0}>Authentic refresh (staged)</FormLabel>
            <Switch isChecked={authenticRefresh} onChange={(e) => setAuthenticRefresh(e.target.checked)} />
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb={0}>Next-gen visual layers (staged)</FormLabel>
            <Switch isChecked={nextGenLayers} onChange={(e) => setNextGenLayers(e.target.checked)} />
          </FormControl>

          <Heading size="md">Retro CRT</Heading>
          <FormControl>
            <FormLabel>Scanlines opacity ({scanlines.toFixed(3)})</FormLabel>
            <Slider
              min={0}
              max={0.2}
              step={0.005}
              value={scanlines}
              onChange={setScanlines}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <FormHelperText>Subtle horizontal lines; 0 disables.</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>Phosphor tint</FormLabel>
            <Select value={tint} onChange={(e) => setTint(e.target.value as GfxPhosphorTint)}>
              <option value="none">None</option>
              <option value="green">Green</option>
              <option value="amber">Amber</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Vignette ({vignette.toFixed(2)})</FormLabel>
            <Slider min={0} max={1} step={0.02} value={vignette} onChange={setVignette}>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <Heading size="md">Safe area (0–1)</Heading>
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
