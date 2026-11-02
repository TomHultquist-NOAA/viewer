# OMD EVU Model Viewer v1.1.38 — faster Difference PNG exports and consistent county visibility

- Faster Difference PNG exports in standard 2D views through validated reusable projection coordinates across raster rows. Retains the same image resolution, samples, field values, colors and interpolation settings. Globe and unusual camera views still use per-pixel geographic projections.
- County boundary visibility is frozen from the live map before any temporary export zoom. Hidden counties and their casing lines cannot be introduced by single-panel PNG, all-panel PNG/GIF or Difference PNG export.
- Exports continue using the cleaner two-tone boundary styling, and both GIF resolutions retain the 25-frame cap.
- Documentation and automated tests updated; no converter modifications required.
