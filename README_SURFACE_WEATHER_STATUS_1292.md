# Viewer v1.2.92 — Surface Weather default-off and diagnostic status

Based on the complete v1.2.91 viewer, preserving its model/panel logic, mobile optimizations, terrain rendering, and exports. No converter changes are necessary.

- Surface weather analysis starts **OFF**. On first visit after v1.2.92, the prior auto-enabled preference is cleared once. From that point, users can enable it and the manual preference persists.
- Status labels move **46 px above the bottom** (44 px mobile), clear of the bottom-right fullscreen button and the bottom-left point readout.
- HTTP 401/403 show **Access denied**, HTTP 429 shows **Server busy**, HTTP 5xx shows **Server error**, other HTTP failures retain their numeric code, and invalid JSON is distinguished from a valid empty FeatureCollection.
- In Data overlays, the status summary identifies the first failed response code. Hover that summary or a panel error label for the error detail and exact *relative* GeoJSON path.
- Only valid 404/410 responses say **Not published for this hour**; an error doesn't mean no meteorological features were detected.
- This is a **viewer-only** update. Leave converter_config.sh, research archives, published data and vendor files untouched.

## Diagnosing a continuing failure

In browser Developer Tools > Network, filter for `surface_weather`, select the failed `.geojson` request, and inspect the status and Response. For the frame shown in the Nov 14 report (GFSv17 initialized 20261114 06 UTC, forecast F038), the conventional request is:

`data/surface_weather/gfs_v17_20261114_0600_f038.geojson`

HTTP 404 means no file published at that name, HTTP 403 means web serving permissions, HTTP 5xx means server/proxy failure, and a successful response containing HTML indicates a wrong route or authentication page rather than usable GeoJSON. The converter can be checked independently via `logs/surface_weather_*.log` and the `surface_weather/` directory.

## Verification

`node tests/test_surface_weather_status.cjs`

`node tests/test_surface_weather_integration.cjs`
