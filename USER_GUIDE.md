# OMD EVU Model Viewer — User Guide

**Viewer version 1.1.40**

The OMD EVU Model Viewer displays weather model forecasts and available verifying analyses side by side. The panels share a geographic view, making it easier to compare different models and forecast hours. The default layout includes RRFS, HRRR, REFS members, REFS Mean, and an Analysis panel.

## Getting started

1. Choose a **Model set**, **Field**, and model **Cycle** (initialization time, in UTC).
2. Choose an **F-hour** to display the forecast. For example, F024 is 24 hours after initialization. Each panel displays its valid time.
3. Zoom or pan any map to focus on an area. The other panels follow the same view.
4. Use **Previous**, **Next**, **Play/Pause**, and **Speed** to move through the forecast. A panel indicates when the requested data are unavailable.

The Field menu groups related weather variables, including radar, precipitation type, surface weather, snowfall, upper air, and severe-weather parameters.

**Model sets:** RRFS/REFS contains nine panels and supports hourly forecast lead navigation and an optional floating two-panel difference. GFSv16/GFSv17 contains six panels (two forecasts, matching GFSv16 F000 analysis, and three precomputed differences), with three-hourly forecast lead navigation. F000 verifying analysis exists only at matching synoptic valid times, and all six GFS panels depend on published catalogs and Zarr stores. Controls for maps, shading, overlays, point inspection, and exporting follow the same interface, subject to each field’s actual availability.

## Map controls and shortcuts

| Action | How to do it |
| --- | --- |
| Change forecast hour | Left/Right arrows or Previous/Next controls |
| Play or pause | Spacebar or Play/Pause |
| Change model cycle | Up/Down arrows (when not typing in a control) |
| Zoom and pan | Scroll/trackpad and drag; touch gestures where supported |
| Scroll through models on a phone | Swipe vertically using the **↕ Scroll** rail on the right edge of any panel; tapping it advances to the next model |
| Open a point chart on a phone | Touch and hold a fixed map location for about 0.6 seconds, then select **Time series** or **Sounding** |
| Change projection | Choose **2D** or **Globe** |
| Return to the original map | Select **Reset view** |
| Focus on one model | Use its panel-expand control |
| Close an open menu | Press **Escape**, where supported |

On phones, use the slim **↕ Scroll** rail at the right edge of any model panel to scroll the page without accidentally panning the map. A tap on the rail advances to the next panel. Swiping directly on a weather map continues to pan/zoom that map. When the device has sufficient WebGL resources, all nine configured maps are initialized without having to scroll each one into view. On resource-limited devices, off-screen maps may pause and reactivate as needed.

You can switch between dark and light appearance. On desktop, the controls can be placed at the top or left side. **Share** copies a link to the current field, forecast hour, and map view.

**Map appearance:** Map outlines and Map background have independent checkboxes, both enabled by default. Turning off Map outlines removes coastline, boundary, and county lines. Turning off Map background uses solid black in light mode or solid white in dark mode behind the weather shading. On desktop, **right-click anywhere inside the checkbox label box** (including its text or padding) for Map outlines, Map background, Contours, Wind, Height, or 850-hPa Temp to open the appearance editor. Choose a solid color and line thickness; use Reset for the default. Normal left-clicking still turns each overlay on and off. Appearance preferences are saved in the browser. Observation markers are not restyled. Map background controls the fill color; its thickness slider does not change map-outline width. Map outlines has its own independent thickness setting, saved for the selected field and model set.


## Right-click: time series and sounding

**On a desktop, right-click a location on a model or analysis map; on a touch device, press and hold that location for about 0.6 seconds without moving your finger.** Then select one of these tools. Both open a floating chart window that you can move or resize. Use the **download icon** in the chart header to save a PNG. Open soundings and point time series change their chart colors immediately when the viewer switches between light and dark modes; saved PNGs reflect the active theme without reloading the chart data.

**Time series** plots the current field at the clicked location across the full forecast cycle. It stays tied to the chosen model, field, location, and cycle, even if you subsequently change what is displayed in the viewer. Instantaneous quantities and run-to-date totals are shown as **lines**; time-period precipitation and snowfall accumulations (such as 1-, 3-, 6-, and 24-hour totals) are shown as **bars**. Rolling accumulation intervals can overlap, so adjacent bars should not be added together. Unavailable hours are not zero. The Y-axis uses rounded, whole-number ticks for most fields, retaining decimals for precipitation and other quantities where sub-unit differences matter. The data-availability note is separated from the forecast lead-time axis label, and the vertical/horizontal grid lines are visible in either display theme. It may take a moment to load the full series; progress is shown in the chart window. For Reflectivity with Ptype, the series plots reflectivity (dBZ), not the precipitation-type category.

**Sounding** displays a Skew-T / Log-P sounding at the clicked location, with **red temperature**, **green dewpoint**, correctly oriented **meteorological wind barbs**, a roomier **wind hodograph**, and a **model diagnostics** panel that includes both 0–1 km and 0–6 km bulk shear (when published). When available, it uses the newer pressure-level profiles collected by the converter, extending up to 100 hPa. The diagnostics box samples model-grid CAPE, helicity, and **0–1 km / 0–6 km bulk shear** values when published. These values are sampled independently from the published model grids, not calculated from the profile winds. Basic surface and level-summary information is also displayed. The Skew-T uses a practical −50°C to +50°C near-surface temperature axis and a header spaced above the plot. Hodograph wind-speed ring labels are kept clear of the cardinal directions. The dry-adiabat and mixing-ratio guides remain visible in both light and dark mode, while the valid date/time and latitude/longitude stay anchored within the chart during refreshes. The sounding **updates automatically when the forecast hour or cycle changes**, including during playback. Its chosen location and model remain the same.

An **approximate most-unstable (MU) parcel trace** appears as a dashed gold line when the native profile has enough temperature and dewpoint levels. It selects the highest equivalent potential temperature in the lowest 300 hPa of usable moisture data, lifting dry adiabatically to the LCL and approximately moist adiabatically above. Its starting pressure and LCL are noted below the diagnostics, and it is omitted for sparse or incomplete moisture profiles. It is a qualitative approximation: no parcel-derived CAPE/CIN or authoritative convective diagnostics are implied.

The sounding window reports how many temperature, dewpoint, and wind levels are available. **REFS Mean uses its own operational ensemble-mean profile**, including time-lagged members, but has relatively few available pressure levels. REFS member profiles may also have gaps. RAP analysis soundings are available at their corresponding hourly valid times when published.

**Sounding limitations:** Full profiles may not yet be available for older cases or every forecast hour. In that situation the viewer uses the earlier, limited-level sounding when possible, and labels it as a sparse fallback. Profile data are sampled from a coarser geographic grid than the maps, so they may not represent local terrain or sharp weather boundaries. Some diagnostics may be unavailable, and any shown values are only as good as the published fields for that source and hour. With a compatible converter, native surface pressure allows below-ground isobaric levels to be excluded, and native 2-m temperature and dewpoint anchor the profile at the ground. Older profiles without surface pressure are clearly identified as not terrain-screened; missing levels are not invented. These soundings are best used for visual case-study exploration, **not operational parcel diagnostics or safety-critical decisions**. Desktop right-click and mobile touch-and-hold use the same data sources and open the same charts. On small mobile screens, the chart occupies most of the available screen width; the header has Close and Save controls.

## Fields, precipitation type, and snowfall

**Precipitation analysis selection:** The Analysis panel initially uses the available hourly **MRMS** precipitation analysis. As delayed **NCEP Stage IV 1-hour QPE** becomes available, it automatically prefers Stage IV for each 1-, 3-, 6-, 24-, or 48-hour precipitation interval, or cycle-to-date accumulated precipitation, **only if all required Stage IV hours are present**. Otherwise, the corresponding complete MRMS interval is retained. Stage IV and MRMS are never mixed within a total. If neither source has a complete interval, the panel reports unavailable data instead of filling gaps with zero. The active source is labeled on analysis images. The same source decision applies to point time series and difference maps; Stage IV comparisons require the published aligned-analysis files. MRMS remains the source for composite reflectivity and precipitation rate. Longer Stage IV totals here are sums of its one-hour QPE fields, not native Stage IV multi-hour mosaic products.

**Precipitation-type labels are model-specific:** HRRR is **Derived precipitation type**, RRFS and REFS members are **Dominant precipitation type**, and REFS Mean is **Ensemble dominant precipitation type**. These exact terms appear in panel titles and per-panel PNG/GIF labels. The comparison-wide legend uses the neutral description **Precipitation type (model-specific)** because all models share one categorical color scale.

**REFS Mean PMM products:** composite reflectivity is displayed as **PMM composite reflectivity**. Accumulated precipitation is labeled **PMM accumulated precipitation** when the published field comes from the PMM precipitation source. The viewer does not infer PMM from a generic ensemble-mean field; older data stores may need the converter's targeted PMM precipitation repair before they contain the correct source data.

**Reflectivity with Ptype** appears below Precipitation type in the Radar menu. It colors model reflectivity by forecast precipitation type: green progressing into yellow/orange for stronger rain echoes, blue for snow, pink for freezing rain, purple for sleet, and amber for mixed precipitation. Both reflectivity and precipitation type must be available for the chosen hour.

**Precipitation rate** is displayed in inches per hour (in/hr), including map values, the colorbar, point time series, and PNG/GIF exports. Stored values are unchanged.

**Optional grid interpolation:** use the **Interpolate** checkbox beside Image opacity to apply GPU bilinear filtering to continuous scalar-field shading. It is **on by default in the GFS model set** for eligible continuous fields, and **off by default in RRFS/REFS**. Each model set remembers its own preference in the current browser. This blends the four surrounding grid values for display only; it does not change stored Zarr values, point sampling, time series, sounding data, contours, or calculations. Categorical precipitation type and the hybrid **Reflectivity with Ptype** field retain nearest-neighbor rendering so category boundaries and codes are not blended. PNG/GIF exports use the same setting as the live panels.

Snowfall and precipitation fields include hourly, multi-hour, and accumulated options where available. Some totals need a complete sequence of earlier data, so a missing input can make a later accumulation unavailable. Missing data are **not** treated as zero.

For **NOHRSC snowfall** in the Analysis panel, 6-hour analyses are generally valid at 00/06/12/18 UTC and 24-hour analyses at 00/12 UTC. A 48-hour total uses two available 24-hour periods; the accumulated total adds consecutive 6-hour periods beginning after model initialization. There are no native 1-hour or 3-hour NOHRSC plots. Small, isolated snowfall artifacts are filtered from the map shading, without changing reported values.

## Adjust the numerical colorbar

You can change the displayed range on most **numerical** colorbars without changing the underlying values.

1. **Click the numerical colorbar** to open the color-scale editor.
2. Move the **Minimum** and **Maximum** sliders, or type precise values into their adjacent entry boxes.
3. Select **Apply** to update the shading, **Cancel** (or Escape) to leave it unchanged, or **Reset default** to restore the original range. After applying a custom range, use the **circular-arrow reset icon** beside the colorbar title to restore defaults without opening the editor.

The full color palette stretches across the selected interval. For fields with a transparent near-zero interval, that single interval remains centered on physical zero as the minimum and maximum change; it does not drift with the original palette or create a second blank band. The new scale applies to panels showing that field and is included in exports. It remains while stepping through forecast hours but resets when the page is reloaded. **CAPE colorbars use familiar round labels (such as 500, 1000, and 1500 J/kg)**. **Categorical precipitation-type legends cannot be adjusted** this way.

## Overlays and transparency

The **Shear & helicity** field group displays 0–1/0–6 km bulk shear and
0–1/0–3 km storm-relative helicity (SRH). Default color scales are **0–60 kt for 0–1 km** and **0–90 kt for 0–6 km**; use the numerical colorbar to change them. On **bulk shear**, the **Shear barbs**
checkbox displays the upper-minus-lower wind vector difference as conventional
wind barbs, with 5/10/50-knot markings. Their shafts point opposite the
downshear direction, following wind-barb orientation conventions; the barbs
describe shear, **not** wind at a single level. On **SRH**, the **Storm motion barbs**
checkbox controls native Bunkers right-moving storm-motion barbs, also in knots.
All overlays follow synchronized panels, pan/zoom operations, and panel PNG
exports, and the severe-weather checkbox state is remembered independently
of other wind overlays.

The overlays require native U/V components in the published Zarr catalog for
that model and hour. If a source omits them, the corresponding overlay is
absent rather than simulated. The RAP analysis requires the latest converter
and missing-field recovery for older analysis hours to publish native 0–1 km and 0–6 km shear components. Native RAP 0–1 km components are available in Converter v1.4.1 when provided in the source GRIB inventory. A missing
barb overlay does not imply missing scalar shading.

Depending on the field, you can enable height or pressure contours, wind barbs, and contours of the shaded field. **Numerical CAPE, shear, storm-relative helicity, updraft helicity, also support shaded-field contours**, with conventional rounded value intervals that become finer at close zoom. Categorical precipitation-type fields do not support these numerical contours. **For 500-hPa absolute-vorticity shading, RRFS and individual REFS members use a modest display-only smooth, while HRRR and REFS Mean use an even lighter smooth** to make plots easier to compare. The stored fields and point-sampled values are unchanged. **Small, field-specific values near zero are transparent** where a clear background is meteorologically useful: below 10 J/kg for CAPE, below 2 kt for wind speed/components and bulk shear, within ±10 m² s⁻² for SRH, within ±5 m² s⁻² for updraft helicity, within ±1 × 10⁻⁵ s⁻¹ for 500-hPa absolute vorticity, and below 1% for snow cover/frozen-precipitation percentage. The exact neutral interval is tied to physical zero and remains a single interval when the numerical colorbar range changes. Relative humidity remains shaded down to 0% because very dry air is a meaningful meteorological signal. Difference maps also become transparent close to zero. This lets the underlying map background show through in dark and light modes, without changing the meteorological data. Temperature and MSLP shading remain continuous because zero is not a no-weather threshold for those fields. The available overlay checkboxes share compact rows when space permits and wrap when necessary. Report counts appear below the switches. The available options appear with the field controls. Use **Image opacity** to fade the weather shading without fading geographic outlines, contours, wind barbs, or observation markers. Applicable overlays are also included when exporting plots.

## Weather observations and storm reports

On all **Radar & precip. type** fields, enable **METAR** to display colored circles or **mPING** to display triangles. Their colors indicate reported rain, snow, freezing rain, sleet, or mixed precipitation. Reports are usually selected from within about 30 minutes of the forecast valid time.

On supported composite-reflectivity, shear/helicity, or severe-weather maps, enable **SPC reports** to display preliminary tornado (red), wind (blue), and hail (green) circles. The selected reports are shared by **all active panels**, including RRFS, HRRR, REFS members, REFS Mean, and Analysis, for the common forecast valid time. Select a report to see any available details. Reports are hidden by default.

On all **Radar & precip. type**, **Shear & helicity**, and **Instability & severe storms** fields, enable **GLM lightning** to display satellite-observed lightning flash centroids from the **preceding 60 minutes**, ending at the forecast valid hour. The age colors indicate **0–15 min (pink)**, **15–30 min (orange)**, **30–45 min (cyan)**, and **45–60 min (violet)** before that valid hour. The selected overlay remains enabled across fields and page reloads. The flash locations are satellite-detected optical lightning, **not individual cloud-to-ground strikes**; age is measured relative to the model valid hour, not the current wall-clock time. Choose a dot to see its timestamp and originating satellite. Published GLM observation hours must be generated by the companion collector; if data are missing, the control reports **GLM data unavailable**, without implying there was no lightning. Converter 1.4.13 applies the configured retention period to unprotected local and published hours while preserving valid hours covered by protected historical cases. Age colors apply to live maps and panel PNG/GIF exports.

**Limitations:** Reports may be delayed, incomplete, revised, or absent. Future forecast hours cannot yet have verifying observations. A blank area does not mean no weather occurred. Some accumulated severe-weather fields display reports over a longer period than the most recent hour.

## Compare two panels

In **RRFS/REFS mode**, select the comparison checkboxes beside **two compatible panel titles** to open a **Difference** map. In **GFS mode**, the three difference panels are already included, and their datasets are precomputed by the converter. All difference panels show shaded signed differences and geography **without meteorological contours, wind barbs, height isolines, or temperature overlays**, irrespective of the normal panel toggles. For a floating RRFS/REFS comparison, the result is **first selected panel minus second selected panel**. On opening, that floating difference window adjusts its map area to match the selected panel's aspect ratio and geographic footprint, so both horizontal and vertical extents agree as closely as the screen permits. The floating window can be resized freely afterward. Resizing the difference window does not, by itself, reveal counties that are hidden at the corresponding panel scale. County and other geographic boundary visibility in exported difference PNGs is frozen from the live map at the moment of capture, so enlarging the PNG cannot introduce counties that were hidden on screen. Standard unrotated 2D difference-map PNGs also use a faster projection path without changing image resolution, field sampling, color scales or geographic accuracy; Globe and rotated views retain exact per-pixel projection. Saved difference maps use the same plot-area geometry as individual panel PNGs at the selected output size, reducing differences in geographic crop. Fit and Fill still determine whether edges are shown or cropped, and independently resized or zoomed maps retain their chosen view. Difference-map colorbars use whole-number labels for most fields; fractional labels are retained for small precipitation and other quantities requiring sub-unit precision. The same ticks appear in exported difference PNGs. The difference uses fixed field-specific near-zero transparent ranges and consistent signed colorbar limits through the forecast period. The difference follows changes to the forecast hour and synchronized panel view; you can zoom the floating map independently for close inspection. Use the window's download icon to save a PNG. Incompatible or missing fields cannot be compared.

## Save PNGs and animated GIFs

Use a panel's **download icon** to export one plot, or **Export all panels** for a comparison image or animation. All exported PNGs and GIFs receive a unique UTC timestamp and short suffix in their filenames, so repeated downloads keep distinct names instead of browser-added `(1)` and `(2)` suffixes. Choose the image proportions (**16:9** or **4:3**) and whether to **Fit** the entire map area or **Fill** the frame (which can crop edges). Titles, times, legends, and applicable overlays are included. Exported METAR, mPING, and SPC Local Storm Report markers are slightly enlarged for presentation readability; on-screen marker sizes do not change. Geographic outlines in PNG and GIF exports retain their separate two-tone outline treatment: a contrasting casing with a themed inner stroke. **Live maps use one clean stroke without the export halo.** This keeps coastlines and political boundaries visible over **both dark and bright weather shading** in either viewer theme while preserving a cleaner appearance than the older export-specific treatment. This applies to individual, all-panel, and difference-map exports. County visibility is frozen at the live-map zoom for each export, preventing hidden counties from appearing in PNG and GIF captures; map geography and the on-screen visibility thresholds are unchanged.

Select **Large labels** when preparing images for presentations. It enlarges the model or analysis title, time information, and exported colorbar title and tick numbers in exported PNGs and GIFs, without changing the live viewer. The difference-map title and time line use the same normal and large font sizes as individual-panel exports.

For animated GIFs, the defaults are:

| Resolution | Default range | Maximum frames |
| --- | --- | ---: |
| Standard (1200 px) | F000–F024 | **25** |
| High (1600 px) | F000–F024 | **25** |

Both resolutions use a shared **25-frame maximum** for single-panel and all-panel GIFs. The default delay is **700 milliseconds per frame**. You can change the forecast-hour range, step, and delay. The final frame stays visible slightly longer. Larger or longer GIFs may take more time to export.

Analysis panels use titles such as **Analysis · NOHRSC · 24-hour snowfall**, with the **valid time** alone on the subtitle.

## Data availability and troubleshooting

- **A panel says missing:** The selected model, variable, hour, or verifying analysis may not be available. Try another hour or source. Some accumulated totals require every contributing period.
- **An analysis is missing:** Its valid time may not be supported, the analysis may not be published yet, or an earlier required period may be missing. RAP is an hourly model analysis and is only shown for supported fields at valid hours that have been collected and published. The site administrator can check a specific case with the RAP diagnostic page.
- **Changes do not appear after deployment:** Refresh the page to load the latest viewer.
- **A plot or map fails to load:** The viewer includes a **Diagnostics** page for technical troubleshooting; contact the site maintainer if the issue persists.

The viewer is intended for forecast evaluation and comparison, not for issuing official warnings. **All displayed times are UTC.**



### Sounding surface wind vectors

Native soundings use **2-m temperature and dewpoint** and **10-m U/V wind** at the model's native surface-pressure anchor, in addition to the available native isobaric levels. The levels readout counts a surface wind level only when **both** 10-m vector components are present. This is a display anchor at surface pressure, not a claim that 10-m wind was measured at 2-m height. Older profile stores need the converter's surface-only upgrade before the new level is available. Below-ground pressure levels remain excluded.


Sounding-chart footnotes explain that the MU parcel uses an **approximate pseudo-adiabatic path** and does **not** compute CAPE/CIN; the terrain-screening note reports whether native surface pressure was available. These footnotes appear on separate fitted lines beneath the right-hand diagnostics card. The Skew-T axis tilt has also been moderated slightly.
