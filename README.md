# OMD EVU Model Viewer

A responsive, multi-panel numerical weather prediction visualization tool for the NOAA Office of Modeling and Development (OMD), Evaluation and Verification Unit (EVU). Forecast fields are read from static, browser-decodable **Zarr v2** files and displayed using [autumnplot-gl](https://github.com/tsupinie/autumnplot-gl) and MapLibre GL JS. The viewer uses local geography files and does not require a plotting service at request time.

## Version 7.27: Correctly attached and oriented wind-barb feathers and pennants

- Reworked 10-m wind glyphs using standard NWS/SPC meteorological construction rather than incrementally adjusting the old rake. The first 50-kt pennant (or, when none, the first full feather) starts **at the upwind tip** of the shaft, with no accidental gap. Every line/triangle is anchored to the staff.
- Correct feather handedness in every compass direction, by rotating one standard local geometry frame. Pennants occur nearest the upwind tip, followed by full 10-kt barbs, with a 5-kt half-feather nearest the station.
- Wind-barb spacing, shaft sizing, colors, dark-mode strokes, and overlay export behavior are unchanged. No processing or catalog update is needed. Geometry follows the conventions illustrated by the [NWS wind-barb reference](https://www.weather.gov/hfo/windbarbinfo).

## Version 7.26: wind-barb rake and complete shareable map view

- **Correct wind-barb feather angle:** Reversed the **rake** of the half feathers, full feathers and 50-kt pennant triangles while keeping the correct shaft/feather side, symbol size, density, and wind vector direction. Feathers now sweep toward the upwind end of the shaft, matching the supplied SPC examples more closely. Live plotting and PNG exports use the same geometry.
- **Copy link saves the map camera:** The copied URL includes the **exact selected initialization cycle**, field, forecast hour, map mode (2D/Globe), geographic center, zoom, bearing, pitch, theme, and loop-speed setting. Opening the link restores the shared map camera across all synchronized panels.
- **Default/latest behavior preserved:** Opening the normal viewer URL with **no `run=` argument** continues to select the latest available cycle. The copied link pins the selected cycle intentionally. Invalid/out-of-range camera parameters are ignored safely.
- **Deployment:** No GRIB/Zarr changes; preserve existing model data, catalogs, and installed vendor dependencies.

## Version 7.25: thin boundaries, faithful county exports, updated wind barbs

- **Boundaries:** Restored the original single-stroke coastline, international border, state, and county styling from Version 7.23. Removed the thick paired light/dark strokes introduced in Version 7.24. Field palettes remain unchanged.
- **Counties in standalone PNGs:** High-resolution individual-panel exports now base county visibility on the **live panel’s original zoom**, not the temporary higher export zoom. Thus, if counties are not shown on screen yet, they will not suddenly appear in the saved PNG. The pre-export county-layer state is restored even if capture fails. Applies to 2D and Globe; combined exports remain unchanged.
- **Wind-barb orientation and density:** Reversed the side of the staff carrying the SPC-style backward-slanting feathers and pennants. Reduced grid sampling separation at all zooms for a denser display, while preserving zoom-progressive disclosure. Default `display.windBarbMinSpacingPx` is now **22** (previously 26); shaft length remains 18 px.
- **Deployment:** As before, includes viewer source, geography and GitHub README; excludes Zarr data, catalogs, vendor binaries and development test files.


## Version 7.22: brighter active cursor and sharp standalone exports

- **Visible master cursor:** The real pointer is accented with a bright white, noninteractive crosshair halo. Related-location cursors remain cyan in the other maps, with independently sampled field values. The download icon glows when hovered and has a custom highlighted hand-pointer fallback to the standard pointer.
- **Higher-resolution individual PNG captures:** Standalone exports temporarily render the MapLibre map into a substantially larger viewport with a corresponding camera zoom adjustment, keeping the same map footprint rather than enlarging a small screenshot. They wait for multiple render frames after resizing to reduce mixed-resolution/ghosted map details. Wind barbs track that viewport and everything is restored afterward.
- **All-panels PNG behavior is unchanged**, since combined PNGs already looked sharp. Existing 16:9/4:3 dimensions, Fit/Fill options, and shared legends remain available.
- **Deployment:** One additional small source asset `css/cursor-hand-glow.svg` is included. No Zarr data or vendor libraries are bundled.

## Version 7.21: simplified combined-PNG title

- **Field-first PNG title:** The combined all-panels PNG now starts with only the selected field name and units (for example, “Composite reflectivity (dBZ)”). The second line still provides initialization cycle, forecast hour, and valid time. The “OMD EVU Model Viewer” prefix has been removed **only from the exported PNG title**; the web page branding remains unchanged. Model names continue to appear within their respective panels. Individual-panel exports are unchanged.
- **No other functionality changed:** Includes all V7.20 capabilities and local geography files; excludes production data, catalogs, and third-party binaries.

## Version 7.20: expanded-map exports, synchronized cursors and detail maps

- **Fit entire map now reveals additional geography:** For each PNG, the actual MapLibre rendering viewport is temporarily expanded to the chosen slide-cell aspect ratio. The map center, zoom, projection, and camera bearing remain unchanged, and the previous viewport and device-pixel ratio are restored after capture. The export therefore includes nearby geography that was outside the visible on-screen panel, instead of leaving empty side margins. **Fill** still crops to fill without distortion. Wind barbs are rendered using the expanded export viewport as well.
- **PNG dialog appears near the clicked control:** Whether invoked from an individual panel's download icon or **Save all panels PNG**, the dialog opens by the clicked location and stays inside the viewport.
- **Higher-detail map layers at every zoom level:** The provided detailed coastlines, borders, land and lake geometry are loaded immediately (shared download cache) and used at all zoom levels. Counties remain zoom-dependent, now from approximately **4.60 (2D)** and **4.68 (Globe)**, configurable separately in `config.json`. Set `display.detailMinZoom` above zero to defer high-resolution geography if startup performance becomes a concern. This increases geography processing work somewhat at startup.
- **Geographically synchronized sampling cursors:** Hovering over a live plot shows a cyan, noninteractive crosshair in the other live maps at the same geographic latitude/longitude (projected separately for each panel, including Globe). Each panel displays its own sampled value; a missing field shows **No data**. The original mouse pointer is unchanged and only it can activate download buttons. Cursors on the far side of the globe or outside a panel's map are hidden. Analysis has no geographic map yet, so does not show a marker. Disable using `display.synchronizedCursors: false` if necessary.
- **Categorical precipitation legends:** CSNOW, CICEP, CFRZR and CRAIN use a two-part scale: black **No** and the field-specific color **Yes**, with labels centered under their corresponding half. Only the *legend* uses black for No; the map still leaves No/zero grid points transparent over the basemap. The shared legend is centered beneath the grid and now spans nearly its full width. Individual and combined PNG exports use the same two-part key.
- **Combined PNG header:** Exports of all panels now include the selected field name and units, initialization cycle, forecast hour, and valid time in a shared two-line title bar. Model names remain in their respective maps rather than being repeated in the header. Both 16:9 and 4:3 exports keep the existing resolution and layout.
- **Deployment:** Source files, README and local boundary data only; no Zarr data, model catalogs, vendored runtime files or development tests. Back up any customized `config.json` before overwriting.

## Version 7.19: compact status and clearer PNG exports

- **One status strip:** The ready/loading/queued/missing/error counts and “Plotting powered by autumnplot-gl” credit now sit on the **right side of the instructions strip above the plots**. The former full-width footer has been removed, making more vertical space available to the grid. On narrow screens the text wraps within the same strip.
- **Sharper PNG captures:** MapLibre is temporarily asked to render the actual map at a higher drawing-buffer pixel ratio for each export, instead of simply enlarging a low-resolution screen capture. The map retains its existing geographic viewpoint. After each panel is captured, the previous pixel ratio is restored. Supersampling is capped (default `display.exportMaxPixelRatio: 4`) to limit transient GPU memory consumption.
- **Corrected color capture:** Preferred capture uses the browser’s native WebGL canvas PNG encoder, which properly handles premultiplied alpha; a corrected framebuffer fallback remains available. This addresses a possible source of the blue-tinted exported image.
- **Smaller slide/web PNG defaults:** Per-panel **1920×1080 (16:9)** or **1600×1200 (4:3)**; all-panel **2560×1440 (16:9)** or **2048×1536 (4:3)**. Exports keep the shared/individual legends, geographic aspect ratio, and Fill/Fit choice. Widths are configurable in `config.json`.
- If you preserve an older customized `config.json`, manually apply the new export widths and `exportMaxPixelRatio` to obtain these defaults. No forecast data or vendor update is needed.

## Version 7.18: RRFS catalog alignment (preserving V7.17 interface)

- **RRFS catalog corrected:** the RRFS panel now reads `data/catalog_rrfs.json`, which is what the unified WCOSS2 processor creates. Previous viewer versions read `data/catalog.json` (the legacy standalone RRFS catalog), so RRFS appeared stale or showed *No matching cycle* even when REFS and HRRR were current.
- **WCOSS2 cron update required:** configure the multi-source wrapper with `MODELS="${MODELS:-all}"`, or explicitly include `rrfs`; previous versions excluded RRFS from scheduled processing. Deploy the current processor package and process the missing RRFS cycles. No other model or viewer rendering changes are required.

## Version 7.17: previous interface improvements

- **All available model cycles in one menu.** At startup the viewer reads all eight configured catalogs and combines their initialization times into a **single descending-UTC list** (no duplicate cycles). It defaults to the newest available cycle, even if the original RRFS catalog is older than the REFS and HRRR catalogs. A model without data for the chosen cycle shows a missing-data message; the viewer does not quietly substitute a different cycle.
- **Keep Latest as the default on reload.** Ordinary startup no longer writes an automatically selected `run=` value into the browser address bar, which previously pinned a stale cycle indefinitely. Explicitly choosing a cycle preserves it in the URL; **Copy link** creates a deep link to the current exact cycle, field, forecast hour, map center and zoom, camera bearing/pitch, map mode, theme, and loop speed. Old bookmarked `?run=` links still intentionally open their specified run.
- **Plot-first panel design.** Removed the redundant model-name and Save PNG header. Model and valid-time labels remain over the map. Each active panel has a compact, accessible **download icon in the upper-right corner** that opens the familiar export options.
- **One shared field legend.** All panels use the same fixed field palette, so a single, compact horizontal legend appears **below the entire grid**. Per-panel colorbars are hidden, enlarging the maps. The shared legend updates with field selection even when some model sources are missing.
- **One-pixel panel spacing.** Horizontal and vertical gutters are 1 pixel; squared-off panels dispense with wasted borders and rounded gaps. Narrow/mobile layouts remain scrollable.
- **More useful combined PNGs.** A combined export also has exactly one legend below the grid, 1-pixel inter-panel spacing, and in-plot model/valid-time labels. This increases the space devoted to maps while preserving 16:9/4:3 resolution and Fill/Fit choices. Single-panel PNGs keep their own standalone legend.
- The nine-panel arrangement, wind-barb behavior, SPC reflectivity palette, mapping, animation, caches and prefetching remain unchanged.

### Why new cycles were missing previously

Older viewer versions populated the run selector exclusively from `data/catalog.json` (RRFS). The WCOSS2 multisource publisher deliberately leaves that file untouched and instead updates `data/catalog_rrfs.json` (when RRFS is enabled), `data/catalog_hrrr.json`, `data/catalog_refs_mean.json`, and `data/catalog_refs_m001.json` through `data/catalog_refs_m005.json`. V7.16 and later combine cycles across **all** of those catalogs. If RRFS has not yet been processed for the newest cycle, its panel will be unavailable until its own catalog and data are updated, while REFS and HRRR will still display.

## Default nine-panel arrangement

| Row | Left | Center | Right |
| --- | --- | --- | --- |
| 1 | RRFS | HRRR | REFS-1 |
| 2 | REFS-2 | REFS-3 | REFS-4 |
| 3 | REFS-5 | REFS-mean | Analysis (placeholder) |

The Analysis panel is intentionally empty until the planned RAP F000 / MRMS verifying-analysis workflow is ready. All eight active panels use the selected initialization cycle and forecast hour. For example, REFS mean does not have F000, and HRRR ends at F048 in the current processing workflow.

## Field menu

The menu preserves this relative order, showing those entries available in at least one loaded catalog:

1. Precipitation type (PTYPE)
2. Composite reflectivity (REFC)
3. Categorical snow (CSNOW)
4. Categorical ice pellets (CICEP)
5. Categorical freezing rain (CFRZR)
6. Categorical rain (CRAIN)
7. 2-m temperature (TMP)
8. 2-m dew point temperature (DPT)
9. 2-m relative humidity (RH)
10. Precipitation rate (PRATE)
11. Accumulated precipitation (APCP)
12. Frozen rain accumulation (FROZR)
13. Freezing rain accumulation (FRZR)
14. Snow precipitation, liquid equivalent (TSNOWP)
15. Total snowfall (ASNOW)
16. Percent frozen precipitation (CPOFP)
17. Snow cover (SNOWC)
18. Snow density (SDEN)
19. Snow water equivalent (WEASD)
20. Snow depth (SNOD)
21. 925-hPa temperature (TMP)
22. 850-hPa temperature (TMP)
23. 700-hPa temperature (TMP)
24. 10-m wind speed **with wind barbs**
25. 10-m wind gust

Wind speed and gust are shaded in **knots**. The U/V components used to draw wind barbs are also converted from m/s to knots. The viewer does not silently estimate wind direction from speed.

## Files in this repository

| File or directory | Purpose |
| --- | --- |
| `index.html` | Viewer entry point and export options dialog |
| `css/styles.css` | Themes, responsive panel layout, shared legend, download icon, toolbar, wind-barb overlay |
| `js/viewer.js` | Zarr fetch/decode, maps, field rendering, wind barbs, animation, exports |
| `config.json` | Source catalogs, panel order, map options, caching, export sizes |
| `data/map_*.geojson` | Local coastline, country, state, county, land and lake boundaries |
| `diagnostics.html` | Browser/worker troubleshooting page |
| `vendor_dependencies.py` | Downloads the required, externally maintained browser libraries |
| `build_catalog.py` | Optional original RRFS catalog builder |
| `vendor/.keep` | Placeholder for third-party browser libraries |

The deployment ZIP intentionally does **not** contain Zarr stores, `data/catalog*.json`, compiled vendor libraries, or test scripts. Keep your existing `vendor/` folder and uploaded model data on the server.

## Installation / updating

1. Publish the ZIP contents directly at the web viewer root (no enclosing subdirectory). **Back up `config.json`** before replacing it if you have local modifications.
2. Preserve the existing `vendor/` directory (MapLibre CSP build/worker, autumnplot-gl and its worker assets). For a new installation, follow `vendor_dependencies.py` and the diagnostics page.
3. Preserve the legacy `data/catalog.json` (if present), and all active `data/catalog_{rrfs,hrrr,refs_mean,refs_m001,...,refs_m005}.json` files, plus their referenced `.zarr` directories. Catalogs and Zarr stores are published by the separate WCOSS2 processing pipeline.
4. Hard-refresh the browser (`Ctrl+Shift+R`) to load the new versioned JS/CSS.

## Customization

The `config.json` file defines up to 20 panels, with the default `layout.columns: 3`. Wind-barb options under `display`:

```json
{
  "windBarbSizePx": 18,
  "windBarbMinSpacingPx": 22
}
```

`windBarbSizePx` adjusts the shaft length and `windBarbMinSpacingPx` sets the tightest screen-space spacing at high zoom. Density increases progressively at zoom levels 4, 5.5, 7 and 8.5; the wind field data are sampled at the displayed location, independently of map pixels.

For PNGs, select the **download icon** in the plot’s upper-right corner or **Save all panels PNG**, then choose **16:9** or **4:3** and **Fill** or **Fit**. Sizes default to 1920×1080 / 1600×1200 per panel and 2560×1440 / 2048×1536 for all panels; output width settings in `config.json` may be adjusted. Exports temporarily increase MapLibre’s internal pixel ratio (up to `display.exportMaxPixelRatio`, default 4) to capture a genuine higher-resolution map, one panel at a time, and restore it afterward. **Fill intentionally crops some peripheral map content** when the live viewport and the exported plot rectangle have differing aspect ratios; use **Fit** to render extra nearby geography at the same center and map zoom to fill the chosen aspect ratio.

## Operational notes

- Data are retrieved from the hosted `.zarr` chunk files via HTTP and decompressed in the browser, with bounded decoded/display-value caches and read-ahead for nearby forecast hours.
- The browser draws multiple independent WebGL maps and may become memory-bound with nine sources on older hardware. The configurable map activation limit and caches help reduce overhead.
- A source may not provide every field, cycle or forecast hour. The panel identifies unavailable values rather than inventing data. Runs are discovered across every configured source, even when RRFS is lagging.
- The 10-m wind barb overlay uses real 10-m U/V data. Color-filled wind speed can be displayed without barb vectors when those chunks are unavailable.
- Individual and combined PNGs use captured browser map frames; dense combined exports use right-side legends, while individual exports use horizontal ones; output *canvas dimensions* are presentation-ready, but the map is temporarily rendered at a higher pixel ratio for sharper geographic and field detail when supported by the installed MapLibre build and GPU. The `Fit` mode preserves all pixels of that frame, while `Fill` centers/crops it.
- Plot status and autumnplot-gl attribution now appear on the right side of the instructions strip above the panels, with no footer below the plots.
- Planned next step: field-specific verifying analysis using hourly RAP F000 and selected MRMS products.

## Troubleshooting

- If a source is unavailable, verify its `catalogUrl` in `config.json` (RRFS should be `data/catalog_rrfs.json`) and confirm the catalog's referenced `.zarr` paths exist under `data/`.
- If new cycles do not appear, reload the viewer and check **all** `data/catalog_*.json` files, including `catalog_rrfs.json`, not just the legacy `catalog.json`. Check whether the page URL has an explicit `run=` parameter pinning an old cycle.
- If the maps fail to initialize, open `diagnostics.html` and check that all MapLibre/autumnplot-gl worker resources have been deployed under `vendor/`.
- If wind barbs are missing on an otherwise populated 10-m wind speed panel, check that both `u10` and `v10` exist for that source, cycle and forecast hour, and that their respective chunks were uploaded.
- If an export trims important geographic detail, choose **Fit entire map** in the export dialog.

## Credits

Plot rendering is powered by [autumnplot-gl](https://github.com/tsupinie/autumnplot-gl). This repository uses separate third-party dependencies deployed into `vendor/` by the included installation helper.

### Version 7.23 — wind symbols and navigation

- 10-m wind barbs are smaller and more numerous at all zoom levels (default shaft length **18 px**, minimum spacing **22 px**). Modify `display.windBarbSizePx` and `display.windBarbMinSpacingPx` in `config.json` if desired.
- Uses dark navy barb ink with a narrow light keyline on both themes for contrast on shaded wind fields. The exact geometry was subsequently corrected in V7.27 to follow conventional shaft-tip attachment and speed-mark ordering.
- Background prefetch cancellation is no longer shown as a rendering error; foreground requests can retry a canceled background chunk.
- After selecting a field, UTC cycle, forecast hour, or map view, focus leaves the dropdown so arrow keys once again control forecast navigation.



### Expand an individual model panel (v7.28)

Select the small **expand** icon in the bottom-right corner of any plot to let
that model occupy the entire plotting grid without entering the browser's
fullscreen mode. The control becomes an **X**; click it to restore the configured
3×3 comparison. The common field legend, playback controls, model-cycle/field
selection, PNG downloads, geographic navigation, and shared-map state remain
available. The Analysis placeholder can also be enlarged. All-panel PNG
exports temporarily restore the comparison layout for capture and then return
to the expanded panel. This changes only the viewer layout: it does not affect
Zarr files, catalogs, or the WCOSS2 workflow.
