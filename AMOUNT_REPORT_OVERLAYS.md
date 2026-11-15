> **Update v1.2.97/v1.4.88:** CoCoRaHS is retained as a separate network; Synoptic replaces NOAA AWC as the scheduled METAR precipitation source. Synoptic also supplies snow depth and explicit 24h snowfall when individual stations report them. UTC-valid-time matching requires a known timezone for CoCoRaHS.

# Numeric observed precipitation, snowfall and snow depth overlays — v1.2.89

The **Data overlays** menu now has independent **CoCoRaHS amounts** and
**METAR amounts** checkboxes, initially enabled. The control appears on
accumulated precipitation, accumulated snowfall, and snow depth/cover
products across RRFS/REFS, GFS and AI model sets whenever those products exist.

- **Precipitation:** CoCoRaHS reported 24h liquid totals and METAR reported
  1h/3h/6h/24h totals (only when reported). A label such as `C24h 1.25`
  identifies a CoCoRaHS 24h total, not a 1h model-comparable amount.
- **Snowfall:** CoCoRaHS measured *new snowfall*. METAR `SNINCR x/y` can appear
  with `Δ` (`M1h Δ1.0`) meaning a **one-hour change in total snow depth**, NOT
  a measured 1h fresh snowfall. Do not confuse these values.
- **Snow depth/snow cover:** CoCoRaHS depth on ground or METAR `4/sss` and
  `SNINCR` total depth; underlying snow cover is percentage, but point labels
  are depth in **inches** and colored against the snow-depth (not percentage)
  palette.

Labels use the matching model-field precipitation/snow/depth colorbar with
black *and* white outlines to remain legible on any full-color forecast and
3D terrain. Overlapping stations are thinned according to screen distance
(125 maximum on touch devices), and hovering/tapping a labeled value displays
station, source, period, time metadata, and cautions. The report canvas is
included in PNG exports and does not create an additional WebGL context.

CoCoRaHS reporting date/time are **station-local**, not guaranteed to match
UTC accumulation boundaries. The viewer selects a nearby reporting date and
labels the true 24h duration explicitly. METAR reports are matched to
observation valid time and carry a time window. No future observations,
negative values, or invented zero values are plotted. Missing source files
are indicated in the overlay status instead of reported as zero observations.

Prerequisite: converter **v1.4.80** publishes
`data/precip_snow_reports/daily/YYYYMMDD.json` and
`data/precip_snow_reports/hourly/YYYYMMDDHH.json` on RZDM.
No conversion of gridded weather forecasts is required to use these overlays.

**Reflectivity + Ptype analysis:** RRFS/REFS prefer matching MRMS composite
reflectivity + RAP F000 ptype; fallback to RAP categorical precip type when
MRMS is unavailable (native RAP reflectivity is not in current archive).
GFS/AI prefer MRMS + valid-time GFSv16 F000 ptype and fallback to matching
GFSv16 F000 reflectivity + ptype. Speculative prefetch cannot mutate the
active analysis-panel source, and it preloads the composite constituents.

Offline tests: `node tests/test_amount_report_overlay.js` and
`node tests/test_refc_ptype_analysis.js`.
