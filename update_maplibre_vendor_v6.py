#!/usr/bin/env python3
"""Fetch self-hosted MapLibre GL JS 6.16.0 assets on Linux (no pip/root).

Run from the viewer's website directory:
    python3 update_maplibre_vendor_v6.py --dest vendor-v6
    python3 update_maplibre_vendor_v6.py --dest vendor-v6 --activate
    python3 update_maplibre_vendor_v6.py --dest vendor-v6 --check

MapLibre 6.16.0 distributes self-contained main and worker modules. Its
maplibre-gl-shared.mjs is intentionally EMPTY and is not needed.
"""
import argparse
import shutil
import hashlib
import json
import os
from pathlib import Path
import sys
import urllib.request

VERSION = '6.16.0'
# Minimums reject accidental HTML/404s, not legitimate zero-byte shared files.
ASSETS = {
    'maplibre-gl.mjs': (150000, 20000000),
    'maplibre-gl-worker.mjs': (50000, 20000000),
    'maplibre-gl.css': (15000, 2000000),
}
ALIAS_FILES = {
    'maplibre-gl.js': 'maplibre-gl.mjs',
    'maplibre-gl-worker.js': 'maplibre-gl-worker.mjs',
}
CDNS = (
    'https://cdn.jsdelivr.net/npm/maplibre-gl@{version}/dist/{name}',
    'https://unpkg.com/maplibre-gl@{version}/dist/{name}',
)


def validate(name, blob):
    minimum, maximum = ASSETS[name]
    if not minimum <= len(blob) <= maximum:
        raise ValueError('{}: unexpected size {} bytes (expected {} to {})'.format(
            name, len(blob), minimum, maximum))
    if b'<!doctype html' in blob[:2048].lower() or b'<html' in blob[:2048].lower():
        raise ValueError('{}: received HTML instead of an asset'.format(name))
    if name.endswith('.css') and b'maplibregl-' not in blob:
        raise ValueError('{}: missing expected MapLibre stylesheet selectors'.format(name))
    if name.endswith('.mjs') and b'MapLibre' not in blob[:16384]:
        raise ValueError('{}: missing MapLibre module banner'.format(name))


def download(name):
    errors = []
    for template in CDNS:
        url = template.format(version=VERSION, name=name)
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'EVU-MapLibre-6.16.0-installer'})
            with urllib.request.urlopen(request, timeout=60) as response:
                media_type = response.headers.get('Content-Type', '').lower()
                if 'text/html' in media_type:
                    raise ValueError('server returned HTML instead of asset')
                blob = response.read(ASSETS[name][1] + 1)
            validate(name, blob)
            return blob, url
        except Exception as error:
            errors.append('{}: {}'.format(url, error))
    raise RuntimeError('Unable to fetch {}:\n  {}'.format(name, '\n  '.join(errors)))


def check(directory, verify_aliases=True):
    manifest = directory / 'maplibre-v6-assets.json'
    metadata = json.loads(manifest.read_text(encoding='utf-8'))
    if metadata.get('version') != VERSION:
        raise ValueError('Manifest version mismatch')
    if set(metadata.get('files', {})) != set(ASSETS):
        raise ValueError('Manifest must list exactly the three v6.16.0 assets')
    for name in ASSETS:
        blob = (directory / name).read_bytes()
        validate(name, blob)
        if hashlib.sha256(blob).hexdigest() != metadata['files'][name]['sha256']:
            raise ValueError('{} failed SHA-256 verification'.format(name))
        print('PASS {:<26} {:>9} bytes'.format(name, len(blob)))
    for alias, original in ALIAS_FILES.items():
        target = directory / alias
        if verify_aliases and target.exists():
            if hashlib.sha256(target.read_bytes()).hexdigest() != metadata['files'][original]['sha256']:
                raise ValueError('{} does not match {} (rerun --activate)'.format(alias, original))
            print('PASS module alias {:<24}'.format(alias))
    print('PASS MapLibre', VERSION)


def activate(directory):
    # No network connection is needed; use the user's validated .mjs files.
    check(directory, verify_aliases=False)
    for alias, original in ALIAS_FILES.items():
        target = directory / alias
        temp = directory / (alias + '.partial')
        shutil.copyfile(str(directory / original), str(temp))
        os.chmod(str(temp), 0o644)
        os.replace(str(temp), str(target))
        print('Installed JavaScript MIME alias {} from {}'.format(alias, original))
    check(directory)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--dest', default='vendor-v6', help='Output directory (default: vendor-v6)')
    parser.add_argument('--check', action='store_true', help='Offline file/hash verification')
    parser.add_argument('--activate', action='store_true', help='Offline: make .js ES-module aliases from validated .mjs files')
    args = parser.parse_args()
    directory = Path(args.dest)
    if args.activate:
        activate(directory)
        return
    if args.check:
        check(directory)
        return

    # Fetch all files before replacing any existing files.
    payload = {name: download(name) for name in ASSETS}
    directory.mkdir(parents=True, exist_ok=True)
    os.chmod(str(directory), 0o755)
    metadata = {'version': VERSION, 'files': {}}
    for name, (blob, url) in payload.items():
        target = directory / name
        temporary = directory / (name + '.partial')
        temporary.write_bytes(blob)
        os.chmod(str(temporary), 0o644)
        os.replace(str(temporary), str(target))
        metadata['files'][name] = {
            'bytes': len(blob), 'sha256': hashlib.sha256(blob).hexdigest(), 'url': url
        }
        print('Downloaded {:<26} {:>9} bytes'.format(name, len(blob)))
    manifest = directory / 'maplibre-v6-assets.json'
    temporary = directory / 'maplibre-v6-assets.json.partial'
    temporary.write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    os.chmod(str(temporary), 0o644)
    os.replace(str(temporary), str(manifest))
    activate(directory)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, RuntimeError, KeyError) as exc:
        print('ERROR:', exc, file=sys.stderr)
        sys.exit(1)
