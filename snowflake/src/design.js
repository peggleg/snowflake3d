import ClipperLib from 'clipper-lib';
import {encodeCompact,decodeCompact} from './share-codec.js';
import earcut from 'earcut';
import {lettering,normalizeText} from './lettering.js';
import {scriptLettering} from './script-lettering.js';
import {raisedTextMesh} from './raised-text.js';
import {framedTextPlan,framedTextStyles} from './framed-text.js';
import {textCentrePlan,centreTextFonts} from './centre-text.js';
import {centreChoices,centrePlan,replaceCentre} from './centre.js';
import {crystalArm as legacyCrystalArm} from './crystal-arms-v4.js';
import {crystalArm,crystalFamilies} from './crystal-arms.js';
import {balancedArm,resolveSilhouette} from './airy-growth.js';
import {centreMaterialParts} from './material-parts.js';
import {naturalArm} from './natural-growth.js';
import {branchDetail} from './branch-detail.js';
import {conformTriangles} from './triangulate.js';
export const defaults={seed:'winter-2026',mode:'random',armLayout:'all',growth:'airy',naturalStyle:'random',silhouette:'random',crystalQuality:'refined',centre:'random',centreText:'TEXT',centreFont:'lato',centreJoin:'open-random',centreAms:'off',mainColour:'#FFFFFF',centreColour:'#D94A64',centreSize:18,text:'text test',font:'stroke',textLayout:'mirrored',letterSpacing:0,textWeight:.65,textSize:100,textPosition:0,diameter:100,thickness:3,complexity:5,branch:1.6,fullness:30,pattern:'mixed',printer:'mini'};
export const printers={mini:{name:'180 × 180 mm build plate',size:180},a1:{name:'256 × 256 mm build plate',size:256}};
export function settings(input={}){
 const s={...defaults,...input};
 for(const [k,min,max] of [['diameter',40,245],['thickness',1,8],['complexity',1,18],['branch',1.2,4],['fullness',0,100],['textSize',60,150],['textPosition',-10,10],['letterSpacing',0,40],['textWeight',.5,1.2],['centreSize',10,30]]){s[k]=Number(s[k]);if(!Number.isFinite(s[k])||s[k]<min||s[k]>max)throw Error(`Invalid ${k}: use ${min}–${max}.`);}
 if(!Number.isInteger(s.complexity)||!printers[s.printer]||!['mixed','open','lattice'].includes(s.pattern))throw Error('Invalid design settings.');
 if(!['random','text','prompt'].includes(s.mode))throw Error('Invalid design mode.');
 if(!['stroke','montecarlo','niconne','lato','breeserif','courgette','berkshireswash'].includes(s.font))throw Error('Invalid text font.');
 if(!['random','original','text',...centreChoices].includes(s.centre))throw Error('Invalid centre shape.');
 if(!['random-all','random','legacy','star','fern','crystal','rounded',...crystalFamilies].includes(s.silhouette))throw Error('Invalid outline shape.');
 s.centreText=String(s.centreText).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
 if(!['letters','bar',...framedTextStyles].includes(s.centreJoin))throw Error('Invalid centre letter connection.');
 if(s.centre==='text'&&['letters','bar'].includes(s.centreJoin)){s.centreJoin='open-random';s.centreSize=Math.max(26,s.centreSize);}
 if(s.centre==='text'&&s.centreJoin.startsWith('solid-'))s.centreAms='on';
 if(!['off','on'].includes(s.centreAms))throw Error('Invalid centre colour mode.');
 for(const key of ['mainColour','centreColour']){s[key]=String(s[key]).toUpperCase();if(!/^#[0-9A-F]{6}$/.test(s[key]))throw Error('Choose a valid filament colour.');}
 if(s.centreText.length>12||!centreTextFonts.includes(s.centreFont))throw Error('Use up to 12 characters for the centre text.');
 if(s.centre==='text'&&(!/[A-Za-z0-9]/.test(s.centreText)||!/^[A-Za-z0-9 \'-]+$/.test(s.centreText)))throw Error('Enter centre text using letters, numbers, spaces or hyphens.');
 if(!['random','stellar','fern','plate'].includes(s.naturalStyle))throw Error('Invalid natural crystal style.');
 if(!['original','refined'].includes(s.crystalQuality))throw Error('Invalid crystal recipe.');
 if(!['original','airy','natural'].includes(s.growth))throw Error('Invalid branch growth style.');
 if(!['all','alternating'].includes(s.armLayout))throw Error('Invalid arm arrangement.');
 if(!['mirrored','single','flowing'].includes(s.textLayout))throw Error('Invalid text layout.');
 s.text=(s.mode==='random'||s.mode==='text'&&s.font!=='stroke')?String(s.text).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' '):normalizeText(s.text);
 if(s.mode==='text'&&s.textLayout==='flowing'&&['montecarlo','niconne','courgette','berkshireswash'].includes(s.font)&&s.text===s.text.toUpperCase())s.text=s.text.replace(/[A-Z][A-Z']*/g,word=>word[0]+word.slice(1).toLowerCase());
 if(s.mode==='text'&&(s.text.length>12||!/^[A-Za-z0-9 '-]*$/.test(s.text)))throw Error('Use up to 12 letters A–Z, numbers, spaces or hyphens.');
 if(s.text.length>120)throw Error('Use a description of up to 120 characters.');
 if(s.mode!=='random'&&!/[A-Za-z0-9]/.test(s.text))throw Error('Enter some text for your snowflake.');
 s.seed=String(s.seed);if(!s.seed.length||s.seed.length>128)throw Error('Seed must contain 1–128 characters.');
 return s;
}
// A versioned seed fixes the random parameter slots; sliders never consume extra randomness.
function random(seed){let h=2166136261;for(const c of 'v1:'+seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return()=>{h+=0x6d2b79f5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const scale=10000;
const path=p=>p.map(([x,y])=>({X:Math.round(x*scale),Y:Math.round(y*scale)}));
function circle(x,y,r,n=96){return Array.from({length:n},(_,i)=>[x+r*Math.cos(i*2*Math.PI/n),y+r*Math.sin(i*2*Math.PI/n)]);}
export function design(input){
 const s=settings(input),rng=random(s.mode==='prompt'?`text:${s.text}|${s.seed}`:s.seed),slots=Array.from({length:100},rng),R=s.diameter/2,w=s.branch,shapes=[];
 const naturalCentres=['hex-frame','hexagon','ring','rosette','solid-star','star-frame','web','circle'];
 const centreChoice=s.growth==='natural'&&s.centre==='random'?naturalCentres[Math.min(7,Math.floor(slots[90]*8))]:s.centre;
 const centre=s.centre==='original'?null:s.centre==='text'?(framedTextStyles.includes(s.centreJoin)?framedTextPlan({text:s.centreText,font:s.centreFont,radius:R*s.centreSize/100,branch:w,style:s.centreJoin,slots}):textCentrePlan({text:s.centreText,font:s.centreFont,join:s.centreJoin,radius:R*s.centreSize/100,branch:w})):centrePlan({choice:centreChoice,radius:R*s.centreSize/100,branch:w,slots,matched:s.growth==='natural'||s.growth==='airy'&&s.silhouette!=='legacy'});
 const prompt=s.mode==='prompt',lush=prompt&&/FULL|DENSE|FERN|BROAD|LACE|LEAF/.test(s.text),fine=prompt&&/DELICATE|FINE|THIN|AIRY/.test(s.text);
 const script=s.mode==='text'&&s.font!=='stroke'?scriptLettering(s.text,R,w,s.font,s.textSize*(.96+slots[81]*.08),s.textPosition+(slots[82]-.5)*4,s.textLayout,s.letterSpacing,s.textWeight):null;
 const letters=s.mode==='text'&&!script?lettering(s.text,R,w):null;
 const add=p=>{const q=path(p);if(!ClipperLib.Clipper.Orientation(q))q.reverse();shapes.push(q);};
 const line=(a,b,width)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*width/2,ny=dx/l*width/2;add([[a[0]+nx,a[1]+ny],[a[0]-nx,a[1]-ny],[b[0]-nx,b[1]-ny],[b[0]+nx,b[1]+ny]]);};
 const airy=s.growth==='airy'||s.growth==='natural';
 const alternating=s.mode==='text'&&s.armLayout==='alternating';
 const flowing=script&&s.textLayout==='flowing';
 add(circle(0,0,flowing?Math.max(1,s.textWeight*1.5):w*2,24));
 for(let arm=0;arm<6;arm++){
 const angle=Math.PI/2+arm*Math.PI/3,point=(x,y)=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
 const textArm=!alternating||arm%2===1;
 const profile=resolveSilhouette(s.silhouette,slots),refinedBranch=s.growth==='airy'&&s.crystalQuality==='refined'&&crystalFamilies.includes(profile)&&!((script||letters)&&textArm);
 if(!refinedBranch)line(point(0,0),point(R,0),textArm?(flowing?s.textWeight:letters||script?Math.max(.8,w*.55):w):w);
 if(script&&textArm){
  for(const side of s.textLayout==='single'?[1]:[-1,1])for(const contour of script.paths){const q=path(contour.map(([x,y])=>point(x,y*side)));if(side<0)q.reverse();shapes.push(q);}
  continue;
 }
 if(letters&&textArm){
  for(const [a,b]of letters.segments)line(point(...a),point(...b),letters.width);
  // Joined strokes round corners without leaving gaps between letter segments.
  for(const [a,b]of letters.segments)for(const p of [a,b]){const [x,y]=point(...p);add(circle(x,y,letters.width/2,12));}
  const length=R*(.03+slots[80]*.02);
  for(const side of [-1,1])line(point(R*.93,0),point(R*.96,side*length),Math.max(.8,w*.55));
  continue;
 }
 if(s.growth==='natural'){naturalArm({R,w,complexity:s.complexity,fullness:s.fullness,centreSize:s.centreSize,seed:s.mode==='prompt'?s.text+'|'+s.seed:s.seed,naturalStyle:s.naturalStyle,point,line,add});continue;}
 if(airy){const args={R,w,complexity:s.complexity,fullness:s.fullness,slots,point,line,add,silhouette:s.silhouette,profile,hanger:arm===0};if(crystalFamilies.includes(profile))(s.crystalQuality==='original'?legacyCrystalArm:crystalArm)(args);else balancedArm(args);continue;}
 for(let j=0;j<Math.min(s.complexity,9);j++){
 const t=.16+j*.068+(slots[j]-.5)*.035,base=R*t,len=R*(.10+slots[10+j]*.14)*(1-t)*(lush?1.4:fine?.85:1),slope=.65+slots[20+j]*.6;
 for(const side of [-1,1]){
 const a=point(base,0),b=point(Math.min(R-w,base+len),side*len*slope);line(a,b,w*.75);
 if(s.pattern==='lattice'||s.pattern==='mixed'&&slots[30+j]>.48)line(b,point(Math.min(R-w,base+len*1.9),0),w*.65);
 if(j<3&&s.complexity>5){const c=point(base+len*.55,side*len*slope*.55);line(c,point(base+len*.45,side*(len*slope*.55+R*.045)),w*.65);}
 }
 }
 if(s.complexity>9)branchDetail({radius:R,width:w,level:s.complexity-9,slots,point,line});
 // Extra paired boughs fill the outer arms; the original seed slots are unchanged.
 // At zero this adds no geometry, preserving every existing v1 design link.
 const full=Math.max(s.fullness/100,lush?.8:0);
 if(full>0)for(let j=0;j<5;j++){
  const t=.40+j*.12,advance=R*(.06+slots[50+j]*.035)*full;
  const spread=R*(.25-j*.03)*full*(.85+slots[60+j]*.15);
  for(const side of [-1,1]){
   const tip=point(R*t+advance,side*spread);
   line(point(R*t,0),tip,w*.75);
   if(s.pattern==='lattice'||s.pattern==='mixed'&&slots[70+j]>.4)
    line(tip,point(Math.min(R*.99,R*t+advance*2),0),w*.65);
  }
 }
 }
 // The ring overlaps the top arm by 1 mm; its bore is cut after the union.
 const cy=R+3;add(circle(0,cy,4));
 const clip=new ClipperLib.Clipper();clip.AddPaths(shapes,ClipperLib.PolyType.ptSubject,true);let union=new ClipperLib.Paths();clip.Execute(ClipperLib.ClipType.ctUnion,union,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 if(centre)union=replaceCentre(union,centre);
 const framed=s.centre==='text'&&framedTextStyles.includes(s.centreJoin);
 if(framed){
  // Resolve sub-micron branch point contacts before making either mesh or AMS parts.
  const offset=(paths,delta)=>{const tool=new ClipperLib.ClipperOffset(2,.25),out=[];tool.AddPaths(paths,ClipperLib.JoinType.jtMiter,ClipperLib.EndType.etClosedPolygon);tool.Execute(out,delta);return out;};
  union=offset(offset(union,3),-3);
 }
 const cut=new ClipperLib.Clipper();cut.AddPaths(union,ClipperLib.PolyType.ptSubject,true);cut.AddPath(path(circle(0,cy,2)),ClipperLib.PolyType.ptClip,true);const tree=new ClipperLib.PolyTree();cut.Execute(ClipperLib.ClipType.ctDifference,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 if(tree.Childs().length!==1)throw Error('Design must be one connected ornament.');
 const outer=tree.Childs()[0],loops=[outer.Contour(),...outer.Childs().map(n=>n.Contour())].map(p=>framed?p:letters||script||s.complexity>9||centre||airy?ClipperLib.Clipper.CleanPolygon(p,2):p).filter(p=>p.length>=3&&Math.abs(ClipperLib.Clipper.Area(p))>1).map(p=>p.map(v=>[v.X/scale,v.Y/scale]));
 const flat=[],holes=[];for(let i=0;i<loops.length;i++){if(i)holes.push(flat.length/2);for(const p of loops[i])flat.push(...p);}
 // Integer coordinates prevent floating-point sliver triangles at collinear intersections.
 let top=earcut(s.fullness>0||letters||script||prompt||s.complexity>9||centre||airy?flat.map(v=>Math.round(v*scale)):flat,holes);
 if(letters||script||s.complexity>9||centre||airy)top=conformTriangles(flat,top);
 const n=flat.length/2,vertices=[],faces=[];
 for(const z of [0,s.thickness])for(let i=0;i<n;i++)vertices.push(flat[i*2],flat[i*2+1],z);
 for(let i=0;i<top.length;i+=3){const [a,b,c]=top.slice(i,i+3);faces.push(a,c,b,a+n,b+n,c+n);}
 let offset=0;for(const loop of loops){for(let j=0;j<loop.length;j++){const a=offset+j,b=offset+(j+1)%loop.length;faces.push(a,b,a+n,b,b+n,a+n);}offset+=loop.length;}
 const xs=flat.filter((_,i)=>i%2===0),ys=flat.filter((_,i)=>i%2===1),bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
 const width=bounds.maxX-bounds.minX,height=bounds.maxY-bounds.minY,limit=printers[s.printer].size-4,fits=width<=limit&&height<=limit,valid=fits&&(!letters||letters.printable)&&(!script||script.printable)&&centre?.printable!==false;
 const issue=!fits?'plate':(letters&&!letters.printable)||(script&&!script.printable)?'text':centre?.printable===false?'centreText':'';
 const raised=valid&&s.centre==='text'&&s.centreJoin.startsWith('raised-')?raisedTextMesh(loops,centre.letterPaths,s.thickness,[s.mainColour,s.centreColour]):null;
 const parts=raised?(s.centreAms==='on'?raised.parts:null):valid&&s.centre==='text'&&s.centreAms==='on'?centreMaterialParts(loops,centre.letterPaths,s.thickness,[s.mainColour,s.centreColour]):null;
 return {s,parts,loops,raisedText:raised?.raisedText,vertices:raised?.vertices||new Float64Array(vertices),faces:raised?.faces||new Uint32Array(faces),bounds,width,height,valid,limit,issue,centreKind:centre?.kind||'original'};
}
export function encode(s){return 'd='+encodeCompact(settings(s));}
export function decode(search){const q=new URLSearchParams(search);if(q.has('d')){if(q.getAll('d').length!==1)throw Error('Ambiguous design link.');return settings(decodeCompact(q.get('d')));}
 if(q.has('v')&&q.get('v')!=='1')throw Error('Unsupported design version.');return settings({...((q.has('v')||q.has('seed'))&&!q.has('silhouette')?{growth:'original',branch:2,fullness:0,silhouette:'legacy',crystalQuality:'original'}:{}),...Object.fromEntries(Object.entries(defaults).filter(([k])=>q.has(k)).map(([k])=>[k,q.get(k)])),...(q.has('v')&&!q.has('centre')?{centre:'original'}:{})});}
