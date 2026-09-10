"""Collect DSH release/commit history, without executing repository code."""
import datetime as dt
import json
from pathlib import Path
from refresh import api

ROOT = Path(__file__).resolve().parents[1]

def update():
    target = ROOT / 'data/activity.json'
    prior = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    result = dict(prior, checked_at=now, errors=[])
    for key, endpoint in [('releases','releases?per_page=8'), ('commits','commits?per_page=15')]:
        try:
            items = api('repos/deepseek-ai/deepseek-harness/' + endpoint)
            if key == 'releases':
                rows = [dict(id=str(x['id']), title=x['name'] or x['tag_name'], tag=x['tag_name'], date=x['published_at'], url=x['html_url'], prerelease=x['prerelease']) for x in items if not x['draft']]
            else:
                rows = [dict(id=x['sha'], title=x['commit']['message'].split('\n')[0], date=x['commit']['committer']['date'], url=x['html_url']) for x in items]
            # Preserve history when items fall outside the newest API page.
            merged = {x['id']:x for x in prior.get(key, [])}
            merged.update({x['id']:x for x in rows})
            result[key] = sorted(merged.values(), key=lambda x:x['date'], reverse=True)
            result[key + '_observed_at'] = now
        except Exception:
            result['errors'].append(key + ': request failed; historical records retained')
            result.setdefault(key, [])
    temp = target.with_suffix('.tmp')
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temp.replace(target)
    print(f"Activity: {len(result['releases'])} releases, {len(result['commits'])} commits; {len(result['errors'])} errors")

if __name__ == '__main__':
    update()
