#!/usr/bin/env python3
"""Install same-origin 3-D MapLibre terrain tiles (Terrarium PNG).

Python 3.6+; standard library only. Download once on an Internet-connected
machine, then copy data/dem/ to the viewer web root (or run in place).
The viewer enables its local DEM automatically only after a *complete*
manifest.json has been written. No runtime connection to AWS is required.

Examples:
  python3 install_terrain_dem.py --dry-run --max-zoom 9
  python3 install_terrain_dem.py --max-zoom 9 --global-base-maxzoom 5 --workers 8
  python3 install_terrain_dem.py --bbox -124 24 -66 51 --max-zoom 8
  python3 install_terrain_dem.py --dest /path/to/website/data/dem
  python3 install_terrain_dem.py --region-preset north-america --max-tiles 70000 --dry-run
  python3 install_terrain_dem.py --region-preset north-america --max-tiles 70000 --workers 8
  python3 install_terrain_dem.py --bbox -170 8 -60 75 --bbox 170 49 180 57 --dry-run
"""
import argparse
import concurrent.futures
import datetime as dt
import json
import math
import os
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request

SOURCE='https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
CREDIT='Mapzen terrain tiles / AWS Open Data; see the original source attributions and terms.'
PNG=b'\x89PNG\r\n\x1a\n'

def tile_xy(lon,lat,z):
    lat=max(-85.05112878,min(85.05112878,lat))
    n=1<<z
    x=int((lon+180)/360*n)
    y=int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
    return max(0,min(n-1,x)),max(0,min(n-1,y))

def tiles(bbox,minimum,maximum,global_zoom):
    w,s,e,n=bbox
    for z in range(minimum,maximum+1):
        if z<=global_zoom:
            # Low zoom tiles cover the entire globe so regional coverage
            # still has a useful background outside the preferred region.
            span=range(1<<z)
            for x in span:
                for y in span:
                    yield z,x,y
        else:
            x0,y0=tile_xy(w,n,z);x1,y1=tile_xy(e,s,z)
            for x in range(x0,x1+1):
                for y in range(y0,y1+1):
                    yield z,x,y

# The North American model domains span islands on both sides of the date line.
# Separate rectangles avoid an enormous 170E -> 50W single bounding box,
# while preserving Hawaii, Puerto Rico, Greenland, the northern Arctic,
# and all Aleutian islands. The preset defines *coverage*, not a model crop;
# keep it deliberately generous until actual catalog bounds are available.
COVERAGE_PRESETS = {
    'north-america': [
        (-170, 7, -50, 85),     # mainland Americas, Canada, Greenland, Caribbean/PR
        (-180, 17, -154, 30),  # Hawaii, including Northwestern Hawaiian Islands
        (-180, 49, -168, 57),  # western Aleutians, western-hemisphere side
        (170, 49, 180, 57),    # western Aleutians, eastern-hemisphere side
    ],
}

def tiles_regions(boxes,minimum,maximum,global_zoom):
    """Yield the unique union of tile coverage in stable numeric order.

    Avoid duplicated downloads at overlapping regional footprints and preserve
    globally complete z<=global_zoom levels exactly once.
    """
    selected=set()
    for bbox in boxes:
        selected.update(tiles(bbox,minimum,maximum,global_zoom))
    return iter(sorted(selected))

def fetch_tile(job,dest,retries,timeout):
    z,x,y=job
    path=dest/str(z)/str(x)/(str(y)+'.png')
    if path.exists() and path.stat().st_size>=32:
        with path.open('rb') as f:
            if f.read(8)==PNG:return 'skip',job,''
    url=SOURCE.format(z=z,x=x,y=y)
    last=''
    for attempt in range(retries+1):
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'OMD-EVU-Terrain-Installer/1.0'})
            with urllib.request.urlopen(request,timeout=timeout) as response:
                payload=response.read()
            if len(payload)<32 or not payload.startswith(PNG) or b'IEND' not in payload[-24:]:
                raise ValueError('Invalid or incomplete Terrarium PNG payload')
            path.parent.mkdir(parents=True,exist_ok=True)
            tmp=path.with_name(path.name+'.tmp.'+str(os.getpid()))
            try:
                tmp.write_bytes(payload)
                os.replace(tmp,path)
            finally:
                try:tmp.unlink(missing_ok=True)
                except TypeError:
                    if tmp.exists():tmp.unlink()
            return 'download',job,''
        except (OSError,ValueError,urllib.error.URLError) as exc:
            last=str(exc)
            if attempt<retries:time.sleep(.8*(attempt+1))
    return 'failed',job,last

def main():
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--dest',type=Path,default=Path(__file__).resolve().parent/'data'/'dem')
    parser.add_argument('--bbox',nargs=4,type=float,action='append',
                        metavar=('WEST','SOUTH','EAST','NORTH'),
                        help='Regional DEM bounding box; repeat for noncontiguous areas. Default: -127 23 -65 52 unless --region-preset is set.')
    parser.add_argument('--region-preset',choices=sorted(COVERAGE_PRESETS),default=None,
                        help='Install all high-zoom DEM tiles for a predefined multi-region domain.')
    parser.add_argument('--min-zoom',type=int,default=0)
    parser.add_argument('--max-zoom',type=int,default=9)
    parser.add_argument('--global-base-maxzoom',type=int,default=5,
                        help='Install global tiles through this zoom. v1.2.52 defaults to z5, avoiding 404s outside the regional DEM footprint.')
    parser.add_argument('--workers',type=int,default=8)
    parser.add_argument('--retries',type=int,default=3)
    parser.add_argument('--timeout',type=int,default=20)
    parser.add_argument('--max-tiles',type=int,default=50000,help='Prevent accidental very large downloads')
    parser.add_argument('--dry-run',action='store_true',help='Calculate planned coverage without network traffic')
    args=parser.parse_args()
    boxes=list(COVERAGE_PRESETS.get(args.region_preset,[]))
    if args.bbox:
        boxes.extend(tuple(b) for b in args.bbox)
    if not boxes:
        boxes=[(-127,23,-65,52)]
    for west,south,east,north in boxes:
        if not (-180<=west<east<=180 and -85<=south<north<=85):
            parser.error('Invalid bounding box: {}'.format((west,south,east,north)))
    if not (0<=args.min_zoom<=args.global_base_maxzoom<=args.max_zoom<=13):parser.error('Use 0 <= min zoom <= global-base zoom <= max zoom <= 13')
    if not (1<=args.workers<=24):parser.error('Workers must be 1..24')
    jobs=list(tiles_regions(boxes,args.min_zoom,args.max_zoom,args.global_base_maxzoom))
    print('Terrarium PNG tiles: {:,} (zoom {}–{}; global through z{})'.format(len(jobs),args.min_zoom,args.max_zoom,args.global_base_maxzoom))
    if args.region_preset: print('Coverage preset:',args.region_preset)
    for box in boxes:
        print('Regional bbox: west={} south={} east={} north={}'.format(*box))
    if len(jobs)>args.max_tiles:
        parser.error('Would download {:,} tiles (> --max-tiles {:,}); raise --max-tiles explicitly to opt in to broad high-zoom coverage'.format(len(jobs),args.max_tiles))
    print('Destination:',args.dest)
    if args.dry_run:return 0
    args.dest.mkdir(parents=True,exist_ok=True)
    marker=args.dest/'manifest.json'
    # Keep a previously complete manifest valid during a coverage extension.
    # Publish the new coverage only after every required tile succeeds; if
    # the network fails the old (smaller) installed coverage remains usable.
    # A fresh install still has no manifest until it is complete.
    done=0;counts={'download':0,'skip':0,'failed':0};failures=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        for status,job,error in executor.map(lambda job:fetch_tile(job,args.dest,args.retries,args.timeout),jobs):
            counts[status]+=1;done+=1
            if status=='failed':failures.append((job,error))
            if done%250==0 or done==len(jobs):
                print('Completed {:,}/{:,} — new {:,}, existing {:,}, failed {:,}'.format(done,len(jobs),counts['download'],counts['skip'],counts['failed']),flush=True)
    if failures:
        for job,error in failures[:15]:print('FAILED z/x/y={} — {}'.format('/'.join(map(str,job)),error),file=sys.stderr)
        print('No manifest created: retry to resume missing/failed tiles.',file=sys.stderr)
        return 1
    metadata={'complete':True,'encoding':'terrarium','tile_size':256,'min_zoom':args.min_zoom,
              'max_zoom':args.max_zoom,'global_base_maxzoom':args.global_base_maxzoom,
              'regional_bbox':list(boxes[0]) if len(boxes)==1 else None,
              'regional_bboxes':[list(b) for b in boxes],
              'coverage_preset':args.region_preset,'tile_count':len(jobs),
              'source':SOURCE,'attribution':CREDIT,'created_utc':dt.datetime.now(dt.timezone.utc).isoformat()}
    tmp=marker.with_suffix('.json.tmp');tmp.write_text(json.dumps(metadata,indent=2)+'\n');os.replace(tmp,marker)
    print('SUCCESS: wrote',marker)
    print('To deploy, copy the entire DEM directory (including manifest.json) to website data/dem/.')
    return 0

if __name__=='__main__':sys.exit(main())
