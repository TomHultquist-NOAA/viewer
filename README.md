# OMD EVU Model Viewer

**Current release:** 1.1.10 · October 30, 2026  
**Companion data converter:** OMD EVU Converter 1.3.6

The OMD EVU Model Viewer provides interactive, synchronized comparisons of numerical weather prediction guidance and verifying analyses. It renders browser-readable **Zarr v2** grids with **MapLibre GL** and **autumnplot-gl**. Forecasts and verification data are produced and published separately by the companion converter.

The default layout contains nine panels: RRFS, HRRR, five REFS members, REFS Mean, and Analysis. The panel arrangement and source catalogs are configurable in `config.json` (up to 20 panels).

## Features

- **Time and maps:** UTC cycle and forecast-hour selection, synchronized 2D Lambert/globe views, zoom/pan, playback, adjustable speed, prefetching, mouse sampling, dark/light theme, responsive controls, and a persistent desktop top/left controls setting.
- **Fields:** composite reflectivity; model precipitation type; **Reflectivity with precipitation type**; surface temperature, dewpoint, humidity, winds and gusts; precipitation and snowfall totals/intervals; snow depth/presence; upper-air temperature, height, wind, and vorticity; CAPE, helicity, shear, updraft helicity, and supported severe-weather indices. Field availability depends on the model, forecast lead, and published inventory.
- **Reflectivity with Ptype:** combines native model composite reflectivity and categorical Ptype. Rain echoes progress from green into yellow/orange at higher dBZ; snow uses blue, freezing rain pink, sleet purple, and mixed precipitation amber. Forecast-hour availability requires both underlying inputs. This is model guidance, not observed Ptype.
- **Verification:** supported RAP, RTMA/URMA, MRMS, and NOHRSC products. NOHRSC native 6-hour and 24-hour snowfall analyses are selectable at their published valid times; 48-hour snowfall uses two complete consecutive 24-hour analyses. **NOHRSC accumulated snowfall** sums consecutive 6-hour analyses from the cycle initialization, beginning at F006 and at 6-hour steps. Missing intervals are not filled with zero.
- **Other accumulation windows:** model precipitation and snowfall intervals (1/3/6/24/48 hours) derive from available matching cumulative endpoints; appropriate native accumulation inputs must exist. MRMS precipitation intervals require all corresponding hourly analyses. An incomplete accumulation is reported as unavailable rather than invented.
- **Unshaded neutral/zero regions:** for zero-based fields such as CAPE, wind speed, shear, severe-weather indices, and centered signed fields such as SRH and 500-hPa vorticity, true zero or a small neutral interval is transparent in both themes. Difference maps fade to transparency near zero. The same behavior is used for individual and all-panel exports; data sampling and field values are unchanged.
- **Interactive numerical color scales:** click the shared numerical colorbar to open sliders and editable minimum/maximum values; Apply updates shading, Cancel/Escape preserves the previous scale, and Reset restores defaults. CAPE legends use round-value labels rather than fractional endpoints. All palette colors are reused across the selected interval, consistently on all panels and PNG/GIF exports. Categorical Ptype colors and difference-map scales stay fixed; underlying data are not modified. See the User Guide for details.
- **Overlays:** height contours, wind barbs, shaded-field contours (including numerical CAPE, SRH, shear, updraft helicity, SCP and STP), MSLP isobars and optional 850-hPa temperature contours; image-opacity control. The display-only smoothing of RRFS/REFS members (moderate) and HRRR/REFS Mean (light) 500-hPa vorticity and snowfall trace/no-data filtering do not change the stored Zarr values, sampling, or difference calculations.
- **Observed reports:** optional time-matched METAR precipitation-type circles and mPING triangles; optional preliminary SPC tornado (red), wind (blue), and hail (green) Local Storm Report circles. The same SPC reports are displayed on every initialized model and analysis panel, including REFS members and REFS Mean; report layers are refreshed after late map initialization and each weather-field redraw so they remain above the shading. Controls depend on the selected field; report availability depends on collection and publication.
- **Comparisons:** select two compatible panels to display first-selected minus second-selected, with synchronized geographic sampling and PNG export. Model–analysis comparisons depend on separately published aligned-analysis data.
- **Exports:** individual-panel and all-panel PNGs (16:9 or 4:3; Fit or Fill) and animated GIFs. GIFs default to **F000–F024 at Standard/1200 px (25 frames)** or **F000–F018 at High/1600 px (19 frames)**, with a **700 ms** frame delay. The range and delay are adjustable for either export type. GIFs use per-frame adaptive palettes; the final frame has an additional 0.5-second hold. Optional **Large labels** in the export dialog enlarge model/source headings and time information for presentation use. Analysis titles use **Analysis · Source · Field** (for example, **Analysis · NOHRSC · 24-hour snowfall**), with only valid time on the subtitle. Standalone image exports draw METAR, mPING, and SPC symbols at readable final-image sizes without changing their live-map or all-panel appearance.
- **Point inspection:** right-click a panel for an exportable time series (bars for interval totals) or Skew-T / Log-P sounding. The sounding reads Converter v1.3.5 or newer `data/catalog_profiles.json` and associated browser-readable Zarr stores whenever they have been published. Temperature, dewpoint, and winds are sampled from native pressure levels up to 100 hPa with no synthesized levels, shown with continuous traces and wind barbs plus a compact diagnostics box. When available, the diagnostics box samples CAPE, helicity, and shear fields at the clicked point and also reports basic surface and profile-summary information. Deterministic RRFS/HRRR and RAP can have denser levels; REFS members remain sparser; REFS Mean uses its directly published operational time-lagged mean temperature/dewpoint/winds. Older or missing hours fall back to the original sparse sounding with an explicit label. Time series keep the selected cycle; soundings update on forecast-hour/cycle changes. The profile grid has reduced horizontal detail and below-terrain levels are not fully screened.
- **Sharing and help:** copy a URL containing the current view; open the in-app **User Guide**, or its print-ready [`PDF`](USER_GUIDE.pdf), from the guide header. See the user-focused [`USER_GUIDE.md`](USER_GUIDE.md).

## Web deployment

The archive contains the viewer source files at its root (no wrapping folder). It does **not** include forecast Zarr stores, model catalogs, private observation credentials, or the third-party `vendor/` runtime.

1. Deploy `index.html`, `config.json`, `css/`, `js/`, `data/`, the diagnostics pages, and any other package assets to the web viewer directory. **Retain existing live `data/catalog_*.json`, Zarr directories, and published observation/report JSON** while upgrading. The packaged `data/*.geojson` files are geographic boundaries, not model fields.
2. Preserve any site-specific `config.json` edits. Catalog URLs are relative to the viewer page; ensure every configured `data/catalog_*.json` and its referenced Zarr metadata/chunks are reachable over HTTP(S).
3. Supply `vendor/` with the self-hosted MapLibre GL and autumnplot-gl runtime assets. On an Internet-connected build machine, run `python3 vendor_dependencies.py` and deploy the resulting `vendor/` directory. **Do not run this network downloader on the restricted processing or web server.** An existing compatible `vendor/` installation can be retained.
4. Serve the directory over HTTP(S), not by opening `index.html` as a local file. Web-served files require read permissions and all enclosing directories require traversal permissions (typically `644` and `755`, respectively).
5. Open `diagnostics.html` for renderer/worker checks. Open `rap_diagnostics.html` for a read-only RAP analysis check by UTC valid hour. Open `nohrsc_diagnostics.html` to compare the **browser-served** analysis catalog with expected NOHRSC valid-time records and a sample Zarr chunk. If an analysis exists on the processing host but not in the browser catalog, verify the published catalog URL, server caching, and file access.

The viewer is a static web application. Processing, SSH/SCP publication, historical case protection, and retention are handled by the companion converter. For richer soundings, deploy Converter v1.3.5 or newer and ensure that `data/catalog_profiles.json` and its `sounding_*.zarr/` stores are accessible through the **same** website as the viewer. These files are produced by the converter, not bundled inside the viewer. No extra JavaScript vendor libraries are required.

## Display and configuration notes

- `config.json` controls panel/source definitions, layout, map behavior, prefetching, and export dimensions.
- `display.exportObservationMarkerScale` (default `1.0`) adjusts symbol sizes in individual-panel PNG/GIF exports. Normal interactive markers and all-panel exports retain their existing sizes.
- The field menu may show a supported field even when its inputs are unavailable for a selected model/hour; a missing label is not equivalent to a zero forecast.
- Rain/snow mixed categories, probability-matched ensemble mean fields, and model-derived fields have different interpretations from native deterministic fields. Verification inputs and UTC valid times must match before drawing comparisons.
- Historical case data remain available only when retained and published by the converter; a catalog cannot substitute for missing Zarr chunks.

## Documentation and diagnostics

| Resource | Purpose |
| --- | --- |
| [`USER_GUIDE.md`](USER_GUIDE.md) / [`USER_GUIDE.pdf`](USER_GUIDE.pdf) | Complete user instructions and feature limitations |
| [`RELEASE_1_1_10.md`](RELEASE_1_1_10.md) | Current release changes and verification |
| [`CHANGELOG.md`](CHANGELOG.md) | Historical changes without separate old release files |
| `rap_diagnostics.html` | RAP native/aligned browser-catalog and chunk checks |
| `diagnostics.html` | Graphics runtime and WebGL checks |
| `nohrsc_diagnostics.html` | NOHRSC browser-catalog and chunk checks |

## Sounding profile publication

The browser loads `data/catalog_profiles.json`, then the selected source/hour Zarr metadata and pressure-level arrays. If the catalog or a requested hour has not yet been published, the sounding reverts to its older sparse data when possible. New automatic profile collection is incremental rather than a historical backfill. The companion converter documents manual backfilling in `SOUNDING_PROFILES.md`.

## Development checks

From the extracted viewer directory, with Node.js available:

```bash
node --check js/viewer.js
node --test tests/*.test.cjs
```

These tests cover viewer logic and exports but are not a substitute for browser checks with operational Zarr data, especially for MapLibre/autumnplot rendering, report overlays, and GIF output.

## Data provenance and use

Guidance includes RRFS, HRRR, and REFS members/ensemble products. Verification may include RAP, RTMA/URMA, MRMS, NOHRSC, SPC preliminary reports, Synoptic METAR data, and mPING reports. Some products are derived for display and may not be direct observations. The viewer is intended for evaluation and case-study comparison, not as an official warning source. All displayed times are UTC. Data access and republication must follow the applicable provider permissions.

### Time-series chart conventions

Right-click a panel to open a time series. Period-specific precipitation and snowfall accumulation fields use bars; instantaneous fields and cycle accumulations use lines. Rolling accumulation periods can overlap and must not be summed across adjacent bars.

## Guide authoring

The in-app User Guide and `USER_GUIDE.pdf` are generated from the same `USER_GUIDE.md` using `python3 tools/build_user_guide.py` on an authoring machine with `markdown-it-py` and `reportlab`. The generated HTML and PDF ship with the website; no additional libraries are needed on web server.
