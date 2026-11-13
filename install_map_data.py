#!/usr/bin/env python3
"""Install optional self-hosted map datasets (GeoNames and Natural Earth).

Run on a machine with Internet access; no third-party runtime map API is needed.
Usage: python3 install_map_data.py --cities --roads
       python3 install_map_data.py --cities --roads --bbox -170 5 -50 75
Requires Python 3.8+ standard library ONLY. Run locally (including Windows) and upload the resulting data/ files to the web server; no pip or server-side Python is needed.
"""
import argparse
import io
import json
import math
import struct
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent / 'data'
CITIES_URL = 'https://download.geonames.org/export/dump/cities15000.zip'
ROADS_URL = 'https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_roads.zip'


def download_zip(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'EVU-MapDataInstaller/1.0'})
    with urllib.request.urlopen(req, timeout=120) as response:
        contents = response.read()
    return zipfile.ZipFile(io.BytesIO(contents))


def in_bbox(lon, lat, b):
    return b[0] <= lon <= b[2] and b[1] <= lat <= b[3]


def cities(bbox):
    with download_zip(CITIES_URL) as z:
        lines = z.read('cities15000.txt').decode('utf-8').splitlines()
    out = []
    for line in lines:
        cols = line.split('\t')
        if len(cols) < 15:
            continue
        try:
            lat, lon, pop = float(cols[4]), float(cols[5]), int(cols[14])
        except ValueError:
            continue
        if not in_bbox(lon, lat, bbox):
            continue
        # 0: international major cities, 5: smaller towns visible on close zoom
        rank = 0 if pop >= 3000000 else 1 if pop >= 1000000 else 2 if pop >= 300000 else 3 if pop >= 100000 else 4 if pop >= 30000 else 5
        out.append({'name': cols[1], 'lon': round(lon, 5), 'lat': round(lat, 5), 'rank': rank, 'population': pop})
    out.sort(key=lambda c: (c['rank'], -c['population'], c['name']))
    ROOT.mkdir(parents=True, exist_ok=True)
    destination = ROOT / 'cities.json'
    destination.write_text(json.dumps({'source': 'GeoNames cities15000; geonames.org; CC BY 4.0; attribution required', 'cities': out}, separators=(',', ':')), encoding='utf8')
    print('Cities:', len(out), 'written to', destination)


def road_rank(properties):
    # Natural Earth scale rank is smallest for the most significant roads.
    try:
        scale = int(float(properties.get('scalerank', 5)))
    except (TypeError, ValueError):
        scale = 5
    return 0 if scale <= 3 else 1 if scale <= 5 else 2 if scale <= 7 else 3


def shp_lines(blob):
    """Read Natural Earth SHP PolyLine records using only Python stdlib.

    Supported: ordinary PolyLine (3), Z (13), M (23); Z/M tails are not
    needed for the 2-D map. The binary record's lengths are validated.
    """
    if len(blob) < 100 or blob[:4] != b'\x00\x00\x27\x0a':
        raise ValueError('Invalid ESRI shapefile header')
    offset = 100
    while offset + 8 <= len(blob):
        words = struct.unpack_from('>I', blob, offset + 4)[0]
        start = offset + 8
        stop = start + words * 2
        if stop > len(blob):
            raise ValueError('Truncated shapefile record')
        if stop - start >= 44:
            shape_type = struct.unpack_from('<I', blob, start)[0]
            if shape_type in (3, 13, 23):
                n_parts, n_points = struct.unpack_from('<II', blob, start + 36)
                point_start = start + 44 + n_parts * 4
                if n_parts > 100000 or n_points > 10000000 or point_start + n_points * 16 > stop:
                    raise ValueError('Malformed shapefile polyline')
                parts = list(struct.unpack_from('<' + str(n_parts) + 'I', blob, start + 44)) + [n_points]
                segments = []
                for a, b in zip(parts[:-1], parts[1:]):
                    if a >= b or b > n_points:
                        continue
                    segments.append([struct.unpack_from('<dd', blob, point_start + i * 16) for i in range(a, b)])
                yield segments
            else:
                yield []
        else:
            yield []
        offset = stop


def dbf_ranks(blob):
    """Return Natural Earth scalerank values in SHP record order."""
    if len(blob) < 33:
        raise ValueError('Invalid DBF header')
    count = struct.unpack_from('<I', blob, 4)[0]
    header_size, record_size = struct.unpack_from('<HH', blob, 8)
    fields = []
    cursor = 32
    while cursor + 32 <= header_size and blob[cursor] != 13:
        entry = blob[cursor:cursor + 32]
        name = entry[:11].split(b'\0', 1)[0].decode('ascii', 'replace').lower()
        fields.append((name, entry[16]))
        cursor += 32
    rank_offset = 1
    rank_size = None
    for name, size in fields:
        if name == 'scalerank':
            rank_size = size
            break
        rank_offset += size
    if rank_size is None:
        raise ValueError('Natural Earth roads missing scalerank')
    for index in range(count):
        at = header_size + index * record_size
        if at + record_size > len(blob):
            raise ValueError('Truncated DBF record')
        if blob[at:at + 1] == b'*':
            yield None
            continue
        raw = blob[at + rank_offset:at + rank_offset + rank_size].strip()
        try:
            yield road_rank({'scalerank': float(raw)})
        except ValueError:
            yield road_rank({})


def roads(bbox, tolerance):
    with download_zip(ROADS_URL) as z:
        files = {name.rsplit('.', 1)[-1].lower(): z.read(name)
                 for name in z.namelist() if name.lower().endswith(('.shp', '.dbf'))}
    if 'shp' not in files or 'dbf' not in files:
        raise ValueError('Natural Earth archive is missing .shp or .dbf')
    features = []
    for shapes, rank in zip(shp_lines(files['shp']), dbf_ranks(files['dbf'])):
        if rank is None:
            continue
        segments = []
        for segment in shapes:
            if len(segment) < 2 or not any(in_bbox(lon, lat, bbox) for lon, lat in segment):
                continue
            thinned = [segment[0]]
            for pt in segment[1:-1]:
                if (pt[0]-thinned[-1][0])**2 + (pt[1]-thinned[-1][1])**2 >= tolerance*tolerance:
                    thinned.append(pt)
            thinned.append(segment[-1])
            segments.append([[round(lon, 4), round(lat, 4)] for lon, lat in thinned])
        if segments:
            features.append({'type': 'Feature', 'properties': {'rank': rank,
                'bbox': [round(min(pt[0] for seg in segments for pt in seg), 4),
                         round(min(pt[1] for seg in segments for pt in seg), 4),
                         round(max(pt[0] for seg in segments for pt in seg), 4),
                         round(max(pt[1] for seg in segments for pt in seg), 4)]},
                'geometry': {'type': 'MultiLineString', 'coordinates': segments}})
    ROOT.mkdir(parents=True, exist_ok=True)
    destination = ROOT / 'roads.geojson'
    destination.write_text(json.dumps({'type': 'FeatureCollection', 'features': features}, separators=(',', ':')), encoding='utf8')
    print('Roads:', len(features), 'features written to', destination)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cities', action='store_true')
    parser.add_argument('--roads', action='store_true')
    parser.add_argument('--bbox', type=float, nargs=4, default=[-180, -90, 180, 90], metavar=('WEST', 'SOUTH', 'EAST', 'NORTH'))
    parser.add_argument('--simplify-degrees', type=float, default=0.015)
    args = parser.parse_args()
    if not args.cities and not args.roads:
        args.cities = args.roads = True
    if args.cities:
        cities(args.bbox)
    if args.roads:
        roads(args.bbox, args.simplify_degrees)


if __name__ == '__main__':
    main()
