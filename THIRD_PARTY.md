# External components and design references

This repository packages viewer application sources, not the third-party
MapLibre, Three.js, or autumnplot-gl distributions. Install their matching runtime files
separately in `vendor-v6/`, `vendor-three/`, and `vendor/`; see `DEPLOY_LINUX.md` and the
self-contained vendor installer. Preserve the official licenses supplied by
their distributors.

- [Three.js](https://github.com/mrdoob/three.js) — optional single-context GPU geographic surface/forecast texture drape (MIT), pinned 0.187.0; installed using `install_three_vendor.py`.
- [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) — browser map,
  3D terrain and terrain-tile WebGL integration (BSD-3-Clause).
- [autumnplot-gl](https://github.com/tsupinie/autumnplot-gl) — fallback weather
  rendering and selected older export paths (see upstream license).
- [Weather Explorer / FIAB](https://github.com/tehoro/weather-explorer-web) —
  independent implementation inspired by its elapsed-time fading particle
  trails and GPU weather-color pipeline (MIT licensed upstream). Do not
  represent this viewer as affiliated with the upstream authors.

Forecast grids and optional geographic/terrain datasets have separate source
and usage terms. The user should review them before redistributing derived
assets. This file is not a license grant for the EVU application code; choose
an appropriate license separately if publishing the source publicly.

- [GeoNames](https://www.geonames.org/) — optional expanded city-label catalog built by `install_city_gazetteer.py`, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The importer filters and converts the data; the viewer displays attribution only when this catalog is enabled.
