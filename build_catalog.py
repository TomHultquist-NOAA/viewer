#!/usr/bin/env python3
"""Build browser-friendly catalog.json for rrfs_to_zarr_wcoss2.py output.

Standard library only. Run after converting GRIB2 to Zarr on WCOSS2.
The web server serves catalog.json and raw compressed Zarr chunks as static files.
"""
import argparse
import datetime as dt
import json
from pathlib import Path
import re
import sys

ID = re.compile(r'^rrfs_(\d{8})_(00|06|12|18)00\.zarr$')
CHUNK = re.compile(r'^(\d+)\.0\.0$')
SKIP = {'valid_time', 'forecast_hour', 'processed', 'latitude', 'longitude', 'x', 'y'}


def read_json(path):
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, required=True,
                        help='Directory containing rrfs_YYYYMMDD_HH00.zarr directories')
    parser.add_argument('--output', type=Path, default=None,
                        help='Catalog output (default DATA-DIR/catalog.json)')
    args = parser.parse_args()
    source = args.data_dir.resolve()
    if not source.is_dir():
        parser.error('Data directory does not exist: ' + str(source))
    output = args.output.resolve() if args.output else source / 'catalog.json'
    if output.parent != source:
        parser.error('--output must be in --data-dir so Zarr paths resolve alongside the catalog')

    datasets = []
    for root in sorted(source.glob('rrfs_*.zarr'), reverse=True):
        if not root.is_dir() or not ID.fullmatch(root.name):
            continue
        try:
            attrs = read_json(root / '.zattrs')
            group = read_json(root / '.zgroup')
            if group.get('zarr_format') != 2:
                print('Skipping non-Zarr-v2 dataset:', root, file=sys.stderr)
                continue
        except (OSError, ValueError) as e:
            print('Skipping unreadable store', root, str(e), file=sys.stderr)
            continue
        variables = []
        for var_dir in sorted(root.iterdir()):
            if not var_dir.is_dir() or var_dir.name in SKIP or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*', var_dir.name):
                continue
            try:
                zarr = read_json(var_dir / '.zarray')
                va = read_json(var_dir / '.zattrs') if (var_dir / '.zattrs').is_file() else {}
            except (OSError, ValueError):
                continue
            shape, chunks = zarr.get('shape', []), zarr.get('chunks', [])
            if len(shape) != 3 or chunks != [1, shape[1], shape[2]]:
                print('Skipping unsupported chunk layout:', var_dir.name, chunks, file=sys.stderr)
                continue
            if zarr.get('compressor', {}).get('id') != 'zlib' or zarr.get('dtype') not in ('<f4', '|u1'):
                print('Skipping unsupported dtype/compression:', var_dir.name, file=sys.stderr)
                continue
            available = []
            for item in var_dir.iterdir():
                match = CHUNK.fullmatch(item.name)
                if match and item.is_file() and item.stat().st_size > 0:
                    hour = int(match.group(1))
                    if 0 <= hour < shape[0]:
                        available.append(hour)
            if not available:
                continue
            variables.append({
                'name': var_dir.name,
                'shape': shape,
                'chunks': chunks,
                'dtype': zarr['dtype'],
                'compressor': zarr['compressor'],
                'attrs': va,
                'available_hours': sorted(set(available)),
            })
        if not variables:
            print('Skipping store with no field chunks:', root.name, file=sys.stderr)
            continue
        grid = {k: v for k, v in attrs.items() if k.startswith('GRIB_')}
        idmatch = ID.fullmatch(root.name)
        fallback_init = dt.datetime.strptime(idmatch.group(1) + idmatch.group(2), '%Y%m%d%H').strftime('%Y-%m-%dT%H:%M:%SZ')
        datasets.append({
            'id': root.stem,
            'path': root.name,
            'model': attrs.get('model', 'RRFS'),
            'domain': attrs.get('domain', 'CONUS'),
            'init_time': attrs.get('init_time', fallback_init),
            'grid': grid,
            'variables': variables,
        })
        chunks = sum(len(v['available_hours']) for v in variables)
        print(f'{root.name}: {len(variables)} fields, {chunks} field-hour chunks')
    datasets.sort(key=lambda d: d['init_time'], reverse=True)
    if not datasets:
        print('ERROR: No readable RRFS field chunks were found in ' + str(source), file=sys.stderr)
        return 1
    output.write_text(json.dumps({
        'schema': 'rrfs-zarr-viewer-1',
        'generated_utc': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'datasets': datasets,
    }, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print('Wrote:', output)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
