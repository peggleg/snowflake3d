import opentype from 'opentype.js';
import fontCatalog from '../snowflake/src/fonts/catalog.json' with {type:'json'};
import ClipperLib from 'clipper-lib';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const source=process.argv[2];if(!source)throw Error('Usage: node scripts/build-fonts.mjs <font directory> [montecarlo niconne lato breeserif]');
await mkdir('snowflake/src/fonts',{recursive:true});
function flatten(commands){
 const contours=[];let contour=[],current=[0,0];
 const push=(x,y)=>{current=[x,y];contour.push([Math.round(x*10000)/10000,Math.round(-y*10000)/10000]);};
 for(const c of commands){
  if(c.type==='M'){if(contour.length)contours.push(contour);contour=[];push(c.x,c.y);}
  else if(c.type==='L')push(c.x,c.y);
  else if(c.type==='Q'||c.type==='C'){
   const [x,y]=current,n=12;
   for(let i=1;i<=n;i++){const t=i/n,u=1-t;
    if(c.type==='Q')push(u*u*x+2*u*t*c.x1+t*t*c.x,u*u*y+2*u*t*c.y1+t*t*c.y);
    else push(u*u*u*x+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x,u*u*u*y+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y);
   }
  }else if(c.type==='Z'){if(contour.length)contours.push(contour);contour=[];}
 }
 if(contour.length)contours.push(contour);
 return contours.map(c=>c.filter((p,i)=>!i||p[0]!==c[i-1][0]||p[1]!==c[i-1][1])).map(c=>c.length>1&&c[0][0]===c.at(-1)[0]&&c[0][1]===c.at(-1)[1]?c.slice(0,-1):c).filter(c=>c.length>=3);
}
const area=c=>c.reduce((a,p,i)=>{const q=c[(i+1)%c.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2;
for(const name of process.argv.slice(3).length?process.argv.slice(3):['montecarlo','niconne','lato','breeserif']){
 if(!fontCatalog[name])throw Error(`Unknown font recipe identifier: ${name}`);
 const bytes=await readFile(resolve(source,`${name}.ttf`)),font=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),glyphs={};
 for(let code=32;code<=126;code++){
  const char=String.fromCharCode(code);if(!/[A-Za-z0-9 '-]/.test(char))continue;const g=font.charToGlyph(char),contours=flatten(g.getPath(0,0,1).commands).map(c=>ClipperLib.Clipper.CleanPolygon(c.map(([x,y])=>({X:Math.round(x*1000000),Y:Math.round(y*1000000)})),800).map(p=>[p.X/1000000,p.Y/1000000])).filter(c=>c.length>=3);
  if(contours.length){const largest=contours.reduce((a,c)=>Math.abs(area(c))>Math.abs(area(a))?c:a);if(area(largest)<0)contours.forEach(c=>c.reverse());}
  const outers=contours.filter(c=>area(c)>0).sort((a,b)=>area(b)-area(a)),bridges=[];
  for(const c of outers.slice(1)){
   let best=Infinity,pair;
   for(const p of c)for(const q of outers[0]){const d=(p[0]-q[0])**2+(p[1]-q[1])**2;if(d<best){best=d;pair=[p,q];}}
   if(pair)bridges.push(pair);
  }
  glyphs[char]={advance:g.advanceWidth/font.unitsPerEm,contours,bridges};
 }
 const kern={};for(const a of Object.keys(glyphs))for(const b of Object.keys(glyphs)){const k=font.getKerningValue(font.charToGlyph(a),font.charToGlyph(b))/font.unitsPerEm;if(k)kern[a+b]=k;}
 await writeFile(`snowflake/src/fonts/${name}.json`,JSON.stringify({...fontCatalog[name],glyphs,kern})+'\n');
 console.log(name,Object.keys(glyphs).length,'glyphs');
}
