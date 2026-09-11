"""Low-cost metadata collection. Never executes discovered repositories."""
import datetime as dt
import hashlib
import json
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'

def api(path):
    p = subprocess.run(['gh', 'api', path], capture_output=True, encoding='utf-8', timeout=60)
    if p.returncode:
        raise RuntimeError('GitHub request failed: ' + path)
    return json.loads(p.stdout)

def collect(previous):
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    old = {r['id']: r for r in previous.get('repositories', [])}
    records, errors = {}, []
    def add(r):
        key = r['full_name'].lower()
        records[key] = dict(id=key, name=r['full_name'], url=r['html_url'],
            description=r.get('description') or '暂无项目描述', stars=r['stargazers_count'],
            pushed_at=r['pushed_at'], created_at=r['created_at'], fork=r['fork'],
            archived=r['archived'], license=(r.get('license') or {}).get('spdx_id'),
            topics=r.get('topics', []), observed_at=now,
            first_seen=old.get(key, {}).get('first_seen', now), evidence='仓库元数据，未安装验证')
    try:
        add(api('repos/deepseek-ai/deepseek-harness'))
    except Exception as e:
        errors.append(str(e))
    total = None
    incomplete = False
    for page in range(1, 4):
        try:
            result = api(f'search/repositories?q=topic:dsh-plugin&sort=updated&order=desc&per_page=100&page={page}')
            total = result['total_count']
            incomplete = incomplete or result.get('incomplete_results', False)
            for r in result['items']:
                add(r)
            if len(result['items']) < 100:
                break
        except Exception as e:
            errors.append(str(e))
            break
    # Retain previous entries if a query fails or a repo leaves the recent sample.
    for key, r in old.items():
        if key not in records:
            records[key] = r
    if not records:
        raise RuntimeError('No usable data; previous snapshot preserved')
    research = json.loads((DATA / 'research.json').read_text(encoding='utf-8'))
    monitored = {p['url']: p for p in research['products']}
    intelligence_path = DATA / 'intelligence.json'
    if intelligence_path.exists():
        intelligence = json.loads(intelligence_path.read_text(encoding='utf-8'))
        source_by_id = {s['id']: s for s in intelligence['sources']}
        for product in intelligence['products']:
            source = source_by_id[product['source']]
            monitored[source['url']] = dict(name=product['name'], url=source['url'])
    prior_sources = {s['url']: s for s in previous.get('sources', [])}
    sources = []
    for p in monitored.values():
        state = dict(name=p['name'], url=p['url'], checked_at=now)
        try:
            req = urllib.request.Request(p['url'], headers={'User-Agent':'AgentEcosystemObservatory/0.1'})
            with urllib.request.urlopen(req, timeout=25) as response:
                body = response.read(4_000_001)
                if len(body) > 4_000_000:
                    raise ValueError('Response exceeds 4 MB limit')
                if 'text' not in response.headers.get('Content-Type', ''):
                    raise ValueError('Expected text page')
            digest = hashlib.sha256(body).hexdigest()
            before = prior_sources.get(p['url'], {})
            state.update(status='已抓取，内容待审阅', sha256=digest,
                changed=bool(before.get('sha256') and before['sha256'] != digest), last_success=now)
        except Exception:
            before = prior_sources.get(p['url'], {})
            state.update(status='抓取失败，需人工查看', last_success=before.get('last_success'), sha256=before.get('sha256'))
        sources.append(state)
    return dict(generated_at=now, query='topic:dsh-plugin', sample_limit=300,
        search_total=total, incomplete_results=incomplete, errors=errors,
        coverage='最近更新的最多 300 个 topic:dsh-plugin 仓库，加 DSH 主仓库；历史条目保留。非全生态普查。',
        repositories=sorted(records.values(), key=lambda r:r['pushed_at'], reverse=True),
        sources=sources,
        changes=[dict(name=r['name'], url=r['url'], kind='本次首次收录' if old else '首期基线') for k,r in records.items() if k not in old])

def main():
    DATA.mkdir(exist_ok=True)
    target = DATA / 'latest.json'
    previous = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
    result = collect(previous)
    content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    history = DATA / 'snapshots'
    history.mkdir(exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    (history / f'{stamp}.json').write_text(content, encoding='utf-8')
    temporary = DATA / 'latest.tmp'
    temporary.write_text(content, encoding='utf-8')
    temporary.replace(target)
    print(f"Collected {len(result['repositories'])} repositories; {len(result['errors'])} query errors")
    from activity import update
    update()

if __name__ == '__main__':
    main()
