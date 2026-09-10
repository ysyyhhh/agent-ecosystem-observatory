"""Deterministic, dependency-free static build from reviewed/local snapshots."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def build():
    snapshot = json.loads((ROOT / 'data/latest.json').read_text(encoding='utf-8'))
    research = json.loads((ROOT / 'data/research.json').read_text(encoding='utf-8'))
    assert snapshot['repositories'], 'Refuse empty dataset'
    ids = [r['id'] for r in snapshot['repositories']]
    assert len(ids) == len(set(ids)), 'Duplicate repository IDs'
    for item in snapshot['repositories'] + research['products']:
        assert item['url'].startswith('https://'), 'Only HTTPS evidence URLs allowed'
    for item in research['benchmarks']:
        if item['value'] is not None:
            assert item.get('run_id') and item.get('evidence_url'), 'Measured values need reproducible evidence'
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    for source in (ROOT / 'web').iterdir():
        shutil.copy2(source, out / source.name)
    (out / 'data.json').write_text(json.dumps(dict(snapshot=snapshot, research=research), ensure_ascii=False), encoding='utf-8')
    (out / '.nojekyll').touch()
    print(f'Built {out}')

if __name__ == '__main__':
    build()
