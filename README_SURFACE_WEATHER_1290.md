# EVU Viewer v1.2.90 — automated surface weather maps

Full viewer built from supplied `viewer(20261114-163800).zip` with all original files retained.

Data overlays → **Surface weather analysis** enables H/L symbols and central hPa, cold/warm/stationary front candidates, troughs and drylines wherever MSLP is available on the displayed model's same forecast valid hour. The overlay is derived **offline**, not in the browser. Experimental objective boundaries are not equivalent to official WPC frontal analyses. Occlusions render if supplied by a validated analyst source, but are not invented from a single time's surface gradients. PNG, multi-panel PNG and GIF exports include the features. Preferences persist across visits. Disabled or unavailable data do not block the viewer.

**Data requirement:** the companion `OMD_EVU_Converter_v1.4.82_SURFACE_WEATHER.zip` installs `surface_weather_analysis.py` and `run_surface_weather_cron.sh`. The converter's existing incremental cron wrappers then trigger the bounded generator/publisher after successful cycles. Existing private `converter_config.sh` is never included or replaced. `SURFACE_WEATHER_ENABLED=0` disables generation; `SURFACE_WEATHER_PUBLISH=0` disables publication. Published files live under the already-configured public viewer data root's `surface_weather/` directory (i.e. `data/surface_weather/` from viewer URL).

**Deployment:** unzip viewer contents directly into your usual viewer web root. Unzip companion converter source into `zarr_processing` while its jobs are idle. Preserve your private credentials and existing data. Verify with browser network console that a selected surface frame requests `/data/surface_weather/<model>_<YYYYMMDD>_<CC>00_fHHH.geojson` and returns a FeatureCollection. If 404, allow converter producer to publish that forecast hour.

**Scientific status:** first-version heuristic candidates with confidence metadata; not a substitute for WPC hand analysis. No observational or WPC verification against actual cases yet. Validate frontal positions before treating this as operational guidance.
