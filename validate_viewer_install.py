#!/usr/bin/env python3
"""Validate EVU Viewer static assets using only the Python standard library.

Run after extracting the viewer update and installing its existing MapLibre and
plotting assets. This does not modify or download anything, so it is safe on a
read-only web server and safe for published forecast Zarr directories.
"""
import argparse
import json
import os
import re
import stat
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CORE = (
    'index.html', 'release.json', 'config.json',
    'css/styles.css', 'js/evu-bootstrap.js', 'js/osm-roads.js', 'js/viewer.js',
    'js/gpu-terrain-weather.js', 'js/advanced-map.js', 'js/three-surface-drape.js',
)
RUNTIME = (
    'vendor-v6/maplibre-gl.js', 'vendor-v6/maplibre-gl-worker.js',
    'vendor-v6/maplibre-gl.css', 'vendor/autumnplot-gl.js',
)


def audit(root, include_runtime=True):
    errors, warnings = [], []
    root = Path(root).resolve()
    def fail(msg):
        errors.append(msg)
    def warn(msg):
        warnings.append(msg)
    if not root.is_dir():
        return ['Install directory does not exist: {}'.format(root)], []
    for name in CORE + (RUNTIME if include_runtime else ()):
        file = root / name
        if not file.is_file() or file.stat().st_size == 0:
            fail('Missing/empty required file: {}'.format(name))
            continue
        mode = file.stat().st_mode
        if not mode & stat.S_IROTH:
            fail('File not world-readable (web server may get 403): {}'.format(name))
    if not (root / 'vendor-three/three.module.js').exists() and include_runtime:
        warn('Three.js surface mesh will use CDN or fall back to 2-D. For offline use: python3 install_three_vendor.py --dest vendor-three')
    if not (root / 'vendor-v6/maplibre-gl.js').exists() and include_runtime:
        warn('To install MapLibre: python3 update_maplibre_vendor_v6.py --dest vendor-v6 --activate')
    for name in ('js', 'css', 'data', 'vendor-v6', 'vendor-three'):
        parent = root / name
        if parent.is_dir() and not (parent.stat().st_mode & stat.S_IXOTH):
            fail('Directory not traversable by web-server user: {}'.format(name))
    manifest = None
    try:
        manifest = json.loads((root / 'release.json').read_text(encoding='utf-8'))
        if not re.match(r'^\d+\.\d+\.\d+$', str(manifest.get('version', ''))):
            fail('release.json has no valid semantic version')
    except (OSError, ValueError) as ex:
        fail('Cannot read release.json: {}'.format(ex))
    try:
        config = json.loads((root / 'config.json').read_text(encoding='utf-8'))
        sources = config.get('sources', [])
        if not isinstance(sources, list) or not sources:
            fail('config.json must provide a non-empty sources array')
        else:
            ids = [s.get('id') for s in sources if isinstance(s, dict)]
            if len(ids) != len(set(ids)):
                fail('config.json declares duplicate source IDs')
            catalogs = [root / s.get('catalogUrl', '') for s in sources if isinstance(s, dict)]
            if not any(c.is_file() for c in catalogs):
                warn('None of the configured model catalogs exists yet (normal for an unpopulated viewer)')
            # Model sets are an extensibility boundary: validate their shared
            # source/panel contract before a deployment, including new groups.
            ids = set(ids)
            enabled = [g for g in config.get('modelSets', [])
                       if isinstance(g, dict) and g.get('enabled', True)]
            if not enabled:
                fail('No enabled model sets in config.json')
            set_ids = [g.get('id') for g in enabled]
            if len(set_ids) != len(set(set_ids)):
                fail('Duplicate enabled model-set IDs')
            if config.get('defaultModelSet') not in set_ids:
                fail('defaultModelSet does not identify an enabled model set')
            for group in enabled:
                label = str(group.get('id') or '<unnamed>')
                panel_key = group.get('panelKey', 'panels')
                panels = config.get(panel_key, [])
                if not isinstance(panels, list) or not panels:
                    fail('Model set {} has no panels in {}'.format(label, panel_key))
                    continue
                pids = [p.get('id') for p in panels if isinstance(p, dict)]
                if len(pids) != len(set(pids)):
                    fail('Model set {} has duplicate panel IDs'.format(label))
                required = set(group.get('cycleSourceIds', []))
                required.add(group.get('primarySource'))
                required.add('analysis')
                required.update(p.get('source') for p in panels if isinstance(p, dict) and not p.get('placeholder'))
                missing = sorted(x for x in required if x and x not in ids)
                if missing:
                    fail('Model set {} references undefined source(s): {}'.format(label, ', '.join(missing)))
                cadence = group.get('forecastHourStep', 1)
                if not isinstance(cadence, int) or not 1 <= cadence <= 24:
                    fail('Model set {} has invalid forecastHourStep'.format(label))
    except (OSError, ValueError) as ex:
        fail('Cannot read config.json: {}'.format(ex))
    try:
        html = (root / 'index.html').read_text(encoding='utf-8')
        boot = (root / 'js/evu-bootstrap.js').read_text(encoding='utf-8')
        if manifest:
            version = manifest.get('version', '')
            if 'js/evu-bootstrap.js?v=' + version not in html:
                fail('Primary index references a different bootstrap version from release.json')
            # One canonical CSS file, cache-busted by the viewer release.
            # Retaining every historical version in the deployment ZIP made
            # identical stylesheet copies accumulate indefinitely.
            expected_css = 'css/styles.css'
            if expected_css + '?v=' + version not in html:
                fail('Primary index references a different stylesheet version from release.json')
            if not (root / expected_css).is_file():
                fail('Referenced stylesheet is missing: {}'.format(expected_css))
            if "'" + version + "'" not in boot:
                fail('ES bootstrap has a different version from release.json')
        if 'vendor-v6/maplibre-gl.css' not in html:
            fail('Primary index is missing the pinned MapLibre 6 stylesheet')
        if 'three-surface-drape.js' not in boot:
            fail('ES bootstrap missing optional Three.js terrain drape')
        if 'gpu-terrain-weather.js' not in boot:
            fail('ES bootstrap is not importing the GPU terrain renderer')
        if 'index-classic.html' in html or 'Classic renderer' in html or 'index-classic.html' in boot:
            fail('Obsolete Classic renderer link must not appear in active viewer')
        if "'osm-roads.js'" not in boot:
            fail('OSM roads script missing from bootstrap')
    except OSError as ex:
        fail('Cannot inspect viewer bootstrap: {}'.format(ex))
    # Check referenced local stylesheets and primary bootstrap scripts against
    # the actual installed files. Required package assets must be present in
    # --check-bundle mode, which would have caught the v1.2.29 CSS omission.
    try:
        html = (root / 'index.html').read_text(encoding='utf-8')
        refs = re.findall(r'<link\b[^>]*rel=[\"\']stylesheet[\"\'][^>]*href=[\"\']([^\"\']+)', html)
        refs += re.findall(r'<script\b[^>]*\bsrc=[\"\']([^\"\']+)', html)
        for ref in refs:
            path = ref.split('?', 1)[0].split('#', 1)[0]
            if path.startswith(('http:', 'https:', '//', '/')):
                continue
            if path.startswith('vendor-v6/') and not include_runtime:
                continue
            if not (root / path).is_file():
                fail('HTML references missing asset: {}'.format(path))
    except OSError as ex:
        fail('Cannot inspect local HTML asset references: {}'.format(ex))
    manifest_path = root / 'packaged_static_files.txt'
    if manifest_path.is_file():
        try:
            for raw in manifest_path.read_text(encoding='utf-8').splitlines():
                if not raw or raw.lstrip().startswith('#'):
                    continue
                path = Path(raw)
                if path.is_absolute() or '..' in path.parts or '\\' in raw:
                    fail('Unsafe path in static-asset manifest: {}'.format(raw))
                    continue
                if not (root / path).is_file():
                    fail('Missing packaged asset: {}'.format(raw))
        except OSError as ex:
            fail('Cannot inspect static-asset manifest: {}'.format(ex))
    return errors, warnings


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default=str(ROOT), help='Viewer installation directory')
    parser.add_argument('--check-bundle', action='store_true',
        help='Check extracted ZIP source before third-party runtime assets are installed')
    args = parser.parse_args(argv)
    errors, warnings = audit(args.root, not args.check_bundle)
    for item in warnings:
        print('WARN ' + item)
    for item in errors:
        print('FAIL ' + item)
    if errors:
        print('FAIL {} error(s), {} warning(s)'.format(len(errors), len(warnings)))
        return 1
    print('PASS viewer application checks ({} warning(s))'.format(len(warnings)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
