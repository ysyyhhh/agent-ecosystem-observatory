'use strict';
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = value => {try {const u=new URL(value);return u.protocol==='https:'?esc(u.href):'#';}catch{return '#';}};
const date = v => v ? new Date(v.length===10?v+'T12:00:00Z':v).toLocaleDateString('zh-CN',{timeZone:'UTC'}) : '日期待核验';

async function main(){
  const response=await fetch('./data.json'); if(!response.ok)throw Error('Data unavailable');
  const {snapshot:s,research:r,intelligence:i,activity:a,trend}=await response.json();
  const sources=new Map(i.sources.map(x=>[x.id,x])), layers=new Map(i.layers.map(x=>[x.id,x]));
  const productById=new Map(i.products.map(x=>[x.id,x]));
  const refs=ids=>`<div class="citations">${ids.map(id=>{const x=sources.get(id);return `<a href="${link(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(x.type+' · '+x.access+' · 核查 '+x.checked_at)}">${esc(x.title)} ↗</a>`}).join('')}</div>`;
  const layerChips=ids=>ids.map(id=>`<button class="chip" data-layer="${esc(id)}">${esc(layers.get(id).name)} ↗</button>`).join('');
  const productChips=ids=>ids.map(id=>`<button class="chip" data-product="${esc(id)}">${esc(productById.get(id).name)} ↗</button>`).join('');
  let productKind='all', logKind='all', rankKind='stars', repoPage=0;
  const dialog=$('detail');
  function show(html){$('detail-body').innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
  function sourceAudit(ids){return `<h3>引用与核查</h3>${refs(ids)}<p class="subtle">${ids.map(id=>{const x=sources.get(id);return esc(x.title+'：'+x.type+'；'+x.access+'；核查 '+x.checked_at)}).join('<br>')}</p>`;}
  function openIdea(id){const x=i.ideas.find(x=>x.id===id);if(!x)return;
    show(`<span class="label">${esc(x.priority)} · ${esc(x.verdict)}</span><h2 id="detail-title">${esc(x.title)}</h2><p>${esc(x.summary)}</p>${[['为什么是现在',x.why],['DSH 复用与新增工作',x.reuse],['谁可能需要',x.buyer],['最小可验证产品',x.mvp],['反方与风险',x.risk],['下一步如何验证',x.validation]].map(([t,v])=>`<h3>${t}</h3><p>${esc(v)}</p>`).join('')}${layerChips([x.layer])}${sourceAudit(x.sources)}`);
  }
  function openProduct(id){const x=productById.get(id);if(!x)return;
    show(`<span class="label">${esc(x.kind)} · ${esc(x.category)}</span><h2 id="detail-title">${esc(x.name)}</h2><p>${esc(x.pitch)}</p>${refs([x.source])}<p class="impact">以下是本站依据公开文档做的能力拆分。DSH 对应项是候选，未做等价性或端到端测试。</p>${x.mappings.map(m=>`<article class="mapping-row"><strong>${esc(m.task)}</strong>${layerChips([m.layer])}<span class="subtle">${esc(m.status)}</span><div class="mapping-columns"><div><span class="fact-title">DSH / 社区候选</span>${m.providers.length?refs(m.providers):'<p>尚未核验对应实现</p>'}</div><div><span class="fact-title">仍需补齐或验证</span><p>${esc(m.gap)}</p></div></div></article>`).join('')}${sourceAudit([...new Set([x.source,...x.mappings.flatMap(m=>m.providers)])])}`);
  }
  function openLayer(id){const x=layers.get(id);if(!x)return;const related=i.products.filter(p=>p.mappings.some(m=>m.layer===id));
    show(`<span class="label">${esc(x.state)} · 基于已审阅样本</span><h2 id="detail-title">${esc(x.name)}</h2><h3>已有实现</h3><p>${esc(x.description)}</p>${refs(x.sources)}<h3>缺口与不确定性</h3><p>${esc(x.gap)}</p><h3>机会判断</h3><p>${esc(x.opportunity)}</p><h3>相关产品拆解</h3>${productChips(related.map(p=>p.id))}<p><button class="plain" data-filter-layer="${esc(id)}">查看这一层的全部产品 →</button></p>${sourceAudit(x.sources)}`);
  }
  function openEvent(id){const x=i.events.find(x=>x.id===id)||i.media.find(x=>x.id===id);if(!x)return;
    show(`<span class="label">${esc(x.type||x.channel)} · ${esc(x.status)}</span><h2 id="detail-title">${esc(x.title)}</h2><p>${x.date?'发生日期 '+date(x.date):'原文发布日期未核验'} · 收录 / 审阅 ${date(x.observed_at||i.reviewed_at)}</p><p>${esc(x.summary)}</p>${x.impact?`<h3>与 DSH 的关系 · 分析</h3><p>${esc(x.impact)}</p>`:''}${layerChips(x.layers)}${productChips(x.products||[])}${sourceAudit(x.sources)}`);
  }
  $('close-detail').onclick=()=>dialog.close();
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.idea)openIdea(b.dataset.idea);
    if(b.dataset.product)openProduct(b.dataset.product);
    if(b.dataset.layer)openLayer(b.dataset.layer);
    if(b.dataset.event)openEvent(b.dataset.event);
    if(b.dataset.filterLayer){dialog.close();productKind='all';$('product-layer').value=b.dataset.filterLayer;renderProducts();location.hash='products';}
  });
  function route(){const name=location.hash.slice(1).split('/')[0];const view=['overview','products','log','rankings'].includes(name)?name:'overview';
    document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==`view-${view}`);
    document.querySelectorAll('[data-view]').forEach(x=>{if(x.dataset.view===view)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
    window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',route);
  function segments(id,options,current,callback){$(id).innerHTML=options.map(([key,label])=>`<button data-value="${key}" aria-pressed="${key===current}">${label}</button>`).join('');$(id).onclick=e=>{const b=e.target.closest('button');if(b)callback(b.dataset.value);};}
  for(const id of ['product-layer','log-layer'])$(id).insertAdjacentHTML('beforeend',i.layers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join(''));
  const age=Math.max(0,Math.floor((Date.now()-Date.parse(s.generated_at))/86400000));
  $('status').textContent=`研究审阅 ${date(i.reviewed_at)} · 数据 ${date(s.generated_at)}${age?'（'+age+' 天前）':''}`;
  $('headline').textContent=i.headline;$('thesis').textContent=i.thesis;$('headline-sources').innerHTML=refs(['dsh-release','dsh-api','tapnow']);
  const release=a.releases[0], core=s.repositories.find(x=>x.id==='deepseek-ai/deepseek-harness');
  const first=trend[0], last=trend.at(-1), delta=trend.length>1?last.stars-first.stars:null;
  $('core-pulse').innerHTML=`<div class="pulse-number">${esc(release?.title||'版本待采集')}</div><div class="pulse-caption">${release?date(release.date)+' 发布 · '+(release.prerelease?'预发布版本':'正式发布'):''}</div><p class="pulse-caption">${core?core.stars.toLocaleString()+' Stars · ':''}${delta===null?'单期快照，暂不计算增长':`${date(first.date)} 至 ${date(last.date)}：Star ${delta>=0?'+':''}${delta}`}</p>`;
  $('release-track').innerHTML=[['通用附件与产物预览','功能补齐','dsh-files-015'],['子代理消息管理','交互更新','dsh-steer-015'],['Agent / Inbox 接口','需要适配','dsh-api-015']].map(([title,state,id])=>`<div class="release-step"><button class="plain" data-event="${id}">${title} ↗</button><span>${state}</span></div>`).join('');
  $('ideas').innerHTML=i.ideas.map(x=>`<article class="idea"><span class="label">${esc(x.priority)}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><button class="plain" data-idea="${x.id}">看分析、反方与验证方法 →</button></article>`).join('');
  $('layers').innerHTML=i.layers.map(x=>`<button class="layer" data-layer="${x.id}"><span class="layer-top"><strong>${esc(x.name)}</strong><span class="layer-state">${esc(x.state)} ↗</span></span><p>${esc(x.gap)}</p></button>`).join('');
  const mini=x=>`<article class="mini-event"><span class="subtle">${esc(x.type||x.channel)} · ${x.date?date(x.date):'发布日期待核验'}</span><h3><button class="plain" data-event="${x.id}">${esc(x.title)}</button></h3><p>${esc(x.impact||x.summary)}</p></article>`;
  $('recent-log').innerHTML=i.events.slice(0,3).map(mini).join('');$('media-preview').innerHTML=i.media.slice(0,3).map(mini).join('');
  function renderProducts(){segments('product-filters',[['all','全部产品'],['commercial','商业产品'],['community','社区应用']],productKind,v=>{productKind=v;renderProducts();});
    const layer=$('product-layer').value;
    const list=i.products.filter(x=>(productKind==='all'||(productKind==='community'?x.kind==='社区应用':x.kind!=='社区应用'))&&(layer==='all'||x.mappings.some(m=>m.layer===layer)));
    $('product-grid').innerHTML=list.map(x=>`<article class="product"><div class="product-title"><h3>${esc(x.name)}</h3><span class="label">${esc(x.kind)}</span></div><p>${esc(x.pitch)}</p><div class="mapping-hint">${[...new Set(x.mappings.map(m=>m.layer))].map(l=>`<span class="label">${esc(layers.get(l).name)}</span>`).join('')}</div><button data-product="${x.id}">拆解 ${x.mappings.length} 项能力 →</button>${refs([x.source])}</article>`).join('')||'<p class="empty">这一筛选下尚未收录产品。</p>';
    $('product-count').textContent=`${list.length} 个产品 · 已审阅 ${date(i.reviewed_at)} · 不以团队规模作为收录门槛`;
  }
  function renderLog(){segments('log-filters',[['all','全部'],['DSH','DSH 变化'],['产品','产品更新'],['media','媒体动态'],['研究','研究']],logKind,v=>{logKind=v;renderLog();});
    const layer=$('log-layer').value;
    let list=logKind==='media'?i.media.map(x=>({...x,type:x.channel})):logKind==='all'?[...i.events,...i.media.filter(x=>!['dify-blog','research-aig'].includes(x.id)).map(x=>({...x,type:x.channel}))]:i.events.filter(x=>x.type===logKind);
    list=list.filter(x=>layer==='all'||x.layers.includes(layer)).sort((x,y)=>(y.date||'').localeCompare(x.date||''));
    $('log-list').innerHTML=list.map(x=>`<article class="log-event"><div class="log-date"><span>${x.date?date(x.date):'日期待核验'}</span><br><span>${esc(x.type)}</span></div><div><h3><button class="plain event-title" data-event="${x.id}">${esc(x.title)}</button></h3><p>${esc(x.summary)}</p>${x.impact?`<p class="impact">对应 DSH：${esc(x.impact)}</p>`:''}${layerChips(x.layers)}${productChips(x.products||[])}${refs(x.sources)}<span class="subtle">${esc(x.status)} · 收录 / 审阅 ${date(x.observed_at||i.reviewed_at)}</span></div></article>`).join('')||'<p class="empty">这个能力层暂时没有已审阅动态。</p>';
  }
  $('all-media').onclick=()=>{logKind='media';$('log-layer').value='all';renderLog();location.hash='log';};
  $('product-layer').onchange=renderProducts;$('log-layer').onchange=renderLog;
  $('activity-status').textContent=`版本采集 ${date(a.releases_observed_at)} · commit 采集 ${date(a.commits_observed_at)} · 每次抓取最多 8 个版本与 15 条 commit，历史保留；不是完整提交统计。${a.errors.length?' 本次部分失败，旧记录保留。':''}`;
  $('raw-activity').innerHTML=[...a.releases.map(x=>({...x,kind:'版本'})),...a.commits.map(x=>({...x,kind:'commit'}))].sort((x,y)=>y.date.localeCompare(x.date)).map(x=>`<div class="raw-row"><a href="${link(x.url)}">${esc(x.kind)} · ${esc(x.title)} ↗</a><span>${date(x.date)} · 能力映射待审阅</span></div>`).join('');
  function renderRanks(){segments('rank-filters',[['stars','应用 Star 榜'],['updated','最近推送榜']],rankKind,v=>{rankKind=v;renderRanks();});
    const rows=i.products.filter(x=>x.repo).map(p=>({p,repo:s.repositories.find(x=>x.id===p.repo.toLowerCase())})).filter(x=>x.repo&&!x.repo.archived&&!x.repo.fork);
    rows.sort(rankKind==='stars'?(x,y)=>y.repo.stars-x.repo.stars||x.p.name.localeCompare(y.p.name):(x,y)=>y.repo.pushed_at.localeCompare(x.repo.pushed_at)||x.p.name.localeCompare(y.p.name));
    $('rank-date').textContent=`${rows.length} 个已收录应用 · 快照 ${date(s.generated_at)} · 非全生态榜`;
    $('ranking-list').innerHTML=rows.map(({p,repo},n)=>`<article class="rank-row"><span class="rank-number">${String(n+1).padStart(2,'0')}</span><div><h3><button class="plain rank-title" data-product="${p.id}">${esc(p.name)} →</button></h3><p>${esc(p.pitch)}</p><a class="subtle" href="${link(repo.url)}">项目来源 ↗</a> <span class="subtle">· ${esc(repo.license||'许可证待核验')} · 观察 ${date(repo.observed_at)}</span></div><div class="rank-value">${rankKind==='stars'?repo.stars.toLocaleString():date(repo.pushed_at)}<span>${rankKind==='stars'?'GitHub Stars':'最近推送，非发布日'}</span></div></article>`).join('')||'<p class="empty">暂无具备公开可比数据的应用。</p>';
  }
  function renderRepos(){const q=$('search').value.trim().toLowerCase();const rows=s.repositories.filter(x=>(x.name+' '+x.description).toLowerCase().includes(q));const pages=Math.max(1,Math.ceil(rows.length/10));repoPage=Math.min(repoPage,pages-1);
    $('repos').innerHTML=rows.slice(repoPage*10,repoPage*10+10).map(x=>`<article class="repo"><h3><a href="${link(x.url)}">${esc(x.name)} ↗</a></h3><p>${esc(x.description)}</p><span class="subtle">${x.stars.toLocaleString()} Stars · ${esc(x.evidence)} · 观察 ${date(x.observed_at)}</span></article>`).join('')||'<p class="empty">没有匹配的仓库。</p>';
    $('page').textContent=`${repoPage+1} / ${pages}`;$('prev').disabled=repoPage===0;$('next').disabled=repoPage>=pages-1;
  }
  $('search').oninput=()=>{repoPage=0;renderRepos();};$('prev').onclick=()=>{repoPage--;renderRepos();};$('next').onclick=()=>{repoPage++;renderRepos();};
  $('coverage').textContent=s.coverage+' 搜索匹配数 '+s.search_total+'；'+(s.errors.length?'部分采集失败，历史数据保留。':'不是全量普查。');
  $('benchmarks').innerHTML=r.benchmarks.map(x=>`<p>${esc(x.name)}：${x.value===null?'未评测':esc(x.value)} · ${esc(x.reason)}</p>`).join('');
  renderProducts();renderLog();renderRanks();renderRepos();route();
}
main().catch(e=>{$('status').textContent='研究数据加载失败，请刷新重试或从 GitHub 查看 data 目录。';console.error(e);});
