# Data expected by the OMD EVU Model Viewer

The viewer is a **static browser application**, not a data-conversion service. It requests the catalogs, Zarr v2 stores, compact JSON products and optional observation/terrain assets published by the converter or installed separately.

- **Forecasts:** per-model `data/catalog_*.json` files identify available cycles, native grid metadata, fields and forecast lead times. The viewer supports regional RRFS/REFS/HRRR, GFSv16/v17 and available AI/GEFS datasets.
- **Analyses:** `data/catalog_analysis.json` resolves valid-time F000 analysis products and precipitation source priority; missing fields must remain missing instead of being synthesized silently.
- **Soundings:** `data/catalog_profiles.json` and referenced native full-profile stores supply pressure-level soundings. Publishers must merge catalog entries from all supported model families.
- **Surface lows:** compact model/cycle-specific `data/low_tracks/<model>_YYYYMMDD_HH00.json`, `data/low_tracks/catalog.json` and `data/low_tracks/analysis_reference.json` contain positions, track classification and coverage. Forecast histories accumulate from F000 to the selected forecast hour; analysis references use successive F000 analyses bounded by the selected cycle and valid time. Current science uses an independent EMC-informed 1-hPa closed-isobar detector; it is not operational EMC tracker output.
- **Aviation:** visibility is displayed only up to 9 statute miles, and ceiling up to 30,000 feet AGL; above those display bounds maps and pairwise differences are transparent. Flight Category is categorical and never numerically differenced.
- **Optional data:** observations, GLM, METARs/mPING, SPC reports, weather events, DEM, roads and place labels are displayed only when their published files are present and usable.

See the current Converter README for configuration and publication instructions. Do not place credentials in browser-accessible files.
