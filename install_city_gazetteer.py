#!/usr/bin/env python3
"""Build a self-hosted, zoom-aware city gazetteer (Python 3.6+, stdlib only).

GeoNames city extracts are CC BY 4.0: https://www.geonames.org/export/
Resulting output is a static JSON file; browsers do not contact GeoNames.
"""
from __future__ import print_function

import argparse
import datetime
import io
import json
import os
import sys
import tempfile
import urllib.request
import zipfile

DEFAULT_URL = 'https://download.geonames.org/export/dump/cities1000.zip'
# Mainland North America, Central America, the Caribbean and nearby islands.
# United States covers Hawaii, Alaska, Puerto Rico (also listed separately).
NORTH_AMERICA = set('''US CA MX GL PM BM BS BZ CR CU DO SV GT HN HT JM NI PA PR
AG AI AW BB BL BQ CW DM GD GP KY KN LC MF MQ MS SX TC TT VC VG VI
TT GL FK'''.split())


def city_rank(population, feature):
    if feature == 'PPLC' or population >= 1500000:
        return 0
    if feature == 'PPLA' or population >= 350000:
        return 1
    if feature == 'PPLA2' or population >= 100000:
        return 2
    if feature == 'PPLA3' or population >= 30000:
        return 3
    if feature == 'PPLA4' or population >= 5000:
        return 4
    return 5


def convert(archive, world_min):
    cities = []
    counts = {'north_america': 0, 'rest_of_world': 0}
    with zipfile.ZipFile(archive) as zf:
        members = [n for n in zf.namelist() if n.endswith('cities1000.txt')]
        if len(members) != 1:
            raise ValueError('Expected cities1000.txt in GeoNames ZIP')
        with io.TextIOWrapper(zf.open(members[0]), encoding='utf-8') as lines:
            for line in lines:
                cells = line.rstrip('\r\n').split('\t')
                if len(cells) < 15 or cells[6] != 'P':
                    continue
                try:
                    lat, lon = float(cells[4]), float(cells[5])
                    population = int(cells[14])
                except (ValueError, TypeError):
                    continue
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    continue
                country, feature = cells[8], cells[7]
                local = country in NORTH_AMERICA
                if not local and population < world_min and feature not in ('PPLC', 'PPLA'):
                    continue
                if local and population < 1000 and not feature.startswith('PPLA') and feature != 'PPLC':
                    continue
                name = (cells[1] or cells[2]).strip()
                if not name:
                    continue
                cities.append({'name': name, 'lat': round(lat, 5), 'lon': round(lon, 5),
                               'rank': city_rank(population, feature), 'population': population})
                counts['north_america' if local else 'rest_of_world'] += 1
    cities.sort(key=lambda x: (x['rank'], -x['population'], x['name'], x['lat'], x['lon']))
    return {'source': 'GeoNames cities1000; CC BY 4.0; reduced to city names, coordinates, population and display ranks',
            'source_url': 'https://www.geonames.org/',
            'license': 'https://creativecommons.org/licenses/by/4.0/',
            'generated_utc': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'counts': counts, 'cities': cities}


def download(url, destination, max_bytes=80*1024*1024):
    with urllib.request.urlopen(url, timeout=90) as response:
        length = response.headers.get('Content-Length')
        if length and int(length) > max_bytes:
            raise ValueError('GeoNames download exceeds the safety limit')
        total = 0
        with open(destination, 'wb') as out:
            while True:
                chunk = response.read(1024*512)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise ValueError('GeoNames download exceeds the safety limit')
                out.write(chunk)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source-zip', help='Previously downloaded GeoNames cities1000.zip (for offline servers)')
    parser.add_argument('--output', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'cities.json'),
                        help='Viewer data/cities.json destination')
    parser.add_argument('--min-pop-world', type=int, default=15000,
                        help='Minimum population outside North America (default 15000)')
    args = parser.parse_args()
    if args.min_pop_world < 1000:
        parser.error('--min-pop-world must be at least 1000')
    downloaded = None
    try:
        if args.source_zip:
            source = args.source_zip
        else:
            fd, downloaded = tempfile.mkstemp(prefix='evu_geonames_', suffix='.zip')
            os.close(fd)
            print('Downloading GeoNames cities1000 (one time; no browser requests)...')
            download(DEFAULT_URL, downloaded)
            source = downloaded
        result = convert(source, args.min_pop_world)
        if len(result['cities']) < 1000:
            raise RuntimeError('Suspiciously small city catalog; original file has not been replaced')
        output = os.path.abspath(args.output)
        parent = os.path.dirname(output)
        if not os.path.isdir(parent):
            os.makedirs(parent)
        fd, tmp = tempfile.mkstemp(prefix='.cities_', suffix='.json', dir=parent)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as out:
                json.dump(result, out, ensure_ascii=False, separators=(',', ':'))
                out.write('\n')
            os.replace(tmp, output)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
        print('Wrote {} cities to {}'.format(len(result['cities']), output))
        print('North America: {}; other areas: {}'.format(result['counts']['north_america'],
                                                        result['counts']['rest_of_world']))
        print('GeoNames CC BY 4.0 attribution is displayed by the viewer when Cities is enabled.')
        return 0
    except Exception as error:
        print('City gazetteer installation failed; existing file preserved: {}'.format(error), file=sys.stderr)
        return 1
    finally:
        if downloaded and os.path.exists(downloaded):
            os.unlink(downloaded)


if __name__ == '__main__':
    sys.exit(main())
