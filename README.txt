OMD EVU Model Viewer — autumnplot-gl Version 7.10
=================================================

PNG GEOGRAPHY ASPECT-RATIO FIX
------------------------------
Exported map images are no longer stretched into fixed-aspect rectangles.
The single-panel PNG height automatically matches the active map framebuffer
aspect ratio. Multi-panel exports preserve each map's original proportions
and center them in the layout, adding margins only where necessary.

WebGL pixels are read using the native drawing-buffer dimensions. The map,
meteorological field, coastlines, and state/county boundaries all keep their
correct geographic shapes; titles, legend and times remain unchanged.

KEYBOARD NAVIGATION
-------------------
MapLibre keyboard map navigation is disabled in both 2-Dimensional and Globe
views. Left/right arrows navigate forecast hours without panning the map;
up/down arrows change model cycles. Click-drag and wheel zoom still work.

WEBGL PNG EXPORT FIX
--------------------
Individual-panel Save PNG and Save all panels PNG now capture the MapLibre GL
frame *inside the map render event*. The exporter reads the WebGL drawing
buffer directly, flips its rows, and encodes the map before it can be cleared.
This avoids blank images containing only titles and legends. An empty WebGL
frame produces a clear error rather than a silently empty exported map.

The field palettes, Zarr reader, native GPU plotting, map layout, and
geography are unchanged from Version 7.8.

DEPLOYMENT
----------
Extract contents directly into the existing dynamic_viewer web directory.
Preserve your vendor/, data/catalog.json, data/*.zarr/, and customized
config.json. No WCOSS2 reprocessing or new vendor files are required.
Perform a hard refresh after uploading (Ctrl+Shift+R).
