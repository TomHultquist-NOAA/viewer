# Self-hosted MapLibre 6.16.0 — Linux deployment

No `pip`, npm, root or Apache configuration needed. This viewer now uses
`index.html` as the primary ES module entry point.

The MapLibre files downloaded for the old experimental preview can be reused:

```bash
python3 update_maplibre_vendor_v6.py --dest vendor-v6 --activate
python3 update_maplibre_vendor_v6.py --dest vendor-v6 --check
sh repair_viewer_permissions.sh
```

The `--activate` operation only copies the verified `maplibre-gl.mjs` and
`maplibre-gl-worker.mjs` to the `.js` extensions expected by the viewer, so
it does not contact a CDN. This addresses `.mjs` MIME limitations on web
servers where you cannot edit Apache configuration.

If the three MapLibre assets have not yet been downloaded, run:

```bash
python3 update_maplibre_vendor_v6.py --dest vendor-v6
```

Then open the viewer's normal `index.html`. To diagnose the GPU shader and
browser, open `renderer-diagnostics.html`. For rollback, restore an older full application release ZIP.

**Keep the existing `vendor/` folder** because autumnplot-gl is still used
when Terrain is off and for auxiliary plotting functions.
