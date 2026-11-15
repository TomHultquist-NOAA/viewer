# v1.2.97 quantitative observations

The two controls in Data overlays remain independent: **CoCoRaHS amounts**
and **METAR amounts**. The second uses Synoptic Data (ASOS/AWOS network)
when the server has Converter v1.4.88, the Synoptic API entitlement and
explicit publication permission. NOAA AWC CSV is no longer the default.

CoCoRaHS readings are daily station-local observation reports, converted to
UTC only when the converter has unambiguous timezone metadata. For example,
a 07:00 Eastern Standard Time 24h total ends at 12 UTC; a 07:00 Central
Standard Time report ends at 13 UTC. Such reports display on the matching
24-hour forecast accumulation frame, not every hour or on 1h fields.

METAR precipitation totals use Synoptic's defined 1/3/6/24/48h UTC
accumulation windows; independent station snow depth and 24-hour snowfall
values are included when the API reports them. Never interpret snow depth
change as measured new snowfall. The popup identifies the source, period,
reported end time and variable. Source prefixes are not printed on map labels.

Existing v1.2.96 contrast, popup foreground, PNG/GIF and mobile behavior
remain unchanged. If the server still has older data, a historical report
may lack an end_utc and will be omitted rather than assigned an arbitrary hour.
