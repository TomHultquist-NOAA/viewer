# OMD EVU Viewer v1.2.96 — exact-hour amount observations

- Precipitation and snowfall report labels appear only on a forecast valid hour
  matching their report's UTC accumulation-end time (within 30 minutes) and the
  requested accumulation duration, rather than being repeated throughout a day.
- CoCoRaHS reports with only local observation times do not have a reliable UTC
  hour. They remain available in the converter's report archive but are withheld
  from exact-hour plot labels until an explicit, timezone-aware observation end
  is provided.
- New-snow amount labels exclude simple snow-depth increases.
- Map labels use readable white numerals on dark backgrounds, with no C/M
  source prefixes. The popup includes station, source, duration and report time.
- Clicking a report brings its popup above the observation-label canvas.
- The rest of the viewer (including mobile performance, MSLP and surface
  weather overlays, exports, and low-track research display) is unchanged.

Deploy the full distribution, not only index.html. Pair with converter v1.4.87
for actual METAR accumulation end-times in newly generated report files.
