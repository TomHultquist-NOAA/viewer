#!/usr/bin/env python3
"""Install self-hosted Interstate, U.S., and State highways from Census TIGER/Line 2025.

Python 3.6+ stdlib only. No pip, GIS dependencies, or server API.
Each state/territory is downloaded, tiled, and discarded in sequence.
Run from the viewer directory: python3 -u install_tiger_highways.py --all
"""
from __future__ import print_function
import argparse
import json
import os
import shutil
import sys
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path
from highway_tile_core import build, iter_shp_records
import struct

STATES = {
'AL':'01','AK':'02','AZ':'04','AR':'05','CA':'06','CO':'08','CT':'09','DE':'10','DC':'11',
'FL':'12','GA':'13','HI':'15','ID':'16','IL':'17','IN':'18','IA':'19','KS':'20','KY':'21',
'LA':'22','ME':'23','MD':'24','MA':'25','MI':'26','MN':'27','MS':'28','MO':'29','MT':'30',
'NE':'31','NV':'32','NH':'33','NJ':'34','NM':'35','NY':'36','NC':'37','ND':'38','OH':'39',
'OK':'40','OR':'41','PA':'42','RI':'44','SC':'45','SD':'46','TN':'47','TX':'48','UT':'49',
'VT':'50','VA':'51','WA':'53','WV':'54','WI':'55','WY':'56','PR':'72'}
REGION_COUNT = len(STATES)
YEAR=2025
BASE='https://www2.census.gov/geo/tiger/TIGER2025/PRISECROADS/'
GROUP={'I':0,'U':1,'S':2}


def records(dbf):
    head=dbf.read(32)
    if len(head)!=32: raise ValueError('Truncated DBF header')
    count,hlen,rlen=struct.unpack_from('<IHH',head,4)
    if hlen<33 or rlen<2:raise ValueError('Invalid DBF dimensions')
    names={};at=1; raw=dbf.read(hlen-32)
    for off in range(0,len(raw)-1,32):
        entry=raw[off:off+32]
        if len(entry)<32 or entry[0]==13:break
        name=entry[:11].split(b'\0')[0].decode('ascii','replace').upper()
        names[name]=(at,entry[16]);at+=entry[16]
    if 'RTTYP' not in names:raise ValueError('No RTTYP column in Census data')
    pos,length=names['RTTYP']
    for _ in range(count):
        row=dbf.read(rlen)
        if len(row)!=rlen:raise ValueError('Truncated DBF data')
        yield None if row[:1]==b'*' else row[pos:pos+length].decode('ascii','replace').strip().upper()


def highway_lines(source):
    with zipfile.ZipFile(str(source)) as z:
        shp=next((name for name in z.namelist() if name.endswith('.shp')),None)
        if not shp or shp[:-4]+'.dbf' not in z.namelist():raise ValueError('Census Shapefile archive incomplete')
        with z.open(shp) as shapes,z.open(shp[:-4]+'.dbf') as attributes:
            for parts, rttyp in zip(iter_shp_records(shapes),records(attributes)):
                rank=GROUP.get(rttyp)
                if rank is not None:
                    for line in parts:
                        if len(line)>1:yield rank,line


def download(url,output):
    part=Path(str(output)+'.part')
    existing=part.stat().st_size if part.exists() else 0
    for attempt in range(3):
        headers={'User-Agent':'EVU-Highway-Installer/1.2.6'}
        if existing:headers['Range']='bytes={}-'.format(existing)
        try:
            req=urllib.request.Request(url,headers=headers)
            with urllib.request.urlopen(req,timeout=120) as r:
                status=getattr(r,'status',r.getcode())
                if existing and status!=206:
                    existing=0
                    part.unlink()
                    continue
                mode='ab' if existing else 'wb'
                with open(str(part),mode) as f:
                    tick=time.time();bytes_so_far=existing
                    while True:
                        block=r.read(1024*1024)
                        if not block:break
                        f.write(block);bytes_so_far+=len(block)
                        if time.time()-tick>10:
                            print('  downloaded {:.1f} MB'.format(bytes_so_far/1048576),flush=True);tick=time.time()
            os.replace(str(part),str(output));return
        except Exception as exc:
            print('  Download issue: {}'.format(exc),flush=True)
            if attempt==2:raise
            existing=part.stat().st_size if part.exists() else 0
            time.sleep(2)


def verify(dest):
    manifest=dest/'manifest.json'
    if not manifest.is_file():raise ValueError('Missing highway manifest; installation not completed')
    data=json.loads(manifest.read_text(encoding='utf-8'))
    if data.get('format')!='evu-highways-v1':raise ValueError('Unexpected highway dataset')
    tile_count=0
    for z,keys in data['tile_index'].items():
        for key in keys:
            tile=dest/str(z)/(key+'.json')
            if not tile.is_file():raise ValueError('Missing tile {}'.format(tile))
            tile_count+=1
    print('PASS: {} highway tiles, {} of {} areas complete'.format(tile_count,len(data.get('regions',[])),REGION_COUNT))
    return data


def process(args):
    base=Path(args.output).resolve();work=Path(args.work_dir).resolve()
    base.mkdir(parents=True,exist_ok=True);work.mkdir(parents=True,exist_ok=True)
    if args.verify:
        verify(base);return
    choices=sorted(STATES) if args.all else [s.strip().upper() for s in args.states.split(',') if s.strip()]
    invalid=[s for s in choices if s not in STATES]
    if invalid:raise ValueError('Unsupported area codes: '+','.join(invalid))
    print('Areas: {} | {} | temp: {}'.format(len(choices),base,work))
    if args.dry_run:
        for region in choices:print(region,BASE+'tl_2025_{}_prisecroads.zip'.format(STATES[region]))
        return
    manifest_file=base/'manifest.json'
    done=[]
    if manifest_file.is_file():
        saved=json.loads(manifest_file.read_text(encoding='utf-8'))
        if saved.get('format')!='evu-highways-v1':raise ValueError('Existing output is not a Census highways installation')
        done=list(saved.get('regions',[]))
    for index,region in enumerate(choices,1):
        if region in done:
            print('[{}/{}] {} already complete'.format(index,len(choices),region),flush=True);continue
        fips=STATES[region]
        url=BASE+'tl_2025_{}_prisecroads.zip'.format(fips)
        archive=work/('tl_2025_{}_prisecroads.zip'.format(fips))
        print('[{}/{}] {}: download, filter I/U/S, build tiles'.format(index,len(choices),region),flush=True)
        if not archive.is_file():download(url,archive)
        if not zipfile.is_zipfile(str(archive)):
            archive.unlink();raise ValueError('Corrupted ZIP for '+region)
        # The shared tile builder uses a temporary SQLite DB and cleans it automatically.
        # Keep its temp DB on the large scratch disk rather than the server's /tmp.
        old_temp=tempfile.tempdir
        tempfile.tempdir=str(work)
        try:
            built=build(highway_lines(archive),base,low_z=7,high_z=10,append=manifest_file.is_file(),
                        source='U.S. Census Bureau TIGER/Line 2025 primary and secondary roads',
                        attribution='U.S. Census Bureau TIGER/Line (public domain)',license='public-domain',
                        format_id='evu-highways-v1')
        finally:tempfile.tempdir=old_temp
        # The builder writes manifest only after completed tiling, then we add completion marker.
        done.append(region);built['regions']=done
        temp_manifest=base/'manifest.json.tmp'
        temp_manifest.write_text(json.dumps(built,separators=(',',':')),encoding='utf-8')
        os.replace(str(temp_manifest),str(manifest_file))
        if not args.keep_downloads:
            archive.unlink()
            part=Path(str(archive)+'.part')
            if part.exists():part.unlink()
        print('  {} installed; source archive {}'.format(region,'kept' if args.keep_downloads else 'deleted'),flush=True)
    verify(base)
    if args.remove_legacy:
        if len(done)!=REGION_COUNT:print('Skipping legacy cleanup: not all 52 areas complete')
        else:
            legacy=base.parent/'roads_osm'
            if legacy.is_dir():
                print('Removing obsolete OSM tile directory: '+str(legacy))
                shutil.rmtree(str(legacy))
            else:print('No legacy OSM tiles found')
            # Exact known obsolete application files only; never delete user data or vendor files.
            root=base.parent.parent
            for old_name in ('install_osm_roads.py','setup_osm_roads.py','OSM_ROADS_INSTALL.md',
                             'css/styles-1.2.5.css'):
                old_file=root/old_name
                if old_file.is_file() and not old_file.is_symlink():
                    old_file.unlink()
                    print('Removed obsolete application file: '+old_name)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--all',action='store_true',help='All 50 states, DC, and Puerto Rico')
    p.add_argument('--states',default='',help='Comma-separated USPS codes, e.g. CA,NV,AK,HI,PR')
    p.add_argument('--output',default='data/roads_highways')
    p.add_argument('--work-dir',default='highway_work',help='Scratch directory for downloads and temporary SQLite DB')
    p.add_argument('--keep-downloads',action='store_true',help='Do not delete processed downloads')
    p.add_argument('--remove-legacy',action='store_true',help='Delete old data/roads_osm only after all regions complete')
    p.add_argument('--dry-run',action='store_true')
    p.add_argument('--verify',action='store_true')
    args=p.parse_args()
    if not (args.all or args.states or args.verify):p.error('Choose --all, --states, or --verify')
    try:process(args)
    except Exception as e:
        print('ERROR: {}'.format(e),file=sys.stderr);sys.exit(1)
if __name__=='__main__':main()
