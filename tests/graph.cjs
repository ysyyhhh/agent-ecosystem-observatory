const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 const p=await b.newPage({viewport:{width:1440,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto((process.env.SITE_URL||'http://127.0.0.1:8086')+'/#ecosystem');await p.locator('.graph-node').first().waitFor();
 assert.equal(await p.locator('.graph-node.graph-product').count(),17);
 await p.screenshot({path:'.local/graph-all.png',fullPage:true});
 await p.locator('#graph-kind').selectOption('closed');assert.equal(await p.locator('.graph-node.graph-product').count(),12);
 await p.locator('#graph-category').selectOption('应用构建');assert.equal(await p.locator('.graph-node.graph-product').count(),2);
 await p.locator('[data-node="product:lovable"]').click();assert.match(await p.locator('#graph-detail').textContent(),/托管、数据库/);
 assert.equal(await p.locator('.graph-node.graph-product:not(.dimmed)').count(),1);
 await p.locator('#graph-plus').click();assert.equal(await p.locator('#graph-zoom').textContent(),'125%');
 await p.locator('#graph-reset').click();assert.equal(await p.locator('#graph-zoom').textContent(),'100%');
 await p.locator('[data-node="product:replit"]').focus();await p.keyboard.press('Enter');assert.match(await p.locator('#graph-detail').textContent(),/Replit/);
 await p.locator('#graph-open-product').click();assert.match(await p.locator('#detail-title').textContent(),/Replit/);await p.keyboard.press('Escape');
 await p.locator('#graph-search').fill('不存在的产品zzzz');assert.equal(await p.locator('.graph-node').count(),0);assert.ok(await p.locator('#graph-empty').isVisible());
 await p.locator('#graph-search').fill('');await p.locator('#graph-category').selectOption('视频创作');await p.locator('#graph-kind').selectOption('all');
 await p.locator('[data-node="product:tapnow"]').click();await p.screenshot({path:'.local/graph-focus.png',fullPage:true});
 const before=await p.locator('#graph-world').getAttribute('transform');const box=await p.locator('#ecosystem-svg').boundingBox();
 await p.mouse.move(box.x+10,box.y+box.height-10);await p.mouse.down();await p.mouse.move(box.x+75,box.y+box.height-40);await p.mouse.up();assert.notEqual(await p.locator('#graph-world').getAttribute('transform'),before);
 await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:'.local/graph-mobile.png',fullPage:false});
 await p.emulateMedia({colorScheme:'dark'});await p.screenshot({path:'.local/graph-dark.png',fullPage:false});
 await p.locator('nav a[href="#products"]').click();await p.locator('#product-filters [data-value="closed"]').click();assert.equal(await p.locator('.product').count(),12);
 await p.locator('#product-category').selectOption('应用构建');assert.equal(await p.locator('.product').count(),2);
 assert.deepEqual(errors,[]);await b.close();console.log('PASS graph: classification, source-backed focus, gaps, zoom, pan, keyboard, empty state, mobile and product filters');
})().catch(e=>{console.error(e);process.exit(1)});

