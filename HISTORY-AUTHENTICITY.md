# History, hardware, and authenticity (retro weather channel)

This note ties together **what the upstream project is simulating**, **what the GitHub community has filed**, **how real head-end gear behaved**, and **where to change our code** if we want more “hardware-accurate” motion and pacing.

---

## What the simulator is (upstream)

From [Forceh91/retro-env-can-weather-chan](https://github.com/Forceh91/retro-env-can-weather-chan) README:

- It models the **Environment Canada weather channel** carried on **Winnipeg cable** from the **1980s into the early 2000s**, with emphasis on the **mid-1990s** look and behaviour.
- Intended viewing frame: **640×480** (fixed layout; scale in the browser window).
- Credits **@wpgne** for source material and research; live streams and social links are listed in that README.

Our fork keeps the same visual baseline unless we deliberately add **feature-flagged** “authenticity” modes.

---

## GitHub issues worth reading (upstream)

These are the most relevant to **motion, refresh, and fidelity** (open/closed as of documentation time—check the repo for current state):

| Issue | Topic |
|-------|--------|
| [#998 – Refresh animation](https://github.com/Forceh91/retro-env-can-weather-chan/issues/998) | **Primary reference:** match **character-by-character** (or block-by-block) loading like original hardware; includes **first-hand notes** on serial speed and “first page live, rest in background” (quoted below). |
| [#997 – Air Quality Screen Date/Time at noon/midnight](https://github.com/Forceh91/retro-env-can-weather-chan/issues/997) | Edge cases for clock display—authenticity is also about **correct weird bugs** in time windows. |
| [#996 – Text loading with SSL](https://github.com/Forceh91/retro-env-can-weather-chan/issues/996) | Infrastructure; affects how “streaming text” behaves over HTTPS in real deploys. |
| [#853 – Forecast continued page background colour](https://github.com/Forceh91/retro-env-can-weather-chan/issues/853) | Palette fidelity vs. tape captures. |
| [#854 – Precipitation totals at seasonal change](https://github.com/Forceh91/retro-env-can-weather-chan/issues/854) | Logic tied to how viewers *remember* the channel behaving. |

**#998** is the hub for **refresh animation** work; anything we do should either align with that issue or be discussed there if we still care about upstream visibility (our fork may stay parallel).

---

## Real hardware lineage (context, not 1:1 with Winnipeg)

### U.S. cable: WeatherSTAR (analogous class of system)

The U.S. **Weather Channel** used **WeatherSTAR** (“**S**atellite **T**ransponder **A**ddressable **R**eceiver”) units at **cable headends** from **1982** onward. Early units (**Weather Star I / II / III**) were largely **text + colour blocks**; **Weather Star 4000** (~1990) added **real graphics** (maps, icons). Later generations (XL, IntelliStar, …) moved to workstations and PCs.

Good overviews:

- [Wikipedia: WeatherStar](https://en.wikipedia.org/wiki/WeatherStar)
- [TWC Archive – Weather Star](https://www.twcarchive.com/wiki/Weather_Star)

**Why cite U.S. gear?** Public documentation is richer than for every Canadian deployment. The *user-facing effect* is similar: **local data merged into a national feed**, **limited bandwidth**, **typed or painted fields appearing in sequence**.

### Canada / Winnipeg: ASCII stream and update behaviour (from #998)

In [#998](https://github.com/Forceh91/retro-env-can-weather-chan/issues/998), **@wpgne** quotes **Gary Krushen** (Videon engineer involved with the original system, **1975** context per the thread):

- Videon received an **ASCII data stream from Environment Canada**; exact assembly language/software on the MSC side was not documented in that note.
- Characters appeared at roughly **10 characters per second** early on; after a headend move, line speed went to **300 baud**, which was **too fast to read**, so EC changed behaviour:
  - **First page** updated **in real time** so viewers **saw** an update in progress.
  - That page **stayed visible** while **remaining pages updated in the background**.

**MSC “DataCaster” / exact model names:** Issue #998 mentions searching for an **MSC DataCaster** (or similar) manual; **no manual surfaced in the thread**. Treat as **open historical research**—library or retired engineer contacts may be the only path.

### Chyron / character generators (general)

Many cable and broadcast systems of the era used **character generators** and **keyers** (e.g. **Chyron**-class gear is often used generically in fan docs). Our app is **HTML/CSS/JS**, not a CG emulator, but we can mimic:

- **Field-by-field reveal** instead of one Framer-motion fade for the whole screen.
- **Short pauses** between logical groups (temperature block vs. wind block)—like the CPU doing one draw instruction then waiting on serial.
- **Occasional “stall”** between chunks (as **@andrew867** noted in #998: can look like **interrupt / buffer** behaviour).

---

## Where the code does “reload” today

- **Rotation + “conditions updated” jump to forecast:** [`src/display/components/screenrotator.tsx`](src/display/components/screenrotator.tsx) — `conditionsOrConfigUpdated`, `observationID` / `configVersion` effects.
- **Forecast reload styling:** [`src/display/style/forecast.scss`](src/display/style/forecast.scss) — `@keyframes reloadscreen`, stepped delays `.step-1` … `.step-20`. Conditions use steps **1–7**; alert (if any) is **8**; each **visible** forecast line from [`formatStringTo8x32`](src/lib/display/formatter.ts) gets its own step (**9+** with alert, **8+** without)—split on `\n`, not one blob. Delay between steps is **`gfx.retro.reloadLineMs`** (default **100** ms), exposed as `--gfx-reload-line-ms` on `#weather_channel` via [`GfxRetroApply`](src/display/components/gfxRetroApply.tsx).
- **Broadcast analog layer:** Optional `gfx.retro.vhsAnalogLayerEnabled` adds a VHS-style grain + bottom-band overlay (`::before` on `#weather_channel`, [`main.scss`](src/display/style/main.scss)); not mono-terminal—full broadcast colour underneath.
- **Forecast screen timing:** [`src/display/components/screens/forecast.tsx`](src/display/components/screens/forecast.tsx) — `isReload` shortens first-page dwell (**50 s** vs default when reloading).

The current animation is a **staggered visibility** pattern, not a **per-character serial** simulation. **#998** asks for closer match to **hardware character arrival** and **clear-then-repaint** behaviour described in the Krushen notes.

---

## Suggested authenticity directions (for future work)

Implement behind a **config flag** (e.g. `authenticRefresh: boolean` or baud preset) so broadcast/OBS users can turn it off if it’s too distracting.

1. **Serial cadence**  
   - Target ~**10 cps** for a “1970s–early 80s feel” or **300 baud–limited** pacing for line-oriented bursts (with **first page** following the “show live update” rule from #998).

2. **Clear / buffer semantics**  
   - Brief **blank or inverse-flash** before new text for a full observation cycle, then **type on** the first screen; **other screens** can **snap** or **fast-fill** if we adopt the “background update” story.

3. **Field-level, not page-level**  
   - Split key lines into **spans** and reveal in order (conditions → wind → pressure) with small jitter.

4. **Crawler / lower-third**  
   - Separate **slower** baud for crawler vs. main frame (many systems multiplexed).

5. **Optional “glitch”**  
   - Rare **single-frame corruption** or **wrong character** then correction—only if tasteful and off by default.

6. **Research backlog**  
   - Any **MSC / ECCC internal doc** on the Winnipeg cable feed (protocol, frame format, timing) would let us tune numbers with evidence instead of VHS approximations.

---

## References (web)

- [Environment Canada / ECCC public weather](https://www.canada.ca/en/services/environment/weather.html) (current data; not historical head-end docs)
- [Wikipedia: WeatherStar](https://en.wikipedia.org/wiki/WeatherStar)
- [TWC Archive](https://www.twcarchive.com/wiki/Weather_Star)
- Upstream issue [#998](https://github.com/Forceh91/retro-env-can-weather-chan/issues/998) (refresh animation + Krushen quote)

---

## Formal spec, tests, and implementation plans

The following live in the **MusicZone** monorepo (relative to this file: `../../../.cursor/plans/`):

| Document | Purpose |
|----------|---------|
| [retro_weather_authentic_refresh_spec.md](../../../.cursor/plans/retro_weather_authentic_refresh_spec.md) | Normative requirements, config shape (`clearStyle`, top-level init), state machine, timing |
| [retro_weather_authentic_refresh_test_plan.md](../../../.cursor/plans/retro_weather_authentic_refresh_test_plan.md) | Jest/RTL cases, fixtures, manual matrix |
| [retro_weather_authentic_refresh_implementation_plan.md](../../../.cursor/plans/retro_weather_authentic_refresh_implementation_plan.md) | Phased delivery, file touch list, ADR summary, risks |

---

*This file is project lore + implementation hints. It is not an official ECCC/MSC statement.*
