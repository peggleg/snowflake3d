// Generate the source artwork from a real workshop mesh. Rasterize the SVG at 1200 × 630.
import {writeFile} from 'node:fs/promises';
import {design} from '../snowflake/src/design.js';
const m=design({seed:'snowflake3d-launch',silhouette:'fern',centre:'star-frame',complexity:7,branch:1.6,fullness:40});
if(!m.valid)throw Error('Invalid social preview model');
const path=m.loops.map(l=>'M'+l.map(([x,y])=>`${x},${-y}`).join('L')+'Z').join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="bg"><stop stop-color="#28454b"/><stop offset="1" stop-color="#1f1e1d"/></radialGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><rect x="0" y="0" width="1200" height="6" fill="#7fc3b2"/><text x="72" y="115" fill="#7fc3b2" font-family="Arial,sans-serif" font-size="22" letter-spacing="4">SNOWFLAKE3D</text><g fill="#f1ebdf" font-family="Georgia,serif" font-size="65"><text x="72" y="235">Every flake.</text><text x="72" y="312">Made by you.</text></g><g fill="#c7c6bd" font-family="Arial,sans-serif" font-size="24"><text x="72" y="385">Create your own 3D printable snowflake.</text><text x="72" y="426">Custom centre text · STL &amp; 3MF</text></g><text x="72" y="550" fill="#7fc3b2" font-family="Arial,sans-serif" font-size="23">snowflake3d.com</text><path d="${path}" transform="translate(925 325) scale(4.5)" fill="#f1ebdf" fill-rule="evenodd"/></svg>`;
await writeFile(process.argv[2]||'/tmp/snowflake3d-social.svg',svg);
