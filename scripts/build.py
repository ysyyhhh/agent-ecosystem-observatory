"""Deterministic, dependency-free static build from reviewed/local snapshots."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def validate_intelligence(data):
    collections = ['sources', 'layers', 'products', 'ideas', 'events', 'media']
    for name in collections:
        ids = [x['id'] for x in data[name]]
        assert len(ids) == len(set(ids)), f'Duplicate {name} IDs'
    sources = {x['id'] for x in data['sources']}
    layers = {x['id'] for x in data['layers']}
    products = {x['id'] for x in data['products']}
    for source in data['sources']:
        assert source['url'].startswith('https://'), 'Evidence requires HTTPS'
    for name in ['layers', 'ideas', 'events', 'media']:
        for item in data[name]:
            assert item['sources'] and set(item['sources']) <= sources, f'Missing source: {item["id"]}'
            assert set(item.get('layers', [])) <= layers
            assert set(item.get('products', [])) <= products
            assert not item.get('layer') or item['layer'] in layers
    for product in data['products']:
        assert product['source'] in sources
        assert product['mappings'], 'Every product needs a capability breakdown'
        for row in product['mappings']:
            assert row['layer'] in layers and set(row['providers']) <= sources
            assert row['gap'], 'Mappings need explicit limitations'

def build():
    snapshot = json.loads((ROOT / 'data/latest.json').read_text(encoding='utf-8'))
    research = json.loads((ROOT / 'data/research.json').read_text(encoding='utf-8'))
    intelligence = json.loads((ROOT / 'data/intelligence.json').read_text(encoding='utf-8'))
    activity = json.loads((ROOT / 'data/activity.json').read_text(encoding='utf-8'))
    validate_intelligence(intelligence)
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
    history = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((ROOT / 'data/snapshots').glob('*.json'))]
    trend = []
    for item in history:
        core = next((x for x in item['repositories'] if x['id']=='deepseek-ai/deepseek-harness'), None)
        if core:
            trend.append(dict(date=core['observed_at'], stars=core['stars'], pushed_at=core['pushed_at']))
    trend = list({x['date']: x for x in trend}.values())
    (out / 'data.json').write_text(json.dumps(dict(snapshot=snapshot, research=research, intelligence=intelligence, activity=activity, trend=trend), ensure_ascii=False), encoding='utf-8')
    (out / '.nojekyll').touch()
    print(f'Built {out}')

if __name__ == '__main__':
    build()
