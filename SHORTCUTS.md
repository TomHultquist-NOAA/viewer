# Viewer shortcuts

Quick reference for the OMD EVU Model Viewer · v1.2.15

## Keyboard and forecast navigation

| Action | Shortcut |
|---|---|
| Previous / next forecast hour | **Left / Right arrow** (GFS: 3 hours; AI / GFS / GEFS: 6 hours) |
| Previous / next model cycle | **Up / Down arrow**, preserving the same valid time by adjusting forecast lead |
| Play or pause | **Spacebar** |
| Close popups or difference window | **Escape**, where supported |

## Mouse, map and panels

| Action | Shortcut |
|---|---|
| Pan a map | **Left-drag** |
| Zoom in or out | **Mouse wheel / trackpad**; 2D zoom-out is not limited to the data extent |
| Box zoom | **Shift + drag**, where supported |
| Tilt and rotate the 2D map | **Ctrl + drag**, or **right-drag** where supported |
| Inspect synchronized point values | **Hover** over a weather map |
| Open point-inspection and sounding menu | **Right-click the map** |
| Edit overlay color, thickness and density | **Right-click anywhere in a toggle's label box** |
| Customize numeric color scale | **Click the colorbar** |
| Import custom .pal color table | **Right-click a numerical colorbar** (or click main bar, then Upload .pal) |
| Expand / restore a panel | **Panel expand icon** |
| Export a panel | **Download icon** |
| Copy current view link | **Share icon** |

## Mobile, themes and optional effects

| Action | How |
|---|---|
| Zoom / rotate | **Pinch / two-finger gestures**, where supported |
| Open point inspector | **Long-press** a model map |
| Scroll past map panels | Use the **Scroll rail** at the right edge of a panel |
| Terrain relief | Turn on **Terrain** (off by default; requires local DEM); right-click for terrain opacity, vertical exaggeration (0×–15×), sunlight direction and hillshade strength |
| Animate wind | Turn on **Wind tracers** for available meteorological U/V fields; **right-click** the toggle for color, thickness, particle density (0.5–10.0×, default 4×), and animation speed (0.25–5×, default 2×) |
| Restore view / cancel tilt | Select the **Reset icon** beside Map overlays; restores zero bearing and pitch |
| Switch light/dark appearance | Use the **theme icon** |

**Appearance preferences are theme-specific.** Right-click adjustments to overlay **color, thickness and density** affect only the currently selected dark or light mode. Map-outline preferences are also specific to the selected field and model set.

**Important:** 3D camera tilt does not require the Terrain toggle. Terrain uses locally hosted DEM tiles (installed separately) and shows loading/failure status beside the controls. Terrain and Image opacity are separate; weather shading is not automatically dimmed. Native elevation coloring needs a compatible MapLibre runtime. Tracers are time-faded, speed-colored streaks in a lightweight screen overlay; they do not change model data or static exports.

### Map overlays and Data Overlays

Map overlays stays in a compact menu; Data Overlays uses a menu when more than four options are available for the current field. **Wind tracers is a Data Overlays option.** Right-click **State/Country** or **Counties** to set their appearance. County boundaries are now controlled by the Counties checkbox, not by zoom. Right-click **Terrain** to adjust opacity and 0–15× mesh exaggeration independently of weather Image opacity. **Wind tracers** start off, default to 4.0× density when enabled, and can be adjusted to 10.0×. Fade and particle lifetime are based on real elapsed time, independent of monitor refresh rate. Self-hosted 3-D elevation tiles can be installed with `install_terrain_dem.py`; see README.

**MSLP:** Smoother 128-step pressure shading with dark State/Country outlines by default; right-click State/Country for a custom color.

**Wind tracer colors:** Right-click 10 m or pressure-level wind tracers → **Color by wind speed (knots)** (default) uses the wind-speed key; uncheck to specify a fixed color. Faster actual wind speeds produce faster particles. The separate **Animation speed** setting changes visual speed without changing U/V values or forecast playback.

**GFS soundings:** Native GFSv16/v17 multi-level profiles load from published `data/catalog_profiles.json` and GFS sounding Zarr stores. Sparse fallback means the selected profile/hour is unavailable; the GFS analysis panel uses valid-time GFSv16 F000.

**GFS snowfall:** **WEASD Change** is the default 10:1 estimate for both GFSv16 and v17; **Snow Precipitation** is a v17-only alternative. The v17−v16 SWE increase difference is comparable. Observed snowfall comes from NOHRSC for 6/24/48-hour or cycle-to-date periods (no independent 3-hour analysis). Depth change uses signed SNOD; no-data pixels remain transparent.


## Model-set comparison details

- **AI / GFS / GEFS:** 250, 300, 500, 700, 850, 925 and 1000 hPa upper-air plots when native data exist. The menu omits unsupported 2-m dewpoint and specific humidity.
- **Upper-air difference checkbox:** switches 250/300 Wind ↔ Height, 500 Height ↔ Vorticity, and 700/850/925/1000 Temperature ↔ Height. Titles and legends identify the selected difference field.
- **Wind tracers:** activate only for panels with a complete matching native U/V wind pair at that lead. Colored trails include a subtle outline to improve visibility.
- **Automatic inventory:** active catalogs are checked every 180 seconds by default while the tab is visible; no page reload or data processing is required.
- **Analysis precipitation:** CCPA → Stage IV → MRMS, first complete window with one source/grid/pass.


## Questions and comments

Questions and comments can be directed to [**Tom Hultquist**](https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=thomas.hultquist@noaa.gov), Office of Modeling and Development, Evaluation and Verification Unit.
