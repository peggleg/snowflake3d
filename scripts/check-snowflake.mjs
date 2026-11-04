import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {productionBuild,indexablePages,siteOrigin} from '../snowflake/seo.mjs';
const production=productionBuild();
const root=new URL('../dist-snowflake/',import.meta.url),files=await readdir(root);
assert.deepEqual(files.sort(),['THIRD_PARTY_NOTICES.txt','404.html','contact.html','analytics.html','privacy.html','usage.html','help.html','independence.html','_routes.json','_headers','_redirects','assets','favicon.svg','social-preview.png','snowflake.html','robots.txt',...(production?['sitemap.xml']:[])].sort());
const html=await readFile(new URL('snowflake.html',root),'utf8');
assert.ok(html.includes('Snowflake workshop'));
assert.ok(html.includes('rel="icon"')&&html.includes('/favicon.svg?v=1'));
assert.ok((await readFile(new URL('favicon.svg',root),'utf8')).includes('viewBox="0 0 32 32"'));
assert.ok(!/lithophane/i.test(html));
assert.ok(html.includes('rel="canonical" href="https://snowflake3d.com/snowflake"'));
const redirects=await readFile(new URL('_redirects',root),'utf8');
assert.ok(redirects.includes('/ /snowflake '+(production?301:302)));
assert.ok(redirects.includes('/snowflake/ /snowflake '+(production?301:302)));
assert.ok(!redirects.includes('index.html'),'Do not rewrite to an index that Pages canonicalizes to root');
assert.ok(!files.includes('index.html'),'Root has no HTML page to canonicalize to');
assert.ok(!redirects.split('\n').some(line=>/^\/snowflake\s/.test(line)),'Clean route is served directly without a redirect or rewrite');
const assets=await readdir(new URL('assets/',root));
assert.ok(assets.some(f=>f.endsWith('.js'))&&assets.some(f=>f.endsWith('.css')));
assert.ok(assets.every(f=>/\.(js|css)$/.test(f)),'No main-site image/worker assets');
console.log('Standalone build verified: isolated routes and '+(production?'production':'preview')+' SEO.');

const routes=JSON.parse(await readFile(new URL('_routes.json',root),'utf8'));assert.deepEqual(routes.include,['/api/contact']);const contact=await readFile(new URL('contact.html',root),'utf8');assert.ok(contact.includes('Privacy enquiries')&&contact.includes('noindex,nofollow'));

assert.ok(html.includes('Build plate size')&&html.includes('180 × 180 mm')&&html.includes('256 × 256 mm'));
assert.ok(!/Bambu A1|choose A1|includes the model and print settings/.test(html));
for(const f of assets.filter(f=>f.endsWith('.js'))){
 const js=await readFile(new URL('assets/'+f,root),'utf8');
 assert.ok(!/machine_start_gcode|machine_end_gcode|filament_settings_id|Bambu Lab A1/.test(js),'No legacy printer profiles in browser bundles');
}

for(const page of ['privacy','usage','help','independence']){
 const body=await readFile(new URL(page+'.html',root),'utf8');
 assert.ok(body.includes(production?'index,follow':'noindex,nofollow')&&body.includes('name="referrer" content="no-referrer"'));
 assert.ok(body.includes('href="/snowflake"')&&body.includes('aria-label="Site information"'));
 assert.ok(!/\[LEGAL NAME\]|\[COUNTRY\]|PUBLICATION DATE/.test(body));
 for(const target of ['privacy','usage','help','independence'])assert.ok(body.includes('href="/'+target+'"'));
}

const headers=await readFile(new URL('_headers',root),'utf8'),robots=await readFile(new URL('robots.txt',root),'utf8');
assert.ok(headers.includes('Referrer-Policy: no-referrer')&&headers.includes('Content-Security-Policy:'));
assert.ok(html.includes('name="robots" content="'+(production?'index,follow':'noindex,nofollow')+'"'));
assert.ok(html.includes('property="og:image" content="https://snowflake3d.com/social-preview.png"'));
const image=await readFile(new URL('social-preview.png',root));assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
if(production){
 assert.ok(!headers.startsWith('/*\n  X-Robots-Tag:'));
 assert.ok(headers.includes('https://:project.pages.dev/*')&&headers.includes('https://:version.:project.pages.dev/*'));
 assert.ok(robots.includes('Allow: /')&&!robots.includes('Disallow: /\n')&&robots.includes('Sitemap: '+siteOrigin+'/sitemap.xml'));
 const sitemap=await readFile(new URL('sitemap.xml',root),'utf8');
 for(const page of indexablePages)assert.ok(sitemap.includes('<loc>'+siteOrigin+'/'+page+'</loc>'));
 assert.ok(!/<loc>[^<]*\?|<loc>[^<]*\/(contact|analytics)<\/loc>/.test(sitemap));
}else{assert.ok(headers.startsWith('/*\n  X-Robots-Tag: noindex, nofollow'));assert.equal(robots,'User-agent: *\nDisallow: /\n');}
