# EVU Highway Roads — Server-only installation (Python 3.6.8)

This replaces the *optional* full OpenStreetMap road-data installation with Census TIGER/Line primary and secondary road Shapefiles filtered to **RTTYP I, U, S only**: Interstate, U.S. and state-recognized highways. It includes all 50 states, Washington, D.C., and Puerto Rico. County highways and other roads are excluded (even if geometrically classified as secondary); roads with missing route-type labels may also be excluded.

No packages need to be installed. Python 3.6.8 standard library is sufficient. The **viewer update and the highway data installer are separate steps**; the viewer continues showing its existing wide-area Natural Earth roads until you generate the new data.

## Before starting

From the directory containing `index.html`:

```bash
python3 --version
python3 install_tiger_highways.py --all --dry-run
```

Ensure that the server can reach `https://www2.census.gov` via HTTPS, that the *destination* filesystem can hold the final road tiles, and that the scratch filesystem has space for at least one state's archive plus a SQLite temporary database. Exact space depends on the state and tile count; **do not assume nationwide tiles will fit**. The installer is sequential and deletes completed input archives by default.

## Run all 52 state/territory areas

```bash
python3 -u install_tiger_highways.py --all \
  --work-dir /path/to/available/scratch/highway_work \
  --remove-legacy 2>&1 | tee highway_install.log
```

Replace `/path/to/available/scratch/` with a writable existing directory. If your viewer filesystem has enough scratch space, simply run:

```bash
python3 -u install_tiger_highways.py --all --remove-legacy 2>&1 | tee highway_install.log
```

The script downloads one official `tl_2025_<FIPS>_prisecroads.zip` archive, filters by `RTTYP`, builds z7 and z10 JSON road tiles, merges the new area, records completion, and deletes that processed ZIP. The SQLite work database is removed after each area. **If a download fails**, rerun the same command; completed regions are skipped, and `.part` downloads may resume.

By design, `--remove-legacy` deletes `data/roads_osm/` **only after all 52 areas have been completed**. It never removes model data, DEM tiles, vendor libraries, settings, or Natural Earth roads. After all 52 areas are complete, `--remove-legacy` also deletes only the known obsolete prior OSM installer/manual and old versioned CSS file. It leaves active renderer code, weather files, DEMs, model data, and vendor packages alone.

## Verify

```bash
python3 install_tiger_highways.py --verify
python3 validate_viewer_install.py
```

Expected: PASS and `52 of 52 areas complete` for a full installation. Check `data/roads_highways/manifest.json` and the numbered `data/roads_highways/7/` and `data/roads_highways/10/` directories. Keep all of these files on the web server.

Refresh `index.html?build=1260`, enable Roads, and zoom in on a major/state highway. At small scales the viewer retains its Natural Earth fallback; when high-detail tiles are loaded they replace that overlay. The attribution should read U.S. Census Bureau TIGER/Line.

## Small-space incremental alternative

You can install just a few states first, preserving previous work:

```bash
python3 -u install_tiger_highways.py --states CA,NV,AZ,UT \
  --work-dir /path/to/available/scratch/highway_work
python3 install_tiger_highways.py --verify
```

Later run `--all`; completed regions will be skipped. Only use `--remove-legacy` when installing all areas and you want previously installed OSM tiles removed.

## Safe maintenance

- Download archives are removed after successful per-state conversion, unless `--keep-downloads` is specified.
- A failed or incomplete download is kept as `.part` for resumption. Remove such partials only when you intend to abandon or restart that download.
- The `highway_work/` folder can be removed *after a complete, verified run* if you no longer need resumption. Do not remove `data/roads_highways`.
- If disk becomes full, stop, preserve your partial installation, and rerun for the remaining areas after making space. The installed-state manifest prevents reprocessing completed states.
- If you reinstall an existing version, **do not overwrite `data/roads_highways/`** with an empty folder; it is not bundled with the viewer application ZIP.

Source: U.S. Census Bureau TIGER/Line 2025 Primary and Secondary Roads, https://www2.census.gov/geo/tiger/TIGER2025/PRISECROADS/ . Government-produced source data are in the public domain.
