#!/usr/bin/env python3
"""Install pinned Three.js modules for the optional shared-GPU terrain renderer.

Use Python 3.6+ standard library only; no npm, build tools, or root needed.
On an Internet-connected system:
    python3 install_three_vendor.py --dest vendor-three
Then publish vendor-three/ beside index.html. Offline verification:
    python3 install_three_vendor.py --dest vendor-three --check

The browser can also fetch the exact pinned release from a public CDN if no
local vendor exists, but local hosting is preferable for restricted networks.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import urllib.request

VERSION='0.187.0'
ASSETS={'three.module.js':(200000,2500000),'three.core.js':(500000,4000000)}
CDNS=(
 'https://cdn.jsdelivr.net/npm/three@{version}/build/{name}',
 'https://unpkg.com/three@{version}/build/{name}',
)

def validate(name,blob):
 low,high=ASSETS[name]
 if not low<=len(blob)<=high:raise ValueError('Invalid {} size {}'.format(name,len(blob)))
 if b'@license' not in blob[:2000] or b'Three.js' not in blob[:2000]:
  raise ValueError('Missing Three.js license header in {}'.format(name))
 if b'<html' in blob[:1000].lower():raise ValueError('HTML instead of JavaScript')
 if name=='three.module.js' and b"from './three.core.js'" not in blob[:5000]:
  raise ValueError('Unexpected Three.js module dependency')

def download(name):
 errors=[]
 for urltemplate in CDNS:
  url=urltemplate.format(name=name,version=VERSION)
  try:
   request=urllib.request.Request(url,headers={'User-Agent':'EVU-ThreeJS-0.187.0-install'})
   with urllib.request.urlopen(request,timeout=75) as response:
    if 'html' in response.headers.get('Content-Type','').lower():raise ValueError('HTML content')
    blob=response.read(ASSETS[name][1]+1)
   validate(name,blob)
   return blob,url
  except Exception as error:errors.append('{}: {}'.format(url,error))
 raise RuntimeError('Unable to download {}:\n{}'.format(name,'\n'.join(errors)))

def check(dest):
 meta=json.loads((dest/'three-assets.json').read_text(encoding='utf-8'))
 if meta.get('version')!=VERSION or set(meta.get('files',{}))!=set(ASSETS):
  raise ValueError('Three.js manifest mismatch')
 for name in ASSETS:
  blob=(dest/name).read_bytes();validate(name,blob)
  if hashlib.sha256(blob).hexdigest()!=meta['files'][name]['sha256']:
   raise ValueError('SHA mismatch: '+name)
  print('PASS {} {} bytes'.format(name,len(blob)))
 print('PASS Three.js',VERSION)

def main():
 parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
 parser.add_argument('--dest',default='vendor-three')
 parser.add_argument('--check',action='store_true')
 args=parser.parse_args();dest=Path(args.dest)
 if args.check:check(dest);return
 assets={name:download(name) for name in ASSETS} # atomic; no partial vendor marked complete
 dest.mkdir(parents=True,exist_ok=True);os.chmod(str(dest),0o755)
 manifest={'version':VERSION,'files':{}}
 for name,(blob,url) in assets.items():
  tmp=dest/(name+'.partial');tmp.write_bytes(blob);os.chmod(str(tmp),0o644)
  os.replace(str(tmp),str(dest/name))
  manifest['files'][name]={'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'url':url}
 tmp=dest/'three-assets.json.partial'
 tmp.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
 os.chmod(str(tmp),0o644);os.replace(str(tmp),str(dest/'three-assets.json'))
 check(dest)

if __name__=='__main__':main()
