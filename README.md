# OMD EVU Model Viewer

**Current release:** 1.1.40 · November 2, 2026  
**Companion data converter:** Compatible OMD EVU multi-model converter (GFS catalogs and precomputed differences required for GFS mode)

The OMD EVU Model Viewer provides interactive, synchronized comparisons of numerical weather prediction guidance and verifying analyses. It renders browser-readable **Zarr v2** grids with **MapLibre GL** and **autumnplot-gl**. Forecasts and verification data are produced and published separately by the companion converter.

The RRFS/REFS model set displays nine panels: RRFS, HRRR, five REFS members, REFS Mean, and Analysis. The GFS model set displays six panels: GFSv16, GFSv17, matching GFSv16 F000 analysis, and three precomputed difference panels. Panel definitions and source catalogs are configurable in `config.json` (up to 20 panels).

## Features

- **Time and maps:** UTC cycle and forecast-hour selection, synchronized 2D Lambert/globe views, zoom/pan, playback, adjustable speed, prefetching, mouse sampling, dark/light theme, responsive controls, and a persistent desktop top/left controls setting.
- **Fields:** precipitation rate in **in/hr** (display only); composite reflectivity; model precipitation type; **Reflectivity with precipitation type**; surface temperature, dewpoint, humidity, winds and gusts; precipitation and snowfall totals/intervals; snow depth/presence; upper-air temperature, height, wind, and vorticity; CAPE, helicity, shear, and updraft helicity. Field availability depends on the model, forecast lead, and published inventory.
- **Reflectivity with Ptype:** combines native model composite reflectivity and categorical Ptype. Rain echoes progress from green into yellow/orange at higher dBZ; snow uses blue, freezing rain pink, sleet purple, and mixed precipitation amber. Forecast-hour availability requires both underlying inputs. This is model guidance, not observed Ptype.
- **REFS Mean PMM products:** REFS Mean composite reflectivity is the probability-matched mean and is labeled **PMM composite reflectivity**. REFS Mean accumulated precipitation uses the PMM precipitation source when the PMMN product is available and is labeled **PMM accumulated precipitation**. The viewer does not apply PMM labels to ordinary ensemble-mean source data; older stores may require the converter's targeted PMM precipitation repair before the PMM label is appropriate.
- **Verification:** supported RAP, RTMA/URMA, MRMS, delayed Stage IV, and NOHRSC products. NOHRSC native 6-hour and 24-hour snowfall analyses are selectable at their published valid times; 48-hour snowfall uses two complete consecutive 24-hour analyses. **NOHRSC accumulated snowfall** sums consecutive 6-hour analyses from the cycle initialization, beginning at F006 and at 6-hour steps. Missing intervals are not filled with zero.
- **Other accumulation windows:** model precipitation and snowfall intervals (1/3/6/24/48 hours) derive from available matching cumulative endpoints; appropriate native accumulation inputs must exist. Observed precipitation intervals prefer a complete Stage IV series of one-hour analyses when published, and otherwise use a complete MRMS series. Neither source is mixed with the other within an interval; incomplete accumulations are unavailable rather than invented.
- **Unshaded neutral/zero regions:** small, field-specific near-zero intervals are transparent for CAPE, wind speed/components, shear, SRH, updraft helicity, snow cover, frozen-precipitation percentage, and 500-hPa absolute vorticity. The transparent interval stays centered on physical zero when a numerical colorbar range is adjusted; an old palette band cannot drift and create a second blank region. Relative humidity remains shaded at 0% because very dry air is meteorologically meaningful. Difference maps fade to transparency near zero. The same behavior is used for individual and all-panel exports; data sampling and field values are unchanged.
- **Interactive numerical color scales:** click the shared numerical colorbar to open sliders and editable minimum/maximum values; Apply updates shading, Cancel/Escape preserves the previous scale, and Reset restores defaults. CAPE legends use round-value labels rather than fractional endpoints. All palette colors are reused across the selected interval, consistently on all panels and PNG/GIF exports. Categorical Ptype colors and difference-map scales stay fixed; underlying data are not modified. See the User Guide for details.
- **Geographic visibility:** live coastlines, country/state boundaries, and zoom-dependent counties use a **single clean stroke**, with adaptive color in dark mode. The separate PNG/GIF export renderer retains its two-tone casing. Map outlines and Map background can be independently toggled; right-click their label boxes to customize appearance. The Interpolate box aligns with Map view in the desktop toolbar.
- **Optional grid interpolation:** the **Interpolate** checkbox applies GPU bilinear texture filtering to continuous scalar fields. It is on by default for GFS continuous fields and off by default for RRFS/REFS, remembers each model set’s browser preference, and does not resample or modify Zarr data or point-sampled values. Categorical precipitation type and the hybrid Reflectivity-with-Ptype product retain nearest-neighbor rendering.
- **Overlays:** wind barbs for the bulk-shear vector difference on bulk-shear fields and Bunkers right-moving motion barbs on 0–1/0–3 km SRH fields (when source U/V data are published); separate persistent severe-weather overlay switch; height contours, ordinary wind barbs, shaded-field contours (including numerical CAPE, SRH, shear, and updraft helicity), MSLP isobars and optional 850-hPa temperature contours; image-opacity control. The display-only smoothing of RRFS/REFS members (moderate) and HRRR/REFS Mean (light) 500-hPa vorticity and snowfall trace/no-data filtering do not change the stored Zarr values, sampling, or difference calculations.
- **Observed reports:** optional time-matched METAR precipitation-type circles and mPING triangles; optional preliminary SPC tornado (red), wind (blue), and hail (green) Local Storm Report circles. The same SPC reports are displayed on every initialized model and analysis panel, including REFS members and REFS Mean; report layers are refreshed after late map initialization and each weather-field redraw so they remain above the shading. Controls depend on the selected field; report availability depends on collection and publication.
- **Difference-map presentation:** the floating comparison opens at the same geographic scale as the selected model panel, allowing for different window proportions. The counties use the equivalent panel map scale and the PNG export freezes the visible boundary set, avoiding extra county lines caused solely by window resizing or temporary export enlargement. Difference PNGs now use the same plotting-area dimensions, title font sizes, and legend placement as individual-panel PNGs of the same output size, reducing unnecessary cropping differences.
- **Comparisons:** in RRFS/REFS mode, select two compatible panels to display first-selected minus second-selected in a floating map, with synchronized geographic sampling and PNG export. GFS mode uses its three fixed precomputed difference panels instead. **No difference map displays meteorological contours or wind/height/temperature overlays.** Model–analysis comparisons depend on published aligned-analysis or matching F000 data.
- **Export geography:** geographic boundaries are redrawn above the meteorological raster using a dark core and narrow light outline. This two-tone treatment preserves visibility across light and dark forecast shading in both viewer themes and all supported map PNG/GIF outputs. Live outlines are single-stroke; the export-specific two-tone style is intentionally unchanged.
- **Exports:** individual-panel and all-panel PNGs (16:9 or 4:3; Fit or Fill) and animated GIFs. GIFs default to **F000–F024 at either Standard/1200 px or High/1600 px (25 frames each)**, with a **700 ms** frame delay. The range and delay are adjustable for either export type. GIFs use per-frame adaptive palettes; the final frame has an additional 0.5-second hold. Optional **Large labels** in the export dialog enlarge model/source headings, time information, colorbar titles and tick numbers for presentation use. Analysis titles use **Analysis · Source · Field** (for example, **Analysis · NOHRSC · 24-hour snowfall**), with only valid time on the subtitle. Standalone image exports draw METAR, mPING, and SPC symbols at readable final-image sizes without changing their live-map or all-panel appearance.
- **Point inspection:** right-click a panel for an exportable time series (bars for interval totals) or Skew-T / Log-P sounding. The sounding reads Converter v1.3.5 or newer `data/catalog_profiles.json` and associated browser-readable Zarr stores whenever they have been published. Temperature, dewpoint, and winds are sampled from native pressure levels up to 100 hPa with no synthesized levels, shown with continuous traces and wind barbs plus a compact diagnostics box. When available, the diagnostics box samples CAPE, helicity, and shear fields at the clicked point and also reports basic surface and profile-summary information. Deterministic RRFS/HRRR and RAP can have denser levels; REFS members remain sparser; REFS Mean uses its directly published operational time-lagged mean temperature/dewpoint/winds. Older or missing hours fall back to the original sparse sounding with an explicit label. Time series keep the selected cycle; soundings update on forecast-hour/cycle changes. The profile grid has reduced horizontal detail and below-terrain levels are not fully screened. Open sounding and point-time-series windows repaint immediately when the theme changes, without refetching data; chart PNGs use the currently selected theme.
- **Sharing and help:** copy a URL containing the current view; open the in-app **User Guide**, or its print-ready [`PDF`](USER_GUIDE.pdf), from the guide header. See the user-focused [`USER_GUIDE.md`](USER_GUIDE.md).

## Severe-weather overlay data requirements

The companion Converter v1.3.8 collects native right-moving storm motion
(`USTM`, `VSTM`) when each forecast/analysis source provides both components.
Bulk-shear barbs require the corresponding native `shru01`/`shrv01` or
`shru06`/`shrv06` pair. The viewer correctly handles the native shear
components stored by existing forecast models and the newly normalized RAP
analysis components. RAP analyses converted before 1.3.7 need targeted
reprocessing and republishing; replacing only the viewer will **not** correct
unrealistic already-published shear magnitudes. The overlay toggle reads
**Shear barbs** or **Storm motion barbs** on those fields, defaults to on,
and remembers its state separately from upper-air/surface wind toggles. Shear barbs encode upper-minus-lower wind vector differences (not actual air motion at one level); their shafts use the conventional wind-barb orientation opposite the downshear direction and their feather/pennant markings indicate shear magnitude in knots.

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
- `display.exportObservationMarkerScale` (default `1.0`) adjusts export-only METAR, mPING, and SPC LSR symbol sizing in both single-panel and all-panel PNG/GIF outputs. Viewer v1.1.14 adds a 12% presentation-size increase in JavaScript even when an existing site configuration is retained. The on-screen symbol sizes are unchanged.
- The field menu may show a supported field even when its inputs are unavailable for a selected model/hour; a missing label is not equivalent to a zero forecast.
- Rain/snow mixed categories, probability-matched ensemble mean fields, and model-derived fields have different interpretations from native deterministic fields. Verification inputs and UTC valid times must match before drawing comparisons.
- Historical case data remain available only when retained and published by the converter; a catalog cannot substitute for missing Zarr chunks.

## Documentation and diagnostics

| Resource | Purpose |
| --- | --- |
| [`USER_GUIDE.md`](USER_GUIDE.md) / [`USER_GUIDE.pdf`](USER_GUIDE.pdf) | Complete user instructions and feature limitations |
| [`RELEASE_1_1_40.md`](RELEASE_1_1_40.md) | Current release changes and verification |
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

Right-click a panel to open a time series. Period-specific precipitation and snowfall accumulation fields use bars; instantaneous fields and cycle accumulations use lines. Rolling accumulation periods can overlap and must not be summed across adjacent bars. Series charts use rounded whole-number Y-axis ticks for most parameters and retain decimals for precipitation and other fractional units; the availability note is separated from the forecast lead-time axis title. Time-series gridlines have increased contrast in light and dark themes. Difference-map legends and their PNG exports use whole-number labels for most meteorological fields, retaining decimals only where the field range warrants them (such as precipitation in inches or in/hr).

## Guide authoring

The in-app User Guide and `USER_GUIDE.pdf` are generated from the same `USER_GUIDE.md` using `python3 tools/build_user_guide.py` on an authoring machine with `markdown-it-py` and `reportlab`. The generated HTML and PDF ship with the website; no additional libraries are needed on web server.

### Sounding display (v1.1.24+)

The Skew-T has a −50°C to +50°C lower temperature scale, more title padding, and uncluttered speed-ring labels on the hodograph. It retains corrected conventional wind-barb feather/pennant orientation, a larger pressure-colored hodograph, 0–1 km and 0–6 km model-grid shear diagnostics, and an optional **approximate most-unstable parcel trace** with indicated origin and LCL. The parcel is deliberately suppressed on sparse or moisture-incomplete profiles, and the plotted parcel must not be interpreted as an operational CAPE/CIN calculation. No converter fields were added for this display-only update.

## Native sounding surface data (v1.1.19+)

With Converter v1.4.5 or newer, pressure-profile stores may include native surface pressure, 2-m temperature, and 2-m dewpoint. These are plotted at the sampled surface pressure and below-ground pressure levels are excluded. If any surface record is unavailable, the viewer retains valid isobaric observations and notes the missing screening without estimating terrain pressure.


### GLM lightning overlay (v1.1.28)

When the separate optional converter collector has published hourly `data/lightning/YYYYMMDDHH.json` files, the **GLM lightning** checkbox displays 60-minute flash-centroid observations ending at the chosen forecast valid hour. The checkbox is shown on every Radar & precip. type, Shear & helicity, and Instability & severe storms field, including Reflectivity with Ptype, and remains off by default. Each flash is colored according to its age: 0–15, 15–30, 30–45, or 45–60 minutes before the valid hour. The hourly GeoJSON is not delivered in the viewer ZIP, because observation data are produced separately. A missing hour is identified as unavailable, not as an hour of zero flashes. Converter 1.4.13 applies the configured retention period to local and published GLM files while preserving valid hours covered by protected historical cases.

### Mobile point tools and scrolling (v1.1.29)

On touch screens, hold a finger still over a map for about 600 ms to open the same **Time series** and **Sounding** menu as desktop right-click. A short tap or map drag behaves normally; moving the finger cancels the hold. On narrow/coarse-pointer devices, the **↕ Scroll** rail on each panel gives a reliable vertical page-scrolling area while the rest of the map remains pannable. A rail tap moves to the next panel.

With sufficient browser WebGL resources, the viewer initializes all configured model maps in the background in addition to visible panels, avoiding missing initial panel loads when intersection events arrive during rendering. Map initialization is serialized to reduce worker/GPU contention, while data rendering continues concurrently. Under genuine WebGL context loss the existing mobile context recovery/eviction behavior remains in effect.

### Archived case cycles

Cycle lists distinguish explicitly protected case runs using a colored **• Case**
label. This comes from each forecast catalog's `is_case` property, which is
produced by the converter's protected-cycle configuration; it is not inferred
from a cycle's date. Native select elements may render option text colors
differently across browsers, so the text marker remains present as an accessible
fallback. GFS and RRFS/REFS case selection are managed separately by their
respective converter case utilities.

## GFS versions comparison

Select GFSv16 / GFSv17 from the model-set menu for six forecast, analysis, and precomputed difference panels. Saved cases are marked in cycle selections.

GFS comparison panels require GFSv16/v17 catalogs and chunks published by the converter. The analysis panel uses GFSv16 **F000 at the selected valid time**; analysis availability is limited to matching six-hour cycle times and successfully published F000 chunks. A missing analysis is reported explicitly instead of treated as forecast F000 from an unrelated time. Native GFS grids use a 0–360 longitude convention in the catalog and are normalized for plotting by the viewer.

#### Live backgrounds and GFS comparison colorbars

In dark mode, geographic outlines are subdued for continuous fields (such as temperature and height) while intermittent fields (such as reflectivity and precipitation) keep their high-contrast basemap lines. This does not alter export map outlines. In GFS comparison mode, a second shared colorbar shows signed differences and is included in all-panel exports. Near-zero GFS differences are transparent. The standard MSLP scale is bounded to 960–1050 hPa, with colors saturated at either endpoint.

Recent viewer refinements: GFS forecast-hour navigation advances in three-hour increments; dark-mode geographic outlines adapt to the field palette; GFS signed-difference legends refresh immediately after field selection; and the zero-centered difference palettes approach transparent zero through pale blue/red hues.

### Map and overlay styling
Map outlines and Map background are enabled by default. Turning off Map background uses black in light mode or white in dark mode. Right-click anywhere within the label box of Map outlines, Map background, Contours, Wind, Height, or 850-hPa Temp to set an opaque color and adjust line thickness; settings persist locally. Observation markers are unaffected.

Map-outline appearance overrides are keyed to model set and selected field. Difference maps in either model set show difference shading and geography only: meteorological contours and auxiliary overlays are never drawn. Difference near-zero bands are field-specific, and signed colorbar ranges remain fixed across forecast hours.

## Model-set feature parity (audited November 2026)

Both model sets use the **same map canvas, camera synchronization, Lambert/globe switch, theme and background controls, field-aware geographic boundaries, right-click overlay styling, interpolation renderer, point inspection, observation/GLM layers where supported, opacity, colorbar rendering, and PNG/GIF export machinery**. A switch in model set reloads the view and loads that set's panel layout and source inventories. Source availability and field eligibility may differ; unavailable fields are reported rather than substituted.

Intentional differences are: RRFS/REFS has nine panels, hourly lead navigation, on-demand two-panel differences, and RRFS-specific verification analysis; GFS has six panels, three-hourly lead navigation, three fixed precomputed differences, and a matching six-hourly GFSv16 F000 analysis (unavailable at non-synoptic valid times). Bilinear interpolation starts on for eligible GFS continuous fields and off for RRFS/REFS, with independent persisted preferences. Saved cases and data inventories are model-set-specific. The map styling implementation is otherwise shared.

**Map styling:** Map outlines and Map background are enabled initially. Disable the latter for a solid black map in light theme or white in dark theme. Right-click the entire control label box to choose an opaque color and width; map-outline overrides are saved **per model set and selected field**, while other overlay styles retain their existing shared scope. Background width is independent of outline width. Disabled outlines hide boundaries while leaving raster data intact. Changes to the live single-stroke outlines do not alter the two-tone export outlines. Observation controls are intentionally excluded from the appearance editor.
