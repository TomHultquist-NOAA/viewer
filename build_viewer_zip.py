#!/usr/bin/env python3
"""Build a root-only, web-readable OMD EVU Viewer release archive."""
from __future__ import annotations
import argparse
from pathlib import Path
import stat
import zipfile

ROOT = Path(__file__).resolve().parent
ALLOWED_SUFFIXES = {'.cjs', '.css', '.geojson', '.html', '.js', '.json', '.md', '.pdf', '.py', '.svg'}
EXCLUDED_DIRS = {'.git', '__pycache__', '.pytest_cache', 'node_modules', 'vendor'}
EXCLUDED_DATA_DIRS = {'lightning', 'ptype_observations', 'spc_reports', '.published'}


def safe_release_file(path: Path, release: str) -> bool:
    parts = path.parts
    if not parts or path.is_absolute() or '..' in parts:
        return False
    if any(part in EXCLUDED_DIRS for part in parts):
        return False
    if any(part.startswith('.') and part != '.gitignore' for part in parts):
        return False
    if any(part.endswith(('.zip', '.log', '.tmp', '.incoming', '.pyc')) for part in parts):
        return False
    if parts[0] == 'data':
        if any(part in EXCLUDED_DATA_DIRS for part in parts[1:]):
            return False
        if path.name.startswith('catalog_') or path.suffix == '.zarr':
            return False
    if path.name.startswith('RELEASE_') and path.name != f'RELEASE_{release.replace(".", "_")}.md':
        return False
    return path.suffix.lower() in ALLOWED_SUFFIXES or path.name == '.gitignore'


def make_archive(source: Path, target: Path, release: str) -> None:
    source = source.resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in source.rglob('*') if p.is_file() and
                   safe_release_file(p.relative_to(source), release))
    expected = f'RELEASE_{release.replace(".", "_")}.md'
    if not any(p.name == expected and p.parent == source for p in files):
        raise ValueError(f'Missing current release notes: {expected}')
    dirs = sorted({p.relative_to(source).parent for p in files if p.relative_to(source).parent != Path('.')},
                  key=lambda p: (len(p.parts), p.as_posix()))
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for directory in dirs:
            name = directory.as_posix().rstrip('/') + '/'
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = (stat.S_IFDIR | 0o755) << 16 | 0x10
            info.compress_type = zipfile.ZIP_STORED
            archive.writestr(info, b'')
        for path in files:
            name = path.relative_to(source).as_posix()
            info = zipfile.ZipInfo(name, date_time=(2026, 11, 1, 0, 0, 0))
            info.create_system = 3
            # Static website files must be readable by the web-server account,
            # independent of its primary group. No viewer asset is executable.
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED,
                             compresslevel=9)
    with zipfile.ZipFile(target) as archive:
        bad = archive.testzip()
        if bad:
            raise RuntimeError(f'ZIP CRC failure: {bad}')
        names = archive.namelist()
        if expected not in names or any(name.startswith(source.name + '/') for name in names):
            raise RuntimeError('Archive validation failed: missing release note or wrapped root')
        for info in archive.infolist():
            mode = (info.external_attr >> 16) & 0xFFFF
            expected_mode = 0o755 if info.is_dir() else 0o644
            if stat.S_IMODE(mode) != expected_mode:
                raise RuntimeError(f'Incorrect archive permissions: {info.filename} {oct(stat.S_IMODE(mode))}')
        release_notes = [name for name in names if Path(name).name.startswith('RELEASE_')]
        if release_notes != [expected]:
            raise RuntimeError(f'Unexpected release-note set: {release_notes!r}')
    print(f'Packaged {len(files)} web-readable files and {len(dirs)} directories into {target}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release', default='1.1.34')
    parser.add_argument('--output', type=Path, default=ROOT.parent / 'OMD_EVU_Viewer_1.1.34.zip')
    args = parser.parse_args()
    make_archive(ROOT, args.output, args.release)
