import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionBuild,seoHtml,seoHeaders,robotsText,sitemapXml,indexablePages} from '../snowflake/seo.mjs';
test('only the production branch enables indexing; unknown and preview environments stay closed',()=>{
 for(const env of [{},{CF_PAGES_BRANCH:'preview'},{CF_PAGES_BRANCH:'feature'},{NODE_ENV:'production'}])assert.equal(productionBuild(env),false);
 assert.equal(productionBuild({CF_PAGES_BRANCH:'main'}),true);
 assert.equal(robotsText(false),'User-agent: *\nDisallow: /\n');assert.match(robotsText(true),/Sitemap: https:\/\/snowflake3d.com\/sitemap.xml/);
});
test('SEO replaces metadata once and canonical URLs never contain a design recipe',()=>{
 const source='<head><title>Old</title><meta name="description" content="Old"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/favicon.svg"></head>';
 for(const page of [...indexablePages,'contact','analytics'])for(const production of [false,true]){
  const html=seoHtml(source,page,production);
  assert.equal((html.match(/<title>/g)||[]).length,1);assert.equal((html.match(/name="description"/g)||[]).length,1);
  assert.ok(html.includes('rel="canonical" href="https://snowflake3d.com/'+page+'"'));assert.ok(!html.includes('?'));
  assert.ok(html.includes('content="'+(production&&indexablePages.includes(page)?'index,follow':'noindex,nofollow')+'"'));
  assert.ok(html.includes('og:image:width" content="1200"')&&html.includes('twitter:card" content="summary_large_image"'));
  assert.ok(html.includes('href="/favicon.svg"'));
 }
});
test('production headers retain security and exclude Pages hostnames from indexing',()=>{
 const base='/*\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: default-src self\n';
 assert.equal(seoHeaders(base,false),base);const prod=seoHeaders(base,true);
 assert.ok(prod.startsWith('/*\n  Referrer-Policy: no-referrer'));assert.match(prod,/https:\/\/:version\.:project.pages.dev\/\*/);assert.match(prod,/\/contact\n  X-Robots-Tag: noindex/);assert.match(prod,/\/analytics\n  X-Robots-Tag: noindex/);
 const sitemap=sitemapXml();assert.equal((sitemap.match(/<loc>/g)||[]).length,indexablePages.length);assert.ok(!/contact|analytics|preview|<loc>[^<]*\?/.test(sitemap));
});
