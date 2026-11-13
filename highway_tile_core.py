#!/usr/bin/env python3
"""Shared lightweight Shapefile-to-static-road-tiles implementation.

Python 3.6+ standard library only. Build on an internet-connected workstation,
then upload data/roads_osm/ to the static web server (no OSM API requests).

Examples:
  python3 install_osm_roads.py --source norcal-latest-free.shp.zip
  python3 install_osm_roads.py --source /tmp/maryland-latest-free.shp.zip --output data/roads_osm
  python3 install_osm_roads.py --geojson example_roads.geojson --output /tmp/roads_osm
  python3 install_osm_roads.py --url https://download.geofabrik.de/north-america/us/california/norcal-latest-free.shp.zip

The output is a set of small, self-hosted z/x/y.json files and one manifest.json.
The highway installer uses Census TIGER/Line, public domain.
"""
import argparse
import collections
import io
import json
import math
import sqlite3
import struct
import tempfile
import urllib.request
import zipfile
from pathlib import Path

MAX_LAT = 85.05112878
ATTRIBUTION = '© OpenStreetMap contributors (ODbL 1.0)'
FCLASS_RANK = {
    'motorway': 0, 'trunk': 0, 'motorway_link': 0, 'trunk_link': 0,
    'primary': 1, 'primary_link': 1,
    'secondary': 2, 'secondary_link': 2,
    'tertiary': 3, 'tertiary_link': 3,
    'residential': 4, 'unclassified': 4, 'living_street': 4, 'road': 4,
    'service': 5, 'track': 5,
}

def road_rank(name):
    return FCLASS_RANK.get(str(name or '').strip().lower())

def lon_to_x(lon, z):
    return (float(lon) + 180.0) / 360.0 * (1 << z)

def lat_to_y(lat, z):
    lat = max(-MAX_LAT, min(MAX_LAT, float(lat))) * math.pi / 180
    return (1.0 - math.log(math.tan(lat) + 1.0 / math.cos(lat)) / math.pi) * .5 * (1 << z)

def clip_segment(a, b, x0, y0, x1, y1):
    """Liang-Barsky clipping in Web Mercator tile coordinates."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    t0, t1 = 0.0, 1.0
    for p, q in ((-dx, a[0]-x0), (dx, x1-a[0]), (-dy, a[1]-y0), (dy, y1-a[1])):
        if abs(p) < 1e-14:
            if q < 0: return None
            continue
        r = q / p
        if p < 0: t0 = max(t0, r)
        else: t1 = min(t1, r)
        if t0 > t1: return None
    return ((a[0] + dx*t0, a[1] + dy*t0), (a[0] + dx*t1, a[1] + dy*t1))

def to_lonlat(p, z):
    n = float(1 << z)
    return [round(p[0]/n*360-180, 6), round(math.degrees(math.atan(math.sinh(math.pi*(1-2*p[1]/n)))), 6)]

def iter_shp_records(shp):
    header = shp.read(100)
    if len(header) != 100 or header[:4] != b'\x00\x00\x27\x0a':
        raise ValueError('Invalid .shp stream')
    while True:
        h = shp.read(8)
        if not h: break
        if len(h) != 8: raise ValueError('Truncated .shp record header')
        count = struct.unpack('>I', h[4:])[0]*2
        if count > 200_000_000: raise ValueError('Unexpectedly large shape record')
        body = shp.read(count)
        if len(body) != count: raise ValueError('Truncated .shp record')
        if len(body) < 44 or struct.unpack_from('<I', body)[0] not in (3,13,23):
            yield []
            continue
        parts, points = struct.unpack_from('<II', body, 36)
        start = 44 + 4*parts
        if parts > 100000 or points > 10000000 or start + 16*points > len(body):
            raise ValueError('Invalid .shp line points')
        indices = struct.unpack_from('<' + str(parts) + 'I', body, 44) + (points,)
        yield [[struct.unpack_from('<dd', body, start+16*i) for i in range(a,b)]
               for a,b in zip(indices[:-1], indices[1:]) if b>a and b<=points]

def iter_dbf_classes(dbf):
    header = dbf.read(32)
    if len(header) < 32: raise ValueError('Invalid .dbf header')
    count, header_size, row_size = struct.unpack_from('<IHH', header, 4)
    definitions = dbf.read(header_size-32)
    offset, fclass_at, fclass_size = 1, None, None
    for i in range(0, len(definitions)-1, 32):
        entry = definitions[i:i+32]
        if entry[0] == 13: break
        name = entry[:11].split(b'\0')[0].decode('ascii','replace').lower()
        if name in ('fclass','type','highway'):
            fclass_at, fclass_size = offset, entry[16]
        offset += entry[16]
    if fclass_at is None: raise ValueError('No fclass/type/highway column in shapefile .dbf')
    for _ in range(count):
        row = dbf.read(row_size)
        if len(row) != row_size: raise ValueError('Truncated .dbf row')
        yield None if row[:1] == b'*' else row[fclass_at:fclass_at+fclass_size].decode('utf-8','replace').strip()

def shapefile_roads(path):
    with zipfile.ZipFile(path) as z:
        candidates = [name for name in z.namelist() if name.lower().endswith('.shp')
                      and 'roads' in Path(name).name.lower()]
        if not candidates:
            raise ValueError('No Geofabrik gis_osm_roads_free_1.shp found in archive')
        shp_name = next((n for n in candidates if 'roads_free' in n.lower()),candidates[0])
        dbf_name = shp_name[:-4]+'.dbf'
        if dbf_name not in z.namelist():
            raise ValueError('Missing matching .dbf file in Geofabrik archive')
        with z.open(shp_name) as shp, z.open(dbf_name) as dbf:
            for pieces, kind in zip(iter_shp_records(shp), iter_dbf_classes(dbf)):
                rank = road_rank(kind)
                if rank is not None:
                    for line in pieces:
                        if len(line)>1: yield rank,line

def geojson_roads(path):
    with open(path, encoding='utf-8') as file:
        doc=json.load(file)
    for feature in doc.get('features', []):
        geometry=feature.get('geometry') or {}
        properties=feature.get('properties') or {}
        rank=properties.get('rank')
        if not isinstance(rank,int): rank=road_rank(properties.get('fclass') or properties.get('highway'))
        if rank is None or not 0<=rank<=5: continue
        lines=[geometry.get('coordinates')] if geometry.get('type')=='LineString' else geometry.get('coordinates',[]) if geometry.get('type')=='MultiLineString' else []
        for line in lines:
            if len(line)>1: yield rank,line

def segments_for_tiles(rank, line, z, max_rank):
    if rank > max_rank: return
    n = 1 << z
    prev = None
    for pt in line:
        if len(pt)<2: continue
        lon, lat=pt[:2]
        if not -180<=lon<=180 or not -90<=lat<=90: prev=None;continue
        current=(lon_to_x(lon,z),lat_to_y(lat,z))
        if prev is not None:
            if abs(current[0]-prev[0])>n/2: prev=current;continue  # dateline-safe skip
            x0,x1=sorted((prev[0],current[0]));y0,y1=sorted((prev[1],current[1]))
            # Usually 1-2 tiles per edge; oversized segments are guarded.
            xa,xb=max(0,int(math.floor(x0))),min(n-1,int(math.floor(x1)))
            ya,yb=max(0,int(math.floor(y0))),min(n-1,int(math.floor(y1)))
            if (xb-xa+1)*(yb-ya+1) > 10000: prev=current;continue
            for tx in range(xa,xb+1):
                for ty in range(ya,yb+1):
                    clipped=clip_segment(prev,current,tx,ty,tx+1,ty+1)
                    if clipped is None or abs(clipped[0][0]-clipped[1][0])+abs(clipped[0][1]-clipped[1][1])<1e-10: continue
                    yield z,tx,ty,rank,[to_lonlat(clipped[0],z),to_lonlat(clipped[1],z)]
        prev=current

def build(roads, dest, low_z=7, high_z=11, append=False, source=None, attribution=None, license=None, format_id=None):
    if not 0<=low_z<high_z<=16: raise ValueError('Expected 0 <= low zoom < high zoom <= 16')
    dest=Path(dest)
    previous=None
    if append and (dest/'manifest.json').is_file():
        previous=json.loads((dest/'manifest.json').read_text(encoding='utf-8'))
        if previous.get('zooms')!=[low_z,high_z]:
            raise ValueError('Existing road tiles use different --low-zoom/--high-zoom levels')
    with tempfile.TemporaryDirectory(prefix='evu_osm_') as temp:
        db=sqlite3.connect(str(Path(temp)/'roads.sqlite'))
        db.execute('CREATE TABLE roads(z INTEGER,x INTEGER,y INTEGER,r INTEGER,p TEXT)')
        total=0
        for rank,line in roads:
            batch=[]
            for z,max_rank in ((low_z,1),(high_z,5)):
                for tz,tx,ty,r,points in segments_for_tiles(rank,line,z,max_rank):
                    batch.append((tz,tx,ty,r,json.dumps(points,separators=(',',':'))))
            if batch:
                db.executemany('INSERT INTO roads VALUES(?,?,?,?,?)',batch)
                total+=len(batch)
                if total % 100000 < len(batch): db.commit()
        db.commit();db.execute('CREATE INDEX roads_tile ON roads(z,x,y)')
        manifest={'format':format_id or 'evu-osm-roads-v1','source':source or 'OpenStreetMap via Geofabrik free shapefile',
                  'attribution':attribution or ATTRIBUTION,'license':license or 'ODbL-1.0','zooms':[low_z,high_z],
                  'tile_index':{str(low_z):[],str(high_z):[]},'min_display_zoom':5.5}
        cursor=db.execute('SELECT z,x,y,r,p FROM roads ORDER BY z,x,y,r')
        current=None;items=[];count=0
        def flush(tile,segments):
            nonlocal count
            if tile is None:return
            z,x,y=tile;folder=dest/str(z)/str(x);folder.mkdir(parents=True,exist_ok=True)
            file=folder/(str(y)+'.json')
            if append and file.is_file():
                segments=json.loads(file.read_text(encoding='utf-8'))['roads']+segments
            file.write_text(json.dumps({'roads':segments},separators=(',',':')),encoding='utf-8')
            manifest['tile_index'][str(z)].append(str(x)+'/'+str(y))
            count+=1
        for z,x,y,r,coords in cursor:
            key=(z,x,y)
            if current!=key:
                flush(current,items);current=key;items=[]
            items.append([r,json.loads(coords)])
        flush(current,items)
        if previous is not None:
            for z in (low_z,high_z):
                manifest['tile_index'][str(z)]=sorted(set(previous['tile_index'][str(z)]) | set(manifest['tile_index'][str(z)]))
        dest.mkdir(parents=True,exist_ok=True)
        (dest/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')),encoding='utf-8')
        db.close()
    print('PASS: wrote {} tiles, {} clipped road segments in {}'.format(count,total,dest))
    print('Publish the {} directory to the viewer and retain the source attribution.'.format(dest))
    return manifest

