# OMD EVU Model Viewer

**Version 1.3.5 — low-track status and continuous F000 diagnostic histories.** Retains pinned mobile playback, contour line patterns, 2-m wind overlays, and the native renderer. The paired Converter 1.4.93 includes the improved science-based surface-feature selection.


The **OMD Evaluation and Verification Unit (EVU) Model Viewer** is a static, browser-based, GPU-accelerated forecast and analysis visualization application. It serves synchronized multi-model maps from converter-generated Zarr v2 grids and JSON catalogs. No web-server Python service is required to display already published data.

## Features

- Synchronized regional **RRFS/HRRR/REFS** views and **GFSv16/GFSv17** and **AI / GFS / GEFS** comparisons, plus corresponding analysis panels as available.
- Surface, aviation, precipitation, winter weather, upper-air and convective fields; selectable contours, wind glyphs/tracers, storm reports and atmospheric soundings.
- Native-grid rendering, zoom/pan, Globe and Lambert modes, optional three.js terrain draping, and export of plots/GIFs or supported panel video recordings.
- Per-panel or on-demand continuous-field differences. **Flight Category and Precipitation Type are categorical** and are never numerically subtracted.
- METAR, mPING, GLM and SPC overlays; optional cities, roads, counties and geographic details; optional event discovery and low-center trajectories.
- **Low tracks:** select any Surface plot with MSLP shading available (MSLP, 2-m Temperature, 2-m Dewpoint, 2-m RH, 10-m Wind or Gust), then turn on **Data overlays → Low tracks**. There is no standalone track plot. The overlay starts off for first-time visitors, follows the selected model and hour, is independent of the shaded field and MSLP isobars, and appears in PNG/GIF exports. Forecast tracks are restricted to the chosen model initialization and F000–selected lead; analysis tracks use consecutive F000 analyses over the selected valid-time window.
- Aviation visibility values strictly above **9 miles**, and ceiling values above **30,000 feet AGL**, are hidden on maps and excluded from pairwise differences.

**New in v1.3.5:** Low-track availability is now visible in a compact, nonblocking status label on the affected model panel whenever the overlay is enabled but no official fix is displayed. Distinguishes unpublished cycle JSON, unprocessed leads, valid complete results with no active fixes, and download failure. The Data overlays summary is more precise and the metadata reader exposes diagnostic counts without changing any official tracks or cadence. The default official GFS/AI early checkpoint is F012; a fresh F006 forecast is not evidence of a tracker detection failure.

**New in v1.3.5:** Removed the separate Low tracks plot and added Low tracks as a Data overlay for every field offering MSLP as an image choice. The independent track checkbox is off initially, remembers explicit choices, supports share links and PNG/GIF exports, and reports missing track metadata without obscuring the surface map. Existing low-track JSON and scientific archives are unaffected.

**New in v1.3.3:** With interpolation enabled, signed difference GPU textures no longer interpolate extreme missing-value sentinel values into narrow false-blue artifacts. The original signed data, no-data masks, probes and exports remain unchanged.

**New in v1.3.2:** H/L center labels use a wider, zoom-aware collision distance after map projection, including their central-pressure labels. The converter separately enforces synoptic pressure prominence and coastal-front quality controls; those scientific changes require Converter v1.4.93. The browser filter affects only display (including exports), not published analysis or archived cyclone tracks.

**New in v1.3.1:** Right-click a contour-capable option under **Data overlays** to choose Default, Solid, Dashed, Dotted, or Dash-dot. The pattern is saved per overlay type and theme, and applies to live maps and PNG exports. On phone-sized screens, the independent playback bar now **stays pinned to the top of the screen while scrolling through panels**, even when the main **Controls** menu is closed.

**Mobile scrolling fix (v1.3.1):** The compact forecast VCR is a sticky navigation strip rather than part of the scrolling toolbar. It remains accessible at the viewport top when the user scrolls through the model plots, without covering the chart contents or affecting map touch/pan.

## Installation / upgrade

1. Deploy the ZIP **directly into the site's existing web root**, next to `index.html`, without an extra wrapping directory. Do **not** delete existing `data/` Zarr stores, catalogs, observations, `data/dem/`, roads, existing vendor libraries or other site content.
2. Preserve your site's existing `config.json`. The package supplies **`config.example.json` only**; copy it to `config.json` on a new installation or manually merge documented changes. Never overwrite an active site's catalog and display settings.
3. Retain or install the browser dependencies: MapLibre **6.16.0** in `vendor-v6/`, the supported Three.js build in `vendor-three/`, and the compatible autumnplot rendering runtime under `vendor/`. This ZIP does **not** embed those third-party libraries. The provided `install_three_vendor.py`, `update_maplibre_vendor_v6.py` and related installers help with first-time setup.
4. Run `sh repair_viewer_permissions.sh` and `python3 validate_viewer_install.py` from the deployed web root to check local permissions and expected assets. Ensure web requests can read the data/catalogs and the vendor scripts.
5. **Publish `release.json` last** so existing browser tabs receive the deployment signal after all other files are in place. Reopen the viewer or hard-refresh if an old page remains cached.

The viewer's package includes baseline geographic assets and the user guide, **not** large dynamically converted Zarr datasets, DEM tiles, road-tile caches, or installed vendor dependencies. For conversion, long-lived research archiving and track regeneration, deploy the companion Converter separately. See `CONVERTER_DATA_REQUIREMENTS.md` for viewer inputs.

## Historical cases

Published protected cycles can be selected in the usual model/cycle menus, subject to the supported domain and available hours. Regeneration of experimental surface-weather overlays and official native-GRIB tracks is administered separately by the converter. The detailed limitations are in `USER_GUIDE.md` and the converter's `CASE_STUDIES.md`.

## Using low tracks

Select **Surface weather → MSLP** or any MSLP-capable 2-m/10-m surface plot. Open **Data overlays** and check **Low tracks** (off on first use). This overlays the existing official NCEP/GFDL VortexTracker paths and low-center markers on the selected weather image without changing it. On the 2-m and 10-m fields, the **Shaded image / difference** radio controls can remain on their native parameter or switch to MSLP: the Low tracks checkbox works in either case. MSLP isobars, frontal/H/L analysis, and Low tracks are independently selectable. Disabling Low tracks removes its trajectories/markers without changing other overlays. This preference persists locally, and share links include the overlay state. Older `field=lowtracks` links migrate to the MSLP plot with Low tracks enabled. Partial or absent gettrk metadata is reported in the Data overlays status, **not** as an error over the underlying weather map. The converter and durable cyclone track archives are unchanged.

## Troubleshooting

- **Blank maps:** check that relevant catalog JSON and Zarr chunks are published, visible through the browser network inspector, and not blocked by web permissions or cache.
- **Sparse soundings:** verify the chosen model/cycle is listed in `data/catalog_profiles.json` and the referenced full-profile Zarr is available.
- **No low tracks:** verify `data/low_tracks/<model>_YYYYMMDD_HH00.json` and its `processed_hours` for that cycle; a zero-coverage message is not a meteorological statement.
- **Incorrect overlays:** verify the selected product, checked Data overlays controls and same-hour observation feeds.

The user guide, shortcut reference, data requirements and third-party attribution ship with the viewer. Historical case creation is managed by the converter `create_case.py`, covering regional, GFS and AI/GEFS families with case-appropriate verifying analyses. The viewer only displays preserved products that were actually published. Release history and internal tests are not included in the deployment package.

### Native-sounding availability

Viewer v1.3.1 retains the v1.2.99 fix and refreshes the shared native sounding catalog when a requested model/cycle/hour is initially absent. This avoids stale-cache sparse fallbacks while GFS/RAP soundings are catching up. Converter v1.4.92 preserves the v1.4.91 repairs and GFS catalog quality metadata and adds bounded RAP backfill; both need to be installed for complete coverage. The viewer does not synthesize missing pressure levels.

### v1.3.1 interaction updates

- On mobile, the independent playback bar appears just beneath the viewer heading at the top of the page and stays pinned to the top of the screen as you scroll through forecast panels, even if the full controls are collapsed. It provides previous/next, play/pause, F-hour and valid UTC time. It shares the existing frame and playback state; no second animation engine is used.
- Right-click a contour-related switch in Data overlays to choose **Default**, **Solid**, **Dashed**, **Dotted** or **Dash-dot**. Contour line style is saved by theme and overlay type; the same pattern is used in live plots and exported figures.
- For 2-m temperature, 2-m dewpoint and 2-m RH, enable **10 m wind barbs** under Data overlays. Default is off; U/V components load only when requested.
- REFS Mean 2-m RH is now backfilled by Converter v1.4.92 when its native mean product omits RH but provides mean 2-m temperature and dewpoint. **RH computed from ensemble-mean T/Td is not identical to mean member RH**; the output is labeled accordingly. Existing model stores remain intact.


**F000 analysis history (v1.3.5):** RAP (hourly) and GFSv16 (6-hourly) F000
surface-pressure low centers are associated independently within each selected
cycle, with no links across missing timestamps. These are experimental
diagnostics and are **not** official GFDL VortexTracker output. The paired
converter v1.4.94 publishes small source series after its surface-weather job.
