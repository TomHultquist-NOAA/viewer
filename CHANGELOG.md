## 1.1.9 (2026-10-30)
- Fixed LSR marker synchronization across all model and analysis panels, including REFS members and REFS Mean, when maps initialize after the SPC report feed is fetched.
- Reapply the current report collection and visibility when an individual panel becomes map-ready and after its asynchronous weather shading finishes, not just when the reports are first loaded.
- Keep report symbols above the field shading in the MapLibre style order and reset click-handler state when an old map context is discarded.
- Added all-panel and late-panel regression coverage; regenerated the synchronized in-app/PDF User Guide.

## 1.1.8 (2026-10-30)
- Replaced the shared colorbar's wide “Reset scale” button with a compact circular-arrow icon and accessible label/tooltip.
- Moved the reset control into a dedicated heading row, preserving the centered field title and ensuring the button never overlays the colorbar or its labels in light/dark, desktop/mobile views.
- Updated the synchronized on-screen and PDF user guides. No changes to palette computation or converter processing.

## 1.1.7 (2026-10-30)
- Added theme-independent transparent shading at zero/near-zero values for weather fields where zero should not blanket the geographic map (CAPE, shear, SRH, severe-weather indices, 500-hPa vorticity and wind fields).
- Introduced a smooth transparent neutral center for first-minus-second difference maps, including live displays and saved PNGs.
- Corrected continuous legend drawing to honor physical palette breakpoints when transparent zero bands are inserted; preserved existing banded/categorical legend conventions.
- Maintained nonzero meteorological values, native Zarr data, point readouts, contour data, and opacity controls.
- Updated the in-app and PDF User Guide together from the single Markdown source.

## 1.1.6 (2026-10-30)
- Enabled scalar contours and meteorologically sensible isoline intervals for CAPE, shear, SRH, updraft helicity, SCP, and STP fields previously excluded from the contour control.
- Kept categorical precipitation-type fields excluded from numerical contours; preserved shading and existing numerical color-scale behavior.
- Updated in-app/PDF guide from one Markdown source and new viewer regression coverage.

## 1.1.5 (2026-10-30)
- slightly reduced display-only 500-hPa vorticity smoothing for RRFS/REFS members;
- added a light display-only 500-hPa vorticity smooth to HRRR and native REFS Mean;
- preserved raw field values, sampling, analysis and difference calculations;
- synchronized the updated User Guide with its in-app display and PDF.

## 1.1.4 (2026-10-30)
- replaced two-click numerical colorbar selection with a modal min/max slider and numeric-entry editor, including Apply, Cancel, Escape, and Reset default;
- corrected CAPE legend ticks to round, meteorologically meaningful threshold labels, without modifying source values;
- added a read-only browser RAP analysis diagnostic page for a specified UTC case hour;
- regenerated the complete in-app and PDF User Guides from their shared Markdown source.

## 1.1.3 (2026-10-30)
- synchronized the full in-app User Guide with the PDF, including keyboard shortcuts, GIF export tables, snowfall information, and troubleshooting;
- established a single Markdown source for both editions with a reproducible guide build script;
- added responsive table styling and retained on-screen navigation and PDF-opening icon.

## 1.1.2 (2026-10-30)
- upgraded the point sounding window to a more polished Skew-T / Log-P presentation with continuous temperature and dewpoint traces (no per-level circles);
- added a diagnostics inset to soundings with sampled CAPE, helicity, shear, and basic surface/profile summary values when available;
- refreshed the user guide, in-app help text, and package metadata for the sounding enhancements.

## 1.1.1 (2026-10-30)

- Read Converter 1.3.0 native-level sounding profiles from catalog_profiles.json and per-hour Zarr stores. Continue following hour/cycle; preserve sparse fallback and time-series bar charts. Refresh user-facing guide and PDF.

## v1.1.0 — October 30, 2026

- Treat point time-series time-period precipitation and snowfall accumulations as bar graphs, with rolling-interval overlap explained. Instantaneous and cumulative series remain line traces.
- Formal release designation for the point time-series and dynamically updating preliminary sounding introduced in the 1.0.24 candidate.

## v1.0.24 — Point charts, guide PDF, and clearer exported contours (2026-10-30)

- Context menu on map right-click: Time series / Sounding.
- Full-cycle point series stays fixed as the global viewer time changes; incomplete hours shown as gaps.
- Skew-T sounding follows global time and cycle, updating on playback and arrow-key changes. No fabricated upper-air dewpoint values.
- Movable/resizable inspection windows and PNG export icons.
- User Guide and README updated.

- Standardized the 300-hPa forecast plot title and improved exported solid/dashed contour readability.

## 1.0.23 — October 30, 2026

- Added interactive numerical colorbar: click to select a new minimum, then click a higher value to set maximum; nonmodal instruction popup and Cancel/Escape support.
- Remaps the entire native palette to the user-selected numeric interval across all panels, PNG/GIF exports and legends; values outside range are transparent (below) or saturated (above).
- Added Reset scale and per-field temporary overrides. Categorical precipitation-type scales and difference maps remain fixed.
- Updated the standalone and embedded User Guides and GitHub README.

## v1.0.22 — 2026-10-30

- Prefix analysis plot titles with **Analysis ·** while retaining the specific source (MRMS, RAP, RTMA, URMA, or NOHRSC) and field. For example, **Analysis · NOHRSC · 24-hour snowfall**.
- Keep analysis subtitles limited to the valid time. This applies to live panels and PNG/GIF exports, including Large labels.
- No changes to the converter, data formats, color scales, or GIF limits.

## v1.0.21 — 2026-10-30

- GIF exports initially select F000–F018 (High) or F000–F024 (Standard), resetting the default end when resolution changes unless the time range has been customized; default delay is 700 ms.
- Add optional **Large labels** to the PNG/GIF export dialog. Increase title and time typography for single-panel and all-panel outputs, including difference-map dialog exports, without changing map-rendered data or live-map labels.
- Name the actual analysis source in the primary plot heading (MRMS, RAP, RTMA, URMA, NOHRSC) and keep only the verifying valid time in the analysis subtitle; omit provider sample time.
- Refresh the README, standalone and embedded User Guides, and regression tests. No converter changes.

## v1.0.20 — 2026-10-30

- Improve model snowfall shading at missing-data boundaries: consistently mask negative and nonfinite values, and suppress small isolated, trace-level pixel islands; no changes to underlying data or other fields.
- Preserve working NOHRSC analysis catalog lookups and viewer/export functionality.
- Increment viewer cache tokens for reliable new JavaScript deployment.

## 1.0.19 — October 30, 2026

- Added read-only browser NOHRSC catalog and chunk diagnostics.
- Expanded unavailable-NOHRSC messages to identify the actual browser catalog content and URL.
- Display-only snowfall noise suppression below the plotted minimum, preserving raw data.

## 1.0.18 — 2026-10-30
- Raise the per-animation GIF frame limits by one: High (1600px) now permits 19 frames and Standard (1200px) permits 25 frames. Applies to individual and all-panel exports.
- Refresh in-app export guidance, user documentation, versioned asset references, and frame-limit regression coverage.
- Preserve all viewer features from 1.0.17, PNG exports, model data, and converter behavior.

## 1.0.17 — 2026-10-30

- Fix Reflectivity/Ptype hour selector and playback to recognize shared REFC and PTYPE hours instead of looking for nonexistent `refc_ptype` chunks.
- Rain reflectivity now transitions from green to yellow and orange at high dBZ; no red/pink is used for rain.
- Derive NOHRSC running snowfall from all consecutive 6-hour analyses between forecast initialization and valid time, only on six-hour boundaries. Show an explicit error if any constituent analysis is absent.
- Forecast 24-hour snowfall hour availability now accurately requires cumulative ASNOW at both endpoints; old missing ASNOW chunks must be repaired by the converter.

# OMD EVU Model Viewer — Changelog

## 1.0.16 — 2026-10-30
- Apply standalone export observation sizing to SPC Local Storm Reports as well as METAR and mPING.
- Draw visible SPC tornado, wind, and hail LSR circles directly onto the final individual PNG/GIF canvas, using the same georeferenced capture projection, clipping, size scaling, report colors and theme-aware outlines.
- Handle SPC-only exports even when observed precipitation type is disabled or has no reports.
- Preserve the established all-panel export and interactive map rendering unchanged. Add dedicated SPC export regression coverage.

## 1.0.15 — 2026-10-30

- Draw METAR and mPING observations as final-image overlays in **individual** PNG/GIF exports, using positions projected by the actual export camera; avoid MapLibre zoom and framebuffer scaling affecting the final size.
- Set observation symbol sizes in output pixels, with clipping to the exported map rectangle and respect for Fit/Fill framing and configured export gain.
- Leave working all-panel exports, on-screen marker styling, and data untouched. Add regression checks for symbol shapes, colors, projection alignment, and target-output sizing.


## 1.0.14 — 2026-10-30

- Correct undersized METAR/mPING markers in exported PNG/GIF maps: the prior square-root scaling was insufficient for high-resolution single-panel captures. Marker size now grows with the actual CSS map enlargement, compensating for MapLibre's own zoom-dependent radius and icon-size changes.
- Increase export-only marker prominence by 20% on single-panel and 70% on all-panel exports at the default setting; restore live marker styles after each export, including failures.
- Preserve `display.exportObservationMarkerScale` as an optional additional multiplier, and add quantitative scaling regression tests.

## 1.0.13 — 2026-10-30

- Increase METAR circle and mPING triangle prominence in saved PNGs and animated GIFs using capture-only symbol scaling, based on the target image size for individual panels and a smaller multiplier for comparison grids.
- Restore both MapLibre observation layer properties after each capture, even if capture fails; no changes to live marker sizes, positions or classification.
- Add optional `display.exportObservationMarkerScale` tuning (default 1.0; bounded). Preserve existing GIF frame limits and plot layouts.

## 1.0.12 — 2026-10-30
- Add native composite reflectivity shaded by model precipitation type immediately under Precipitation type, with categorical intensity colors, explicit missing input handling, and preserved observation overlays.
- Set Standard 1200px GIF export limit to 24 frames and High 1600px to 18, for single and all-panel exports.
- Compact exported titles/legends and clarify NOHRSC source-catalog omissions.
- Add targeted categorical-palette and GIF regression tests.

## v1.0.11 — 2026-10-30

- Fixed GIF frame header interlacing flag, which caused horizontal bands/row scrambling in v1.0.10 exports despite correct pixel encoding. Preserved adaptive 256-color per-frame palettes, 1200/1600px options, and animation delays.
- Export dialog now sizes to its content in PNG mode and expands with scrollable settings in GIF mode. Download and Cancel remain visible; desktop PNG no longer leaves a large empty lower section.
- Added independent GIF header/LZW scanline regression coverage and browser dialog tests at multiple viewport heights.
- Viewer-only change; no processing server, cron, converter, or published model data changes required.

## v1.0.10 — 2026-10-30

- Fixed animated GIF export dialog clipping: centered, max-height-bounded modal with independent scrollable settings and pinned, always-visible Cancel/Download footer. Expanding PNG settings to GIF settings no longer strands the controls below the viewport.
- Desktop toolbar compaction for both default top and optional left-side positions. Reduced excessive gaps and heights; left-side related selectors share rows. Existing mobile collapse/control layout remains unchanged.
- Renamed main toolbar action to **Export all panels** with an explicit PNG/GIF tooltip; updated built-in and standalone User Guides.
- Replaced the static RGB 3:3:2 GIF palette with frame-adaptive median-cut quantization and full local 256-color tables. Improves gradient and legend fidelity without external dependencies.
- Added user-selectable GIF resolution: High 1600px wide (24 single-panel / 12 all-panel frame limits) and Standard 1200px wide (36/18 frames). Retained aspect ratio, per-frame delay, final 500-ms hold, and forecast-hour restoration.
- Source-code and ZIP-only viewer release. No converter/cron/data changes needed.

## v1.0.9 — 2026-10-30

- Corrected MapLibre observation/report popups (Synoptic METAR, mPING, and SPC storm reports) in dark mode: popup text, backgrounds, pointer triangles, links and close buttons now consistently follow the active viewer theme. Light mode retains high contrast.
- Preserved line breaks in report metadata, long report text wrapping, and safe text-only insertion (`Popup.setText`). Applies to any other MapLibre text popup in this viewer.
- Viewer-only styling patch; no converter, server data, cron, model fields or published catalog changes required.

## v1.0.8 — 2026-10-30

- Optional SPC preliminary tornado, wind, and hail reports on Composite Reflectivity and all severe-weather fields. Red tornado, blue wind, and green hail circles with contrast-aware outlines; default off and persisted independently.
- Standard SPC report window is the preceding hour through the selected valid time, inclusive at the end. Accumulated UH uses the full interval since the cycle initialization. The viewer reads sanitized daily GeoJSON, not SPC live network endpoints.
- Image opacity slider is shared across the forecast and analysis panels; it leaves contours, barbs, geographic outlines, and observation markers unaffected. Opacity is persisted locally and respected by exports and the difference preview.
- Floating difference-map sampling cursor is now a crosshair rather than a hand.
- An extensive, scrollable, themed User Guide opens from the keyboard-shortcuts help strip. A standalone `USER_GUIDE.md` is also included.



## 1.0.7 — 2026-10-30
- Added solid dark-core/light-outline MSLP isobars (retaining independent on-by-default isobar toggle).
- Added on-by-default dashed 850-hPa temperature contours to MSLP panels with separate persistent toggle, model/analysis time matching and clear layer titles.
- Added animated GIF export for individual and all-panel plots with start/end forecast-hour sliders, hour-step and delay controls, final 500-ms hold, and browser-only GIF89a encoding. PNG and difference PNG exports remain available.
- Preserved v1.0.6 upper-air and convective changes; converter data unchanged.

## 1.0.6 — October 30, 2026
- Add 300-hPa wind speed maps, geopotential-height contours and wind barbs.
- Increase upper-air solid-height contour widths; maintain dashed optional scalar contours and conventional pressure-level intervals.
- Make MSLP isobars independently toggleable (on by default) on screen and in PNGs.
- Render zero/near-zero CAPE, composite indices and updraft helicity transparently where appropriate; preserve raw samples.

## 1.0.5 — October 29, 2026

- Corrected 500-hPa absolute-vorticity display smoothing for REFS members 1–5: use the stable panel source ID, with catalog model labels such as `REFS m001` also supported; continue leaving REFS Mean, HRRR, and RAP unchanged.
- Enabled the **Contours** checkbox on 500-hPa absolute-vorticity maps alongside Height and Wind. Optional vorticity contours are dashed at meteorologically sensible 5–10 × 10⁻⁵ s⁻¹ intervals; height contours remain solid.
- Optional vorticity contours now follow the display-smoothed shading, including exported PNGs, without changing the underlying Zarr values, cursor samples, or difference calculations.
- Added regression tests for REFS catalog naming, correct source selection, 500-hPa contour visibility, and dashed rendering.


## 1.0.4 — October 29, 2026
- Draw pressure-level geopotential-height contours in a **solid dark stroke with light halo** and optional upper-air shaded-temperature contours in **dashed theme-dependent strokes**, both with readable, contrasting labels. Other contour styles remain unchanged.
- Use meteorological base intervals: **30 geopotential meters** at 925/850/700 hPa, **60 geopotential meters** at 500 hPa, and **4 hPa** for MSLP. When necessary, reduce density only by exact integer multiples of these bases rather than arbitrary contour steps.
- Apply lightweight grid-aware, Gaussian-like three-pass box smoothing to **500-hPa absolute-vorticity shading for RRFS and REFS individual members only**. Preserve HRRR, REFS Mean and RAP display unchanged; retain raw values for cursor samples, differences, model verification, and stored Zarr. Reuse existing bounded viewer cache for shaded arrays.
- Apply line styling and smoothing to both interactive maps and PNG export; preserve all toggles, wind barbs, prefetch, and model/observation integrations. Viewer-only: no converter or backfill changes required; compatible with Converter 1.0.3.

## 1.0.3 — October 29, 2026
- Add independent **Height** and **Wind** controls for 925/850/700/500 hPa fields, and **Wind** for 10-m wind speed. Each starts enabled; user choices persist separately. Optional **Contours** remains off by default and independent; MSLP isobars remain always on.
- Apply each overlay switch immediately in live maps and honor visibility in individual and all-panel PNG exports. Retain METAR/mPING options on Precipitation type, unchanged.
- Improve difference-map responsiveness by warming selected aligned-analysis chunks for the current and next verification-valid hours before a difference is opened, using the existing low-priority shared Zarr download/cache path. Model-versus-model inputs continue to reuse current forecast prefetch.
- Reduce interactive difference-preview resampling work and reuse a bounded geographic-outline canvas when the camera, theme, extent, and visible layers have not changed. Preserve full-resolution difference PNG exports, native-grid math, labels and strict data-availability checks.
- No converter, Zarr schema, model processing, cron, or catalog modifications; compatible with Converter 1.0.3.

## 1.0.2 — October 29, 2026
- Add METAR (Synoptic Data) observations as colored circles and mPING precipitation reports as colored triangles, matching the existing precipitation-type palette and light/dark outlining.
- Consolidate the previous Contours setting into **Overlays**, rename “Show lines” to **Contours**, and show separate **METARs** and **mPING** checkboxes exclusively on Precipitation type; both sources default on and retain user choices.
- Load sanitized, pre-published hourly GeoJSON at the selected valid time; mark missing and future observations without contacting credentialed APIs from the browser.
- Preserve previous maps, synchronized playback, difference windows, all-field labels, model catalogs, and versioned assets.

## 1.0.1 — October 29, 2026
- Add mean sea level pressure with hPa shading, labeled always-on isobars, sampling, differences, legends, and PNG export.
- Replace the separate surface-wind and temperature/moisture branches with Surface weather, retaining the same field IDs and layout behavior.
- Enable RAP pressure-level height contours for the Analysis panel when fields are available.
- Update asset cache identifiers; retain all existing keyboard/mobile/share functionality.

## 1.0.0 — October 29, 2026 (first public release)
- Establish first public version number and audience-neutral deployment README.
- Provide a visible, short-lived “Link copied” toast beside the share icon when URL copying succeeds; clearly report clipboard failures and retain assistive-technology announcements.
- Keep field identifiers, share URL format, nested meteorological Field menu, map controls, difference functionality, Zarr catalogs, and viewer plotting behavior unchanged.
- Reclassify earlier internal development versions as 0.x.x without changing application data formats.

## Earlier internal development builds (0.x.x)

## v0.50.7 — 2026-10-29
- Put Composite reflectivity before Precipitation type under Radar & precip. type; shorten the general menu/legend label to Precipitation type while retaining existing HRRR, RRFS/REFS and REFS Mean model-specific titles.
- Rename the Snow & ice branch to Winter weather. Move freezing rain accumulation, sleet accumulation (`frozr`, previously Frozen rain accumulation), snow precipitation (liquid equivalent), and percent frozen precipitation into it. Keep every configured field visible exactly once.
- No changes to GRIB identifiers, Zarr stores, forecasts, analysis, sampling computations, field identifiers, deep links, menus on mobile/desktop, or converter requirements.

## v0.50.6 — 2026-10-29
- Replace two native Category/Field selects with a compact single Field control opening meteorologically grouped nested branches. Desktop supports pointer hover and click; touch/mobile supports tap-and-back within one popup.
- Support keyboard Enter/Space/ArrowDown to open, directional navigation, Home/End, Right to open a branch, Left/Backspace to return, Escape to close and focus restoration. Prevent global forecast shortcuts from intercepting menu input.
- Render the popup at body level so the left-side toolbar cannot clip it. Keep all configured field options visible, even when data are unavailable, and preserve original field IDs and shared URLs.
- Move the link-copy action to an accessible share icon beside theme and orientation controls, with copy feedback and restricted-browser fallback. Keep the prior URL-sharing behavior.
- Do not alter forecasts, model data, analysis, rendering, prefetch, sampling, PNG exports or converter requirements.

## v0.50.5 — 2026-10-29
- Replace the lengthy flat field selector with two short linked native dropdowns: meteorological Category and Field.
- Group fields into radar/type, temperature/moisture, precipitation, snow/ice, surface winds, upper air, shear/helicity, and instability/severe storms, including 500 hPa and every optional severe-weather field.
- Remember the last field chosen in each category while the page remains open. Preserve field identifiers, query-string deep links, model catalogs, missing-data behavior, sampling, differences, PNGs, desktop side-controls and mobile controls.
- No converter changes required; use existing v0.9.3.

## v0.50.4 — 2026-10-29
- Match precipitation and snowfall selections: 1/3/6/24/48-hour windows, then accumulated total. Rename Total snowfall to Accumulated snowfall and remove the 72h menu entry.
- Derive 48-hour NOHRSC snowfall analysis from two successive complete 24h records at exactly matched UTC times; support aligned model-analysis differences and prefetch.
- Add 24-/48-hour MRMS precipitation analyses from complete hourly QPE, with strict no-partial-sum behavior; reuse model cumulative Zarr stores.

## v0.50.3 — 2026-10-29
- The field dropdown lists every supported forecast and severe-weather selection, including 500 hPa forecast and optional diagnostics, even before their data are published. Unavailable model/forecast-hour data remain explicitly missing, never filled with zeros.
- Apply sentence-case labels to the 925/850/700/500 hPa forecast options and the SCP/STP parameter names. Preserve scientific acronyms and underlying field keys.
- Include a versioned viewer.js URL to ensure browsers request the updated menu code.
- Preserve all conversion, difference, legend, overlay, export, sampling, prefetch and Zarr behavior.

## v0.50.2 — 2026-10-29
- Hourly and accumulated maximum UH only; native SCP/STP GRIB aliases, distinct STP formulations.


## 0.50.1 — October 29, 2026
- Add 3- and 6-hour precipitation plus 1- and 3-hour snowfall; retain 1-hour precipitation, existing 6-/24-/48-/72-hour snowfall, and cycle totals.
- Derive exact model Fh−F(h−N) accumulations, not partial intervals; prevent missing hour data from becoming a valid sum.
- Match 1-/3-/6-hour precipitation to hourly MRMS QPE, requiring every valid hour. Match 6-hour snowfall to NOHRSC at 00/06/12/18 UTC. No 1-/3-hour NOHRSC analysis exists.
- Extend aligned-difference calculations, prefetch, legends and labels to virtual intervals. Fix forecast snowfall availability at nonsynoptic valid hours; NOHRSC hour restrictions apply only to analyses.
- No changes to map layouts, wind overlays, upper-air fields, sampling units or GPU map engine.

## 0.50.0 — October 29, 2026
- Change REFS Mean reflectivity display to **PMM composite reflectivity** and label verified PMMN-source REFS Mean accumulated precipitation as **PMM accumulated precipitation**; never mislabel old mean-source chunks as PMM.
- Add 925/850/700-hPa Forecast choices (temperature shading, wind barbs and always-visible geopotential-height contours) and 500-hPa Forecast (absolute-vorticity shading in 10^-5 s^-1, wind barbs, always-visible height contours). The contour toggle controls only temperature contours for these levels.
- Add accumulation-matched 6/24/48/72-h snowfall selections, deriving model accumulation intervals from asnow and matching NOHRSC analysis at its prescribed valid UTC times; unavailable source hours show a missing status.
- Expose optional diagnostic fields from real catalog entries: 0–1/0–6 km bulk shear, 0–1/0–3 km SRH, three CAPEs, updraft helicity, SCP and STP. Existing PTYPE labels, colors and controls preserved.

## 0.49.4 — October 29, 2026
- Restore HRRR PTYPE panel titles and per-panel/exported legends to **Derived precipitation type**; retain dominant labels for RRFS/REFS and ensemble-dominant for REFS Mean.
- Replace numeric cursor PTYPE samples (0–5) with semantic categories; invalid codes are shown as Unknown.
- Spell out **Freezing Rain** and **Sleet** in the shared, panel, and PNG precipitation-type legends.
- No changes to Zarr data, palettes, map rendering, catalog ingestion, or controls.

## 0.49.3 — October 29, 2026
- RRFS and REFS member PTYPE panels: Dominant precipitation type.
- REFS Mean REFC panels: Probability matched mean composite reflectivity.
- REFS Mean PTYPE panels remain Dominant ensemble precipitation type.
- Labels are model-specific even for existing Zarr catalogs; all visual rendering/difference logic is unchanged.

## 0.49.2 — October 28, 2026 (supplied viewer)
- Previous viewer, including difference-shading fixes and 14-day catalog behavior; refer to README.md.

### v1.1.10 — Compact overlay toggle layout

- Grouped SPC Reports with other overlay checkboxes to share available horizontal space; moved the report count below the toggle row.
- Prepared generic, GitHub-ready release documentation with only the current release note.
