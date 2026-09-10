'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = url => { try { const u = new URL(url); return u.protocol === 'https:' ? esc(u.href) : '#'; } catch { return '#'; } };
const date = value => value ? new Date(value).toLocaleDateString('zh-CN') : '未知';
async function main() {
  const response = await fetch('./data.json');
  if (!response.ok) throw new Error('数据加载失败');
  const {snapshot:s, research:r} = await response.json();
  const fresh = new Set(s.repositories.filter(x => x.observed_at === s.generated_at).map(x => x.id));
  $('status').textContent = `采集于 ${new Date(s.generated_at).toLocaleString('zh-CN')} · ${s.errors.length ? '部分采集失败，保留历史数据' : '公开元数据快照'} · 距今 ${Math.max(0,Math.floor((Date.now()-Date.parse(s.generated_at))/86400000))} 天`;
  $('stats').innerHTML = [[s.repositories.length,'累计收录仓库'],[fresh.size,'本次观察到'],[r.products.length,'商业产品观察入口'],[r.benchmarks.filter(x=>x.value!==null).length,'已完成评测指标']].map(([v,t])=>`<div class="stat"><strong>${v}</strong><span>${t}</span></div>`).join('');
  $('coverage').textContent = `${s.coverage} 本次搜索报告匹配 ${s.search_total ?? '未知'} 个；搜索结果${s.incomplete_results?'不完整':'未报告截断'}。`;
  $('change-list').innerHTML = s.changes.length ? s.changes.slice(0,8).map(c=>`<div><span class="label">${esc(c.kind)}</span> <a href="${link(c.url)}">${esc(c.name)} ↗</a></div>`).join('') : '<p>本次没有首次收录的项目；已有条目的元数据仍可能更新。</p>';
  $('product-list').innerHTML = r.products.map(p=>{const state=s.sources.find(x=>x.url===p.url);return `<article class="product"><span class="label">${esc(p.scope)}</span><h3><a href="${link(p.url)}">${esc(p.name)} ↗</a></h3><p>${esc(p.note)}</p><p class="muted">${esc(p.status)} · ${esc(state?.status || '未抓取')}<br>检查 ${date(state?.checked_at)}${state?.changed?' · 页面有变化，待审阅':''}</p></article>`}).join('');
  $('question-list').innerHTML = r.questions.map(q=>`<article class="question"><div><span class="label">${esc(q.status)}</span><h3>${esc(q.title)}</h3><p>${esc(q.hypothesis)}</p></div><div><span class="label">下一步验证</span><p>${esc(q.next)}</p></div></article>`).join('');
  $('benchmarks').innerHTML = r.benchmarks.map(b=>`<article class="bench"><span>${esc(b.name)}</span><strong>${b.value===null?'未评测':esc(b.value)}</strong><p>${esc(b.reason)}</p></article>`).join('');
  let page=0; const pageSize=12;
  const newNames = new Set(s.changes.filter(c=>c.kind==='本次首次收录').map(c=>c.name));
  function render() {
    const query=$('search').value.toLowerCase().trim(), scope=$('scope').value;
    const list=s.repositories.filter(x=>`${x.name} ${x.description} ${x.topics.join(' ')}`.toLowerCase().includes(query)).filter(x=>scope==='active'?!x.archived:scope==='original'?!x.fork:scope==='new'?newNames.has(x.name):true);
    list.sort($('sort').value==='stars'?(a,b)=>b.stars-a.stars:$('sort').value==='name'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>b.pushed_at.localeCompare(a.pushed_at));
    const pages=Math.max(1,Math.ceil(list.length/pageSize)); page=Math.min(page,pages-1);
    $('count').textContent=`${list.length} 个匹配项目`;
    $('repos').innerHTML=list.slice(page*pageSize,(page+1)*pageSize).map(x=>`<article class="repo"><div><h3><a href="${link(x.url)}">${esc(x.name)} ↗</a></h3><p>${esc(x.description)}</p><p class="meta">${esc(x.license||'许可证待核验')} · ${x.fork?'Fork · ':''}${x.archived?'已归档 · ':''}${esc(x.evidence)}${!fresh.has(x.id)?' · 本次未观察到，保留旧快照':''}</p></div><aside><strong>${x.stars.toLocaleString()}</strong> stars<br>推送 ${date(x.pushed_at)}<br>观察 ${date(x.observed_at)}</aside></article>`).join('') || '<p class="empty">没有匹配项目，试试其他关键词或范围。</p>';
    $('page').textContent=`${page+1} / ${pages}`; $('prev').disabled=page===0; $('next').disabled=page>=pages-1;
  }
  for(const id of ['search','scope','sort']) $(id).addEventListener(id==='search'?'input':'change',()=>{page=0;render()});
  $('prev').addEventListener('click',()=>{page--;render()}); $('next').addEventListener('click',()=>{page++;render()});render();
}
main().catch(()=>{$('status').textContent='调研数据暂时无法加载，请刷新重试，或从 GitHub 查看 data/latest.json。';});
