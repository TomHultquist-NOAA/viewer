#!/bin/sh
# Repair only files explicitly shipped by this EVU viewer release.
# Do NOT chmod forecast Zarr stores or arbitrary files under data/.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
[ -f "$ROOT/index.html" ] && [ -f "$ROOT/js/viewer.js" ] && [ -f "$ROOT/packaged_static_files.txt" ] || {
  echo "ERROR: viewer release manifest missing" >&2; exit 1;
}
chmod 755 "$ROOT"
for d in js css data tests tools; do
  [ ! -d "$ROOT/$d" ] || chmod 755 "$ROOT/$d"
done
while IFS= read -r relative; do
  [ -n "$relative" ] || continue
  case "$relative" in /*|../*|*/../*|*'/..') echo "Invalid release path $relative" >&2; exit 1;; esac
  [ -f "$ROOT/$relative" ] || continue
  case "$relative" in
    *.sh|update_maplibre_vendor*.py|install_map_data.py|highway_tile_core.py|install_tiger_highways.py|install_terrain_dem.py|install_three_vendor.py|validate_viewer_install.py)
      chmod 755 "$ROOT/$relative";;
    *) chmod 644 "$ROOT/$relative";;
  esac
done < "$ROOT/packaged_static_files.txt"
# The v6 files are downloaded separately, so limit repairs to their expected names.
if [ -d "$ROOT/vendor-v6" ]; then
  chmod 755 "$ROOT/vendor-v6"
  for f in maplibre-gl.js maplibre-gl-worker.js maplibre-gl.mjs maplibre-gl-worker.mjs maplibre-gl.css maplibre-v6-assets.json; do
    [ ! -f "$ROOT/vendor-v6/$f" ] || chmod 644 "$ROOT/vendor-v6/$f"
  done
fi
if [ -d "$ROOT/vendor-three" ]; then
  chmod 755 "$ROOT/vendor-three"
  for f in three.module.js three.core.js three-assets.json; do
    [ ! -f "$ROOT/vendor-three/$f" ] || chmod 644 "$ROOT/vendor-three/$f"
  done
fi
echo "Viewer static asset permissions repaired; forecast data left untouched."
