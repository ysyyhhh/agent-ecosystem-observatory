/* Evidence graph: edges are mapping records, never inferred integrations. */
window.initEcosystemGraph = function(i, openProduct, openLayer, escapeText, safeLink) {
  const $=id=>document.getElementById(id), esc=escapeText;
  const sources=new Map(i.sources.map(s=>[s.id,s]));
  const layers=new Map(i.layers.map(s=>[s.id,s]));
  let selected=null, zoom=1, pan={x:0,y:0}, drag=null, moved=false;
  const svg=$('ecosystem-svg');
  const categories=[...new Set(i.products.map(p=>p.category))].sort();
  $('graph-category').innerHTML='<option value="all">全部分类</option>'+categories.map(c=>`<option>${esc(c)}</option>`).join('');
  const ref=id=>{const s=sources.get(id);return `<a href="${safeLink(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`;};
  const idOf=(type,id)=>type+':'+id;
  let nodes=[],edges=[],visibleProducts=[];
  function reset(){selected=null;zoom=1;pan={x:0,y:0};render();}
  function transform(){$('graph-world').setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`);$('graph-zoom').textContent=Math.round(zoom*100)+'%';}
  function drawSelection(){
    let connected=new Set(), activeEdges=new Set();
    if(selected){
      const selectedNode=nodes.find(n=>n.id===selected);
      let chosen=[];
      if(selectedNode?.type==='product')chosen=visibleProducts.filter(p=>p.id===selectedNode.ref);
      if(selectedNode?.type==='ecosystem')chosen=visibleProducts.filter(p=>p.ecosystem===selectedNode.ref);
      if(selectedNode?.type==='layer')chosen=visibleProducts.filter(p=>p.mappings.some(m=>m.layer===selectedNode.ref));
      if(selectedNode?.type==='provider')chosen=visibleProducts.filter(p=>p.mappings.some(m=>m.providers.includes(selectedNode.ref)));
      for(const p of chosen){
        connected.add(idOf('ecosystem',p.ecosystem));connected.add(idOf('product',p.id));
        for(const m of p.mappings){
          if(selectedNode.type==='layer'&&m.layer!==selectedNode.ref)continue;
          if(selectedNode.type==='provider'&&!m.providers.includes(selectedNode.ref))continue;
          connected.add(idOf('layer',m.layer));m.providers.forEach(v=>connected.add(idOf('provider',v)));
          edges.forEach((e,k)=>{if(e.product===p.id&&(!e.layer||e.layer===m.layer)&&(!e.provider||m.providers.includes(e.provider)))activeEdges.add(k);});
        }
      }
      connected.add(selected);details(selectedNode,chosen);
    }else{$('graph-detail').innerHTML='<h3>从一个产品开始</h3><p>点击产品高亮它的能力与候选实现；点击能力层查看相关产品。空白处可拖动，使用按钮缩放，也可按分类筛选。</p><p>虚线是本站能力映射，并非实际集成、采用 DSH 或等价替代。生态归组仅用于组织观察。</p>';}
    svg.querySelectorAll('.graph-node').forEach(el=>{el.classList.toggle('dimmed',!!selected&&!connected.has(el.dataset.node));el.classList.toggle('selected',el.dataset.node===selected);el.setAttribute('aria-pressed',String(el.dataset.node===selected));});
    svg.querySelectorAll('.graph-edge').forEach((el,k)=>{el.classList.toggle('dimmed',!!selected&&!activeEdges.has(k));el.classList.toggle('highlight',!!selected&&activeEdges.has(k));});
  }
  function details(n,chosen){
    if(!n)return;
    let html=`<span class="label">${esc(n.subtitle)}</span><h3>${esc(n.label)}</h3>`;
    if(n.type==='product'){
      const p=chosen[0];html+=`<p>${esc(p.pitch)}</p><p>分类：${esc(p.category)} · 核查 ${esc(p.reviewed_at||i.reviewed_at)}</p>`;
      html+=p.mappings.map(m=>`<div class="graph-mapping"><strong>${esc(m.task)}</strong><p>${esc(layers.get(m.layer).name)} → ${m.providers.length?m.providers.map(ref).join(' / '):'暂无已核验候选'}</p><p>${esc(m.gap)}</p></div>`).join('');
      html+=`<p>${ref(p.source)}</p><button class="chip" id="graph-open-product">完整产品拆解 →</button>`;
    }else if(n.type==='layer'){
      const l=layers.get(n.ref);html+=`<p>${esc(l.description)}</p><p>${esc(l.gap)}</p><button class="chip" id="graph-open-layer">缺口与机会分析 →</button>`;
    }else if(n.type==='provider'){
      const s=sources.get(n.ref);html+=`<p>${ref(n.ref)}</p><p>${esc(s.type)} · 核查 ${esc(s.checked_at)}。文档候选，未做集成实测。</p>`;
    }else html+='<p>按产品体系组织的观察分组，不是对外部产品架构或商业合作关系的断言。</p>';
    if(n.type!=='product')html+='<p>关联产品</p>'+chosen.map(p=>`<button class="chip graph-pick" data-id="${esc(p.id)}">${esc(p.name)}</button>`).join('');
    $('graph-detail').innerHTML=html;
    if($('graph-open-product'))$('graph-open-product').onclick=()=>openProduct(n.ref);
    if($('graph-open-layer'))$('graph-open-layer').onclick=()=>openLayer(n.ref);
    $('graph-detail').querySelectorAll('.graph-pick').forEach(b=>b.onclick=()=>{selected=idOf('product',b.dataset.id);drawSelection();});
  }
  function render(){
    const category=$('graph-category').value,kind=$('graph-kind').value,q=$('graph-search').value.trim().toLowerCase();
    visibleProducts=i.products.filter(p=>(category==='all'||p.category===category)&&(kind==='all'||p.openness===kind)&&(!q||(p.name+' '+p.pitch+' '+p.ecosystem+' '+p.category).toLowerCase().includes(q)));
    nodes=[];edges=[];
    const add=(type,ref,label,subtitle)=>{const id=idOf(type,ref);if(!nodes.some(n=>n.id===id))nodes.push({id,type,ref,label,subtitle});return id;};
    for(const p of visibleProducts){
      const eco=add('ecosystem',p.ecosystem,p.ecosystem,p.openness==='open'?'开源社区':'产品体系');
      const prod=add('product',p.id,p.name,p.category+' · '+(p.openness==='closed'?'闭源服务':p.openness==='open'?'社区应用':'混合'));
      edges.push({from:eco,to:prod,product:p.id,type:'group'});
      for(const m of p.mappings){
        const layer=add('layer',m.layer,layers.get(m.layer).name,'能力对照层');
        if(!edges.some(e=>e.from===prod&&e.to===layer))edges.push({from:prod,to:layer,product:p.id,layer:m.layer,type:'mapping'});
        for(const source of m.providers){
          const s=sources.get(source),provider=add('provider',source,s.title,s.type==='官方代码'?'DSH 官方模块':'DSH 社区候选');
          if(!edges.some(e=>e.from===layer&&e.to===provider&&e.product===p.id))edges.push({from:layer,to:provider,product:p.id,layer:m.layer,provider:source,type:'mapping'});
        }
      }
    }
    const types=['ecosystem','product','layer','provider'],x=[22,300,585,860];
    const height=Math.max(460,visibleProducts.length*53+85,nodes.filter(n=>n.type==='provider').length*53+85);
    types.forEach((t,col)=>{const list=nodes.filter(n=>n.type===t);list.forEach((n,j)=>{n.x=x[col];n.y=70+j*(height-145)/Math.max(list.length-1,1);});});
    svg.setAttribute('viewBox',`0 0 1120 ${height}`);
    const positions=new Map(nodes.map(n=>[n.id,n]));
    const paths=edges.map(e=>{const f=positions.get(e.from),t=positions.get(e.to);const x1=f.x+222,y1=f.y+20,x2=t.x,y2=t.y+20;return `<path class="graph-edge ${e.type}" d="M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}"/>`;}).join('');
    const nodeHtml=nodes.map(n=>`<g class="graph-node graph-${n.type}" transform="translate(${n.x} ${n.y})" data-node="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc(n.label+'，'+n.subtitle)}"><title>${esc(n.label+' · '+n.subtitle)}</title><rect width="222" height="43" rx="6"/><text x="12" y="18">${esc(n.label.length>27?n.label.slice(0,26)+'…':n.label)}</text><text class="node-subtitle" x="12" y="34">${esc(n.subtitle)}</text></g>`).join('');
    svg.innerHTML=`<g id="graph-world">${['商业 / 社区体系','产品与应用','能力分类','DSH 官方与社区'].map((t,k)=>`<text class="graph-heading" x="${x[k]}" y="30">${t}</text>`).join('')}${paths}${nodeHtml}</g>`;
    $('graph-empty').hidden=visibleProducts.length>0;
    $('graph-count').textContent=`${visibleProducts.length} 个产品 · ${nodes.length} 个节点 · ${edges.length} 条映射记录`;
    if(selected&&!positions.has(selected))selected=null;
    transform();drawSelection();
  }
  svg.addEventListener('click',e=>{if(moved)return;const n=e.target.closest('[data-node]');if(n){selected=selected===n.dataset.node?null:n.dataset.node;drawSelection();}});
  svg.addEventListener('keydown',e=>{const n=e.target.closest('[data-node]');if(n&&['Enter',' '].includes(e.key)){e.preventDefault();selected=n.dataset.node;drawSelection();}});
  svg.addEventListener('pointerdown',e=>{moved=false;if(e.target.closest('[data-node]'))return;drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};svg.setPointerCapture(e.pointerId);});
  svg.addEventListener('pointermove',e=>{if(!drag)return;const matrix=svg.getScreenCTM();if(!matrix)return;const dx=(e.clientX-drag.x)/matrix.a,dy=(e.clientY-drag.y)/matrix.d;moved=Math.abs(dx)+Math.abs(dy)>3;pan={x:drag.px+dx,y:drag.py+dy};transform();});
  svg.addEventListener('pointerup',()=>{drag=null;});svg.addEventListener('pointercancel',()=>{drag=null;});
  function scale(factor){const next=Math.max(.5,Math.min(3,zoom*factor)),ratio=next/zoom;const box=svg.viewBox.baseVal;pan={x:box.width/2-(box.width/2-pan.x)*ratio,y:box.height/2-(box.height/2-pan.y)*ratio};zoom=next;transform();}
  $('graph-plus').onclick=()=>scale(1.25);$('graph-minus').onclick=()=>scale(.8);$('graph-reset').onclick=reset;
  $('graph-category').onchange=reset;$('graph-kind').onchange=reset;$('graph-search').oninput=reset;
  render();
};

