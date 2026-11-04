export const siteOrigin='https://snowflake3d.com';
export const indexablePages=['snowflake','help','privacy','usage','independence'];
export function productionBuild(env=process.env){return env.CF_PAGES_BRANCH==='main';}
const descriptions={
 snowflake:'Create unique 3D printable snowflakes with custom centre text. Download STL or 3MF files for private, non-commercial printing.',
 help:'Learn to generate snowflakes, add centre text, download STL and 3MF files, and assign separate text colours in your slicer.',
 privacy:'How Snowflake3D handles design links, optional Google Analytics, cookies and privacy enquiries, including email retention and your choices.',
 usage:'Snowflake3D is for private, non-commercial use only. Read the terms for generated files, printed objects and separately licensed material.',
 independence:'Snowflake3D is independent and is not endorsed by Bambu Lab, MakerWorld or MakerLab. Read the independence statement and font credits.',
 contact:'Contact Snowflake3D privately about your personal information or make a privacy request using the protected enquiry form.',
 analytics:'Understand optional Google Analytics, analytics cookies and how to accept, reject or withdraw consent on Snowflake3D.',
};
const titles={snowflake:'Snowflake3D | 3D Printable Snowflake Generator',help:'Help & 3MF Printing Guide | Snowflake3D',privacy:'Privacy & Cookies | Snowflake3D',usage:'Private, Non-Commercial Usage Terms | Snowflake3D',independence:'Independence & Font Credits | Snowflake3D',contact:'Privacy Enquiries | Snowflake3D',analytics:'Analytics & Cookie Choices | Snowflake3D'};
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function seoHtml(html,page,production){
 const title=titles[page],description=descriptions[page],url=siteOrigin+'/'+page;
 if(!title)throw Error('Missing SEO metadata for '+page);
 html=html.replace(/<title>[^]*?<\/title>/,'').replace(/<meta\s+name="(?:description|robots)"[^>]*>/g,'');
 const tags=[`<title>${escape(title)}</title>`,`<meta name="description" content="${escape(description)}">`,`<meta name="robots" content="${production&&indexablePages.includes(page)?'index,follow':'noindex,nofollow'}">`,`<link rel="canonical" href="${url}">`,
 `<meta property="og:type" content="website">`,`<meta property="og:site_name" content="Snowflake3D">`,`<meta property="og:title" content="${escape(title)}">`,`<meta property="og:description" content="${escape(description)}">`,`<meta property="og:url" content="${url}">`,`<meta property="og:image" content="${siteOrigin}/social-preview.png">`,`<meta property="og:image:width" content="1200">`,`<meta property="og:image:height" content="630">`,`<meta property="og:image:alt" content="A white snowflake beside the Snowflake3D workshop title">`,`<meta name="twitter:card" content="summary_large_image">`,`<meta name="twitter:title" content="${escape(title)}">`,`<meta name="twitter:description" content="${escape(description)}">`,`<meta name="twitter:image" content="${siteOrigin}/social-preview.png">`,`<meta name="twitter:image:alt" content="A white snowflake beside the Snowflake3D workshop title">`];
 return html.replace('</head>',tags.join('')+'</head>');
}
export function robotsText(production){return production?`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteOrigin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n';}
export function sitemapXml(){return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+indexablePages.map(page=>`<url><loc>${siteOrigin}/${page}</loc></url>`).join('')+'</urlset>\n';}
export function seoHeaders(base,production){
 if(!production)return base;
 return base.replace('  X-Robots-Tag: noindex, nofollow\n','')+'\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n\n/contact\n  X-Robots-Tag: noindex, nofollow\n\n/analytics\n  X-Robots-Tag: noindex, nofollow\n';
}
