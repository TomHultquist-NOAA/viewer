# Mobile rendering performance — viewer v1.2.88

This update is viewer-only. It does not modify forecast data, model catalogs, scientific computation, the converter, or the permanent low-track research archive.

## Runtime behavior

- Compact/touch screens maintain at most **two active panel maps** by default across RRFS/REFS/HRRR, GFS and AI/GEFS. MapLibre initialization is viewport-first: offscreen panels are created when scrolled into view or opened. Previously initialized idle offscreen contexts are released as needed; the shared camera and cached forecast chunks are retained. Desktop layouts retain their existing active-map limit.
- MapLibre interactive canvas pixel ratio is capped at **1.6** on touch/compact screens (never higher than native device pixel ratio). Standalone PNG and difference exporters temporarily raise the pixel ratio when required and restore it afterward.
- The mobile CPU scalar shading path reuses the previously validated longitude-scanline accelerator from difference export. It applies only to flat, non-rotated Mercator map cameras after a geometric check. Rotated, pitched and globe views retain native per-pixel `unproject`. Existing validated native Lambert fast sampling is reused when applicable. No change to palettes or opacity logic.
- The existing 2x display-only resampling for large global regular-lat/lon fields is generalized to other model groups with similar native grid sizes. Native field arrays remain available for scientific calculations, contours and point sampling. On mobile, raster export may reflect the display-grid reduction, as it did for GFS in earlier releases. Desktop is unchanged.
- Mobile decoded/display-ready cache targets are capped at 128/96 MiB (bounded by site configuration); the compressed CacheStorage cap is 256 MiB and 200 chunks. Mobile foreground network fetch concurrency is at most four; idle and active prefetch use at most two and one concurrent workers respectively, and each mobile batch includes at most four chunks.
- A missing visible map can retry activation after an earlier panel finishes if GPU slots have become available. Failed mobile WebGL restoration may reduce the active-map budget further rather than repeatedly losing contexts.
- Dormant map eviction clears native Lambert sampler references to help GC recover memory.

## Tuning

The optional `config.json` display settings are:

```json
"mobileMapCapacity": 2,
"mobileMapPixelRatio": 1.6
```

To compare with the old behavior, increase `mobileMapCapacity` to 3, or change `mobileMapPixelRatio` to 2.0. Do not set the first value above your device's practical WebGL context budget. The independent desktop `maxActiveMaps` setting is unchanged.

In an Android Chrome DevTools console (for example via remote inspection), run:

```javascript
OMDEVUMobilePerformance.stats()
```

This reports the working set, map pixel ratio, context-loss count, per-panel last CPU raster time (when applicable), display stride, and decoded/display cache use.

## Validation and limitations

- Static JavaScript syntax, JSON, and viewer installation package checks passed.
- Synthetic rendering regression tests compared actual RGB raster output against the original per-pixel projection method and verified fallback for a rotated map; the same tests check mobile versus desktop map capacity and regular-grid selection.
- A real Pixel 10 Pro XL, WCOSS2/RZDM data pipeline and actual browser GPU profile were not available for hardware timing. Compare real on-device startup, field switching, scrolling, terrain, and exports after deployment before claiming a measured end-to-end speedup.
- If your phone has a visible quality regression, revert to viewer v1.2.87; this update contains no data migrations and leaves catalogs and Zarr untouched.

## Mobile playback while scrolling (viewer v1.3.1)

The compact previous / play-pause / next forecast bar is a sticky top-level page element on mobile viewports (800 CSS px or narrower). It remains visible at the top while scrolling through model panels, independently of the collapsed main controls. The bar does not create additional active maps, timers, network downloads, or playback state. On desktop it is hidden and the regular controls are unchanged.
