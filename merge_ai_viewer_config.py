#!/usr/bin/env python3
"""Merge the v1.2.14 AI model set into a site's existing config.json safely.

Standard library only, Python 3.6+. Does not touch any model or terrain data.
Example: python3 merge_ai_viewer_config.py --existing config.before129.json
"""
import argparse
import json
import os
from pathlib import Path
import tempfile

AI_IDS = ('aigfs', 'aigefs_mean', 'hgefs_mean', 'gefs_mean')

def merge(existing, template):
    if not isinstance(existing, dict) or not isinstance(template, dict):
        raise ValueError('Both configs must be JSON objects')
    result = dict(existing)
    current_sources = existing.get('sources', [])
    template_sources = template.get('sources', [])
    if not isinstance(current_sources, list) or not isinstance(template_sources, list):
        raise ValueError('sources must be arrays')
    new_by_id = {row['id']: row for row in template_sources if isinstance(row, dict) and row.get('id') in AI_IDS}
    if len(new_by_id) != len(AI_IDS):raise ValueError('Template missing AI source declarations')
    result['sources'] = [row for row in current_sources if not (isinstance(row, dict) and row.get('id') in AI_IDS)] + [new_by_id[k] for k in AI_IDS]
    old_sets = existing.get('modelSets', [])
    new_sets = template.get('modelSets', [])
    if not isinstance(old_sets, list) or not isinstance(new_sets, list):raise ValueError('modelSets must be arrays')
    ai_set = next((row for row in new_sets if isinstance(row, dict) and row.get('id') == 'ai-models'), None)
    if not ai_set:raise ValueError('Template missing ai-models declaration')
    result['modelSets'] = [row for row in old_sets if not (isinstance(row, dict) and row.get('id') == 'ai-models')] + [ai_set]
    result['aiPanels'] = template['aiPanels']
    return result

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--existing',type=Path,required=True,help='The backed-up site-specific config.json')
    ap.add_argument('--template',type=Path,default=Path('config.json'),help='New v1.2.14 template')
    ap.add_argument('--output',type=Path,default=Path('config.json'),help='Resulting active config')
    ap.add_argument('--dry-run',action='store_true')
    a=ap.parse_args()
    old=json.loads(a.existing.read_text(encoding='utf8'))
    template=json.loads(a.template.read_text(encoding='utf8'))
    result=merge(old,template)
    print('Existing model sets:', ', '.join(x['id'] for x in old.get('modelSets', []) if isinstance(x,dict)))
    print('Merged model sets:  ', ', '.join(x['id'] for x in result['modelSets'] if isinstance(x,dict)))
    print('New sources:', ', '.join(AI_IDS))
    if a.dry_run: return
    a.output.parent.mkdir(parents=True,exist_ok=True)
    descriptor,tmp=tempfile.mkstemp(prefix='.ai_config_',suffix='.tmp',dir=str(a.output.parent))
    try:
        with os.fdopen(descriptor,'w',encoding='utf8') as f:
            json.dump(result,f,indent=2,ensure_ascii=False)
            f.write('\n')
            f.flush();os.fsync(f.fileno())
        os.chmod(tmp,0o644)
        os.replace(tmp,str(a.output))
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
    print('Saved',a.output)

if __name__=='__main__':main()
