# OMD EVU Model Viewer — User Guide

**Viewer version 1.1.10 · October 30, 2026**

The OMD EVU Model Viewer displays weather model forecasts and available verifying analyses side by side. The panels share a geographic view, making it easier to compare different models and forecast hours. The default layout includes RRFS, HRRR, REFS members, REFS Mean, and an Analysis panel.

## Getting started

1. Choose a **Model set**, **Field**, and model **Cycle** (initialization time, in UTC).
2. Choose an **F-hour** to display the forecast. For example, F024 is 24 hours after initialization. Each panel displays its valid time.
3. Zoom or pan any map to focus on an area. The other panels follow the same view.
4. Use **Previous**, **Next**, **Play/Pause**, and **Speed** to move through the forecast. A panel indicates when the requested data are unavailable.

The Field menu groups related weather variables, including radar, precipitation type, surface weather, snowfall, upper air, and severe-weather parameters.

## Map controls and shortcuts

| Action | How to do it |
| --- | --- |
| Change forecast hour | Left/Right arrows or Previous/Next controls |
| Play or pause | Spacebar or Play/Pause |
| Change model cycle | Up/Down arrows (when not typing in a control) |
| Zoom and pan | Scroll/trackpad and drag; touch gestures where supported |
| Change projection | Choose **2D** or **Globe** |
| Return to the original map | Select **Reset view** |
| Focus on one model | Use its panel-expand control |
| Close an open menu | Press **Escape**, where supported |

You can switch between dark and light appearance. On desktop, the controls can be placed at the top or left side. **Share** copies a link to the current field, forecast hour, and map view.

## Right-click: time series and sounding

**Right-click a location on a model or analysis map** and select one of these tools. Both open a floating chart window that you can move or resize. Use the **download icon** in the chart header to save a PNG.

**Time series** plots the current field at the clicked location across the full forecast cycle. It stays tied to the chosen model, field, location, and cycle, even if you subsequently change what is displayed in the viewer. Instantaneous quantities and run-to-date totals are shown as **lines**; time-period precipitation and snowfall accumulations (such as 1-, 3-, 6-, and 24-hour totals) are shown as **bars**. Rolling accumulation intervals can overlap, so adjacent bars should not be added together. Unavailable hours are not zero. It may take a moment to load the full series; progress is shown in the chart window. For Reflectivity with Ptype, the series plots reflectivity (dBZ), not the precipitation-type category.

**Sounding** displays a Skew-T / Log-P sounding at the clicked location, with **continuous red temperature**, **continuous green dewpoint**, **wind barbs**, and a compact **diagnostics box**. When available, it uses the newer pressure-level profiles collected by the converter, extending up to 100 hPa. The diagnostics box can include sampled CAPE, helicity, and shear values when those fields are available, along with basic surface and level-summary information. The sounding **updates automatically when the forecast hour or cycle changes**, including during playback. Its chosen location and model remain the same.

The sounding window reports how many temperature, dewpoint, and wind levels are available. **REFS Mean uses its own operational ensemble-mean profile**, including time-lagged members, but has relatively few available pressure levels. REFS member profiles may also have gaps. RAP analysis soundings are available at their corresponding hourly valid times when published.

**Sounding limitations:** Full profiles may not yet be available for older cases or every forecast hour. In that situation the viewer uses the earlier, limited-level sounding when possible, and labels it as a sparse fallback. Profile data are sampled from a coarser geographic grid than the maps, so they may not represent local terrain or sharp weather boundaries. Some diagnostics may be unavailable, and any shown values are only as good as the published fields for that source and hour. Low levels below terrain are not automatically screened; missing levels are not invented. These soundings are best used for visual case-study exploration, **not operational parcel diagnostics or safety-critical decisions**. Right-click is primarily intended for desktop devices with a mouse.

## Fields, precipitation type, and snowfall

**Reflectivity with Ptype** appears below Precipitation type in the Radar menu. It colors model reflectivity by forecast precipitation type: green progressing into yellow/orange for stronger rain echoes, blue for snow, pink for freezing rain, purple for sleet, and amber for mixed precipitation. Both reflectivity and precipitation type must be available for the chosen hour.

Snowfall and precipitation fields include hourly, multi-hour, and accumulated options where available. Some totals need a complete sequence of earlier data, so a missing input can make a later accumulation unavailable. Missing data are **not** treated as zero.

For **NOHRSC snowfall** in the Analysis panel, 6-hour analyses are generally valid at 00/06/12/18 UTC and 24-hour analyses at 00/12 UTC. A 48-hour total uses two available 24-hour periods; the accumulated total adds consecutive 6-hour periods beginning after model initialization. There are no native 1-hour or 3-hour NOHRSC plots. Small, isolated snowfall artifacts are filtered from the map shading, without changing reported values.

## Adjust the numerical colorbar

You can change the displayed range on most **numerical** colorbars without changing the underlying values.

1. **Click the numerical colorbar** to open the color-scale editor.
2. Move the **Minimum** and **Maximum** sliders, or type precise values into their adjacent entry boxes.
3. Select **Apply** to update the shading, **Cancel** (or Escape) to leave it unchanged, or **Reset default** to restore the original range. After applying a custom range, use the **circular-arrow reset icon** beside the colorbar title to restore defaults without opening the editor.

The full color palette stretches across the selected interval. The new scale applies to panels showing that field and is included in exports. It remains while stepping through forecast hours but resets when the page is reloaded. **CAPE colorbars use familiar round labels (such as 500, 1000, and 1500 J/kg)**. **Categorical precipitation-type legends cannot be adjusted** this way.

## Overlays and transparency

Depending on the field, you can enable height or pressure contours, wind barbs, and contours of the shaded field. **Numerical CAPE, shear, storm-relative helicity, updraft helicity, and severe-weather composite fields also support shaded-field contours**, with conventional rounded value intervals that become finer at close zoom. Categorical precipitation-type fields do not support these numerical contours. **For 500-hPa absolute-vorticity shading, RRFS and individual REFS members use a modest display-only smooth, while HRRR and REFS Mean use an even lighter smooth** to make plots easier to compare. The stored fields and point-sampled values are unchanged. **Zero or very weak values are transparent** for fields where a clear background is useful (including CAPE, shear, SRH, wind speeds, severe-weather indices, and near-zero 500-hPa vorticity). Difference maps also become transparent close to zero. This lets the underlying map background show through in dark and light modes, without changing the meteorological data. Temperature and MSLP shading remain continuous because zero is not a no-weather threshold for those fields. The available overlay checkboxes share compact rows when space permits and wrap when necessary. Report counts appear below the switches. The available options appear with the field controls. Use **Image opacity** to fade the weather shading without fading geographic outlines, contours, wind barbs, or observation markers. Applicable overlays are also included when exporting plots.

## Weather observations and storm reports

On precipitation-type maps, enable **METAR** to display colored circles or **mPING** to display triangles. Their colors indicate reported rain, snow, freezing rain, sleet, or mixed precipitation. Reports are usually selected from within about 30 minutes of the forecast valid time.

On supported radar or severe-weather maps, enable **SPC reports** to display preliminary tornado (red), wind (blue), and hail (green) circles. The selected reports are shared by **all active panels**, including RRFS, HRRR, REFS members, REFS Mean, and Analysis, for the common forecast valid time. Select a report to see any available details. Reports are hidden by default.

**Limitations:** Reports may be delayed, incomplete, revised, or absent. Future forecast hours cannot yet have verifying observations. A blank area does not mean no weather occurred. Some accumulated severe-weather fields display reports over a longer period than the most recent hour.

## Compare two panels

Select the comparison checkboxes beside **two compatible panel titles** to open a **Difference** map. The result is **first selected panel minus second selected panel**. The difference follows changes to the forecast hour and view. You can inspect the values and use the window's download icon to save a PNG. Incompatible or missing fields cannot be compared.

## Save PNGs and animated GIFs

Use a panel's **download icon** to export one plot, or **Export all panels** for a comparison image or animation. Choose the image proportions (**16:9** or **4:3**) and whether to **Fit** the entire map area or **Fill** the frame (which can crop edges). Titles, times, legends, and applicable overlays are included.

Select **Large labels** when preparing images for presentations. It enlarges the model or analysis title and time information in exported PNGs and GIFs, without changing the live viewer.

For animated GIFs, the defaults are:

| Resolution | Default range | Maximum frames |
| --- | --- | ---: |
| Standard (1200 px) | F000–F024 | **25** |
| High (1600 px) | F000–F018 | **19** |

The default delay is **700 milliseconds per frame**. You can change the forecast-hour range, step, and delay. The final frame stays visible slightly longer. Larger or longer GIFs may take more time to export.

Analysis panels use titles such as **Analysis · NOHRSC · 24-hour snowfall**, with the **valid time** alone on the subtitle.

## Data availability and troubleshooting

- **A panel says missing:** The selected model, variable, hour, or verifying analysis may not be available. Try another hour or source. Some accumulated totals require every contributing period.
- **An analysis is missing:** Its valid time may not be supported, the analysis may not be published yet, or an earlier required period may be missing. RAP is an hourly model analysis and is only shown for supported fields at valid hours that have been collected and published. The site administrator can check a specific case with the RAP diagnostic page.
- **Changes do not appear after deployment:** Refresh the page to load the latest viewer.
- **A plot or map fails to load:** The viewer includes a **Diagnostics** page for technical troubleshooting; contact the site maintainer if the issue persists.

The viewer is intended for forecast evaluation and comparison, not for issuing official warnings. **All displayed times are UTC.**
