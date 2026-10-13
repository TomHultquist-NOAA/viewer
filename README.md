# OMD EVU Model Viewer

**Version 7.35 · October 12, 2026**

A browser-based, multi-panel weather-model viewer for the Office of Modeling and Development (OMD), Evaluation and Verification Unit (EVU). It displays forecast fields from hosted Zarr v2 datasets using MapLibre GL JS and autumnplot-gl. Map geography is served from local GeoJSON files; plots are rendered in the browser.

## Viewer capabilities

- Compare multiple models and ensemble members in a synchronized grid (default: 3 × 3, configurable up to 20 panels).
- Select a forecast field, model initialization cycle, and forecast hour; step or animate through available forecast times.
- Pan and zoom synchronized maps in **2D** or **Globe** mode. Each mode remembers its own center and zoom while the page is open.
- Display local state, country, coastline, lake, and zoom-dependent county boundaries.
- Use light or dark mode, expand an individual panel, and inspect data under the cursor.
- Save an individual panel or the full comparison as a PNG in **16:9** or **4:3**, with **Fill** or **Fit** framing. Exports prepare the applicable geographic detail before capture.
- Prefetch upcoming forecast data, with bounded browser caches and adaptive network use.
- Use the viewer on desktop and mobile, including sequential mobile map initialization and WebGL resource recovery.

## Default panel arrangement

| | Column 1 | Column 2 | Column 3 |
| --- | --- | --- | --- |
| **Row 1** | RRFS | HRRR | REFS-1 |
| **Row 2** | REFS-2 | REFS-3 | REFS-4 |
| **Row 3** | REFS-5 | REFS-mean | Analysis (verification) |

The Analysis panel uses valid-time-matched verification fields from `data/catalog_analysis.json`. Missing or delayed verifying data is identified in the panel; it is not replaced by an older hour. MRMS is ingested at full native resolution (stride 1) by default, which requires more memory and bandwidth.

## Deployment and updates

1. Copy the ZIP contents **directly into the web viewer directory**, retaining the included directory structure. There should be no additional enclosing folder.
2. **Preserve `vendor/`**, including the MapLibre CSP worker and autumnplot-gl distribution. On a new installation, use `vendor_dependencies.py` to obtain the required third-party files.
3. **Preserve operational data** in `data/`: `catalog*.json` and referenced `.zarr` directories. Those are provided by the separate GRIB2-to-Zarr processing and publishing workflow, not by this ZIP.
4. Back up any locally customized `config.json` and merge settings as appropriate before replacing it.
5. If upgrading an earlier installation, you can delete the obsolete `build_catalog.py` from the web directory. Extracting a new ZIP does not remove files left by older releases.
6. Hard-refresh the browser after deployment to avoid cached viewer scripts or styles.

Serve the viewer over HTTP(S) rather than opening `index.html` as a local file. Persistent compressed-data caching requires a browser environment that supports CacheStorage (typically HTTPS or localhost).

## Main files

| Path | Purpose |
| --- | --- |
| `index.html` | Viewer entry point |
| `js/viewer.js` | Rendering, navigation, data access, prefetching, and PNG exports |
| `css/styles.css` | Responsive layout and visual styling |
| `config.json` | Model sources, panels, display, cache, and export options |
| `data/map_*.geojson` | Geographic boundaries and fills |
| `diagnostics.html` | WebGL, MapLibre, worker, and multi-panel diagnostics |
| `vendor_dependencies.py` | Third-party browser library setup helper |

The verification acquisition, conversion, and publishing scripts are distributed separately from the web viewer.

## Configuration

Edit `config.json` to change model catalog locations, panel order, default field, map options, and resource limits. Frequently useful settings under `display` include:

| Setting | Purpose |
| --- | --- |
| `maxActiveMaps` | Maximum active MapLibre maps (default 9) |
| `countyMinZoom` / `globeCountyMinZoom` | County visibility thresholds in 2D / Globe (4.25 / 4.30) |
| `countyPreloadLeadZoom` | Preload county geography ahead of visibility (0.35) |
| `prefetchHours` | Forecast hours to consider for ahead-of-time downloading (24) |
| `prefetchDiskCacheMB` | Target compressed browser cache budget (512 MB) |
| `exportPanelWidth` / `exportAllWidth` | Output PNG widths for 16:9 exports (1920 / 2560 pixels) |

The available fields, runs, and hours are determined by the published model catalogs. Model data may legitimately be unavailable for some selections.

## Troubleshooting

- **A panel has no data:** Check the relevant `data/catalog_*.json`, its referenced Zarr paths, and the selected cycle/hour. An explicit `run=` URL parameter can pin an older cycle.
- **Map or GPU initialization fails:** Open `diagnostics.html`, then verify the MapLibre CSP worker, autumnplot-gl worker assets, and browser WebGL support.
- **Mobile maps load slowly:** Allow sequential initialization to finish. Reducing active maps in `config.json` may help on memory-constrained devices.
- **PNG geography is unexpectedly incomplete:** Confirm that the `data/map_*.geojson` files are accessible and inspect browser network errors. The exporter loads the geographic layers required at the current zoom before capturing.

**Rendering libraries:** [autumnplot-gl](https://github.com/tsupinie/autumnplot-gl) and MapLibre GL JS.

## Full Analysis rendering errors

If an Analysis panel reports a rendering error, tap or click its message.
The complete error, field, catalog dataset, grid type, array dimensions,
and Zarr store are shown in an alert and copied to the clipboard where
clipboard permissions allow it. This diagnostics enhancement does not change
meteorological data or map-grid interpretation.
