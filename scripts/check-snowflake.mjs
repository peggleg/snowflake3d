import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../dist-snowflake/',import.meta.url),files=await readdir(root);
assert.deepEqual(files.sort(),['THIRD_PARTY_NOTICES.txt','404.html','contact.html','analytics.html','_routes.json','_headers','_redirects','assets','favicon.svg','snowflake.html','robots.txt'].sort());
const html=await readFile(new URL('snowflake.html',root),'utf8');
assert.ok(html.includes('Snowflake workshop'));
assert.ok(html.includes('rel="icon"')&&html.includes('/favicon.svg?v=1'));
assert.ok((await readFile(new URL('favicon.svg',root),'utf8')).includes('viewBox="0 0 32 32"'));
assert.ok(!/lithophane|makerworld|sitemap|<nav|rel="canonical"/i.test(html));
const redirects=await readFile(new URL('_redirects',root),'utf8');
assert.ok(redirects.includes('/ /snowflake 302'));
assert.ok(redirects.includes('/snowflake/ /snowflake 302'));
assert.ok(!redirects.includes('index.html'),'Do not rewrite to an index that Pages canonicalizes to root');
assert.ok(!files.includes('index.html'),'Root has no HTML page to canonicalize to');
assert.ok(!redirects.split('\n').some(line=>/^\/snowflake\s/.test(line)),'Clean route is served directly without a redirect or rewrite');
const assets=await readdir(new URL('assets/',root));
assert.ok(assets.some(f=>f.endsWith('.js'))&&assets.some(f=>f.endsWith('.css')));
assert.ok(assets.every(f=>/\.(js|css)$/.test(f)),'No main-site image/worker assets');
console.log('Standalone build verified: generator only, isolated routes, no main-site navigation/assets/sitemap.');

const routes=JSON.parse(await readFile(new URL('_routes.json',root),'utf8'));assert.deepEqual(routes.include,['/api/contact']);const contact=await readFile(new URL('contact.html',root),'utf8');assert.ok(contact.includes('Privacy enquiries')&&contact.includes('noindex,nofollow'));

assert.ok(html.includes('Build plate size')&&html.includes('180 × 180 mm')&&html.includes('256 × 256 mm'));
assert.ok(!/Bambu|choose A1|includes the model and print settings/.test(html));
for(const f of assets.filter(f=>f.endsWith('.js'))){
 const js=await readFile(new URL('assets/'+f,root),'utf8');
 assert.ok(!/machine_start_gcode|machine_end_gcode|filament_settings_id|Bambu Lab A1/.test(js),'No legacy printer profiles in browser bundles');
}
