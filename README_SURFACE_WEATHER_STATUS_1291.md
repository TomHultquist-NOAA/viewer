# Surface weather availability feedback — Viewer v1.2.91

This release is based directly on the complete Viewer v1.2.90 distribution. It modifies only viewer files; **no converter changes or configuration changes are necessary**.

## States and where they appear

When the Surface weather analysis checkbox is enabled on an eligible field, each active model panel reports:

- **Loading** — retrieving the current model/cycle/hour GeoJSON.
- **Not published for this hour** — the requested overlay returned HTTP 404/410; the converter may not have processed this frame yet.
- **Download failed** — a network, server, authorization, or malformed GeoJSON response. Check the browser Network tab or server publication permissions.
- **No features detected** — a valid FeatureCollection was retrieved but contained zero supported features. This is a successful scientific result, **not missing data**.
- **No selected features** — the file contains supported features, but none pass the enabled categories or confidence setting.
- **No matching MSLP data** — this panel's selected model/hour does not provide matching MSLP, or its catalog path is unsupported.
- **Waiting for model data** — the panel has not resolved its model/valid hour.

The **Data overlays → Surface weather analysis** panel reports counts per state for active maps. When a valid file contains features, the count is shown in the controls and no status label obscures the map. Differences do not show standalone surface-weather status.

**Retry** clears the short-lived missing/error cache or a previously empty response and re-requests those current frames. This is useful after the converter publishes a new GeoJSON. It does **not** rerun the converter.

Status messages live in the viewer DOM (not the weather canvas) and therefore do not appear in PNG/GIF/video exports. This avoids altering scientific graphic exports.

## Deployment

Extract the **complete** Viewer v1.2.91 ZIP over your viewer web root, preserving its locally managed `config.json`, vendor assets, Zarr data, and map tiles. Neither the converter nor `converter_config.sh` needs modification. The original v1.2.90 functionality, including panel/video/PNG/GIF exports and mobile rendering optimizations, remains intact.

## Tests

`node tests/test_surface_weather_status.cjs` exercises loading, ready, valid-empty, filtered, 404-missing, error and invalid-GeoJSON states, plus panel and menu status updates. The prior viewer tests are also retained.
