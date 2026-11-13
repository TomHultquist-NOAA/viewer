# Expanded city labels (optional, Python 3.6.8 compatible)

The viewer includes a small local city list as a fallback. For more city labels
when zooming into North America, run the optional one-time GeoNames importer.
It replaces `data/cities.json` with a much larger local city list; it does not
change the model converter, cron jobs, Zarr stores, or map rendering dependencies.

```bash
python3 install_city_gazetteer.py
```

The importer downloads GeoNames `cities1000.zip` (cities with at least 1,000
residents and qualifying administrative seats), retains the detailed North
American/Caribbean entries including Alaska, Hawaii and Puerto Rico, and
includes major cities elsewhere. At wide zoom only major cities are labeled;
smaller places appear at closer zoom. Collision detection still suppresses
labels that would overlap. Right-click **Cities** in **Map overlays** to tune
label size and density. **Cities** starts OFF unless you enabled it previously.

If the processing server cannot reach the GeoNames download endpoint, download
`cities1000.zip` on another computer from:

https://download.geonames.org/export/dump/cities1000.zip

Transfer that ZIP to the server and run:

```bash
python3 install_city_gazetteer.py --source-zip /path/to/cities1000.zip
```

Or run the importer on any Python 3.6+ computer with `--output` pointing to a
local `cities.json`, then transfer that file to `data/cities.json` on the web
server. A failed import preserves the existing city list. Keep a copy of the
generated `data/cities.json` when updating the viewer if you do not want to
rerun the importer. The browser loads the list only when Cities is enabled;
no browser-side GeoNames request or external geocoding service is used.

**Attribution:** The optional expanded list is adapted from GeoNames data,
licensed CC BY 4.0: https://www.geonames.org/ and
https://creativecommons.org/licenses/by/4.0/. The viewer displays a GeoNames
credit when it uses that list. This program changes the source dataset by
filtering rows and retaining only labels, coordinates, population and ranks.

**Performance:** GeoNames is read at installation time only. Runtime filtering
uses four-degree geographic bins, bounded candidate lists and screen-space
collision rejection. If you deploy to a future data cloud, the static JSON
can be served from object storage/CDN without changing the user interface.

## Refreshing an updated city catalog (v1.2.29+)

City lists are generated independently of viewer releases. The viewer requests
`data/cities.json` with a per-load cache-busting query and `cache: no-store`
when **Cities** is first enabled, and then shares that parsed catalog across
all panels for the rest of the page session. After replacing the file on your
web server, reload the page to load the new version. No localStorage settings,
user preferences, Zarr caches, or vendor assets are cleared.

To check that the server has the expanded GeoNames file, open
`data/cities.json?check=<any-new-number>` directly in a browser. The JSON
should contain a `source` mentioning GeoNames and a `counts` object; the
original bundled fallback has neither. If even a unique URL returns stale
content, inspect upstream CDN/web-server caching rules; browser code cannot
override a reverse proxy configured to ignore cache-control or query parameters.

**Important when upgrading the viewer:** From v1.2.37 onward the viewer ZIP
omits `data/cities.json` entirely, so extracting it will not overwrite your
installed expanded GeoNames city catalog. For clean installations, provision
`data/cities.json` separately using `install_city_gazetteer.py`.
