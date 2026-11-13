# OMD EVU Model Viewer

The **OMD Evaluation and Verification Unit (EVU) Model Viewer** is a static, browser-based, GPU-accelerated forecast and analysis visualization application. It serves synchronized multi-model maps from converter-generated Zarr v2 grids and JSON catalogs. No web-server Python service is required to display already published data.

## Features

- Synchronized regional **RRFS/HRRR/REFS** views and **GFSv16/GFSv17** and **AI / GFS / GEFS** comparisons, plus corresponding analysis panels as available.
- Surface, aviation, precipitation, winter weather, upper-air and convective fields; selectable contours, wind glyphs/tracers, storm reports and atmospheric soundings.
- Native-grid rendering, zoom/pan, Globe and Lambert modes, optional three.js terrain draping, and export of plots/GIFs or supported panel video recordings.
- Per-panel or on-demand continuous-field differences. **Flight Category and Precipitation Type are categorical** and are never numerically subtracted.
- METAR, mPING, GLM and SPC overlays; optional cities, roads, counties and geographic details; optional event discovery and low-center trajectories.
- **Low tracks:** a `Low tracks` checkbox in **Data overlays**, checked by default, controls the track paths, center markers and pressure labels. The **Background** selector on the Surface low tracks product offers **MSLP** (default) or **No data** (track-only). These controls are independent. Forecast tracks are restricted to the selected model initialization and F000–selected lead; analysis tracks use consecutive F000 analyses over the selected valid-time window.
- Aviation visibility values strictly above **9 miles**, and ceiling values above **30,000 feet AGL**, are hidden on maps and excluded from pairwise differences.

## Installation / upgrade

1. Deploy the ZIP **directly into the site's existing web root**, next to `index.html`, without an extra wrapping directory. Do **not** delete existing `data/` Zarr stores, catalogs, observations, `data/dem/`, roads, existing vendor libraries or other site content.
2. Preserve/merge your site's customized `config.json` (the package's version is a template). It defines model catalog paths and display settings; do not overwrite local settings blindly.
3. Retain or install the browser dependencies: MapLibre **6.16.0** in `vendor-v6/`, the supported Three.js build in `vendor-three/`, and the compatible autumnplot rendering runtime under `vendor/`. This ZIP does **not** embed those third-party libraries. The provided `install_three_vendor.py`, `update_maplibre_vendor_v6.py` and related installers help with first-time setup.
4. Run `sh repair_viewer_permissions.sh` and `python3 validate_viewer_install.py` from the deployed web root to check local permissions and expected assets. Ensure web requests can read the data/catalogs and the vendor scripts.
5. **Publish `release.json` last** so existing browser tabs receive the deployment signal after all other files are in place. Reopen the viewer or hard-refresh if an old page remains cached.

The viewer's package includes baseline geographic assets and the user guide, **not** large dynamically converted Zarr datasets, DEM tiles, road-tile caches, or installed vendor dependencies. For conversion, long-lived research archiving and track regeneration, deploy the companion Converter separately. See `CONVERTER_DATA_REQUIREMENTS.md` for viewer inputs.

## Using low tracks

Choose **Surface weather → Low tracks**, then **Data overlays**. The **Low tracks** checkbox is on initially; uncheck it to hide track geometries. Under **Background** choose **No data** to display tracks over the basemap alone, or **MSLP** for colored surface pressure. The toggles are independent and do not change the extracted source data. The current converter publishes candidate and confirmed surface-low tracks using an EMC-informed closed-isobar method, not official operational NCEP/EMC track output. Missing tracks can also indicate missing published data; use the Converter's low-track audit.

## Troubleshooting

- **Blank maps:** check that relevant catalog JSON and Zarr chunks are published, visible through the browser network inspector, and not blocked by web permissions or cache.
- **Sparse soundings:** verify the chosen model/cycle is listed in `data/catalog_profiles.json` and the referenced full-profile Zarr is available.
- **No low tracks:** verify `data/low_tracks/<model>_YYYYMMDD_HH00.json` and its `processed_hours` for that cycle; a zero-coverage message is not a meteorological statement.
- **Incorrect overlays:** verify the selected product, checked Data overlays controls and same-hour observation feeds.

The user guide, shortcut reference, data requirements and third-party attribution ship with the viewer. Release history and test harnesses are maintained separately from the deployment package.
