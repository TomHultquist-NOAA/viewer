# Viewer v1.2.94 — Distinct trough and dryline symbology

**Troughs:** solid black ink (#000000) in a dashed line pattern (8px dash / 7px gap at normal map scale).

**Drylines:** brown ink (#a25b2c) with open semicircle scallops.

The line-type distinction holds on the map and in raster exports. Existing GeoJSON `type=trough` and `type=dryline` records do not need regeneration. Surface weather remains disabled by default; all prior overlays and viewer behavior are retained.

Independent surface-weather production and backlog scheduling are delivered separately in the **complete converter v1.4.85** archive. It requires one new crontab entry; see the converter's `SURFACE_WEATHER_DEPLOY.md`.
