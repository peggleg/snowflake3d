import ClipperLib from 'clipper-lib';
import earcut from 'earcut';
export const defaults={seed:'winter-2026',diameter:100,thickness:3,complexity:5,branch:2,pattern:'mixed',printer:'mini'};
export const printers={mini:{name:'Bambu Lab A1 mini',size:180},a1:{name:'Bambu Lab A1',size:256}};
export function settings(input={}){
 const s={...defaults,...input};
 for(const [k,min,max] of [['diameter',40,245],['thickness',1,8],['complexity',1,9],['branch',1.2,4]]){s[k]=Number(s[k]);if(!Number.isFinite(s[k])||s[k]<min||s[k]>max)throw Error(`Invalid ${k}: use ${min}–${max}.`);}
 if(!Number.isInteger(s.complexity)||!printers[s.printer]||!['mixed','open','lattice'].includes(s.pattern))throw Error('Invalid design settings.');
 s.seed=String(s.seed);if(!s.seed.length||s.seed.length>128)throw Error('Seed must contain 1–128 characters.');
 return s;
}
// A versioned seed fixes the random parameter slots; sliders never consume extra randomness.
function random(seed){let h=2166136261;for(const c of 'v1:'+seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return()=>{h+=0x6d2b79f5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const scale=10000;
const path=p=>p.map(([x,y])=>({X:Math.round(x*scale),Y:Math.round(y*scale)}));
function circle(x,y,r,n=96){return Array.from({length:n},(_,i)=>[x+r*Math.cos(i*2*Math.PI/n),y+r*Math.sin(i*2*Math.PI/n)]);}
export function design(input){
 const s=settings(input),rng=random(s.seed),slots=Array.from({length:100},rng),R=s.diameter/2,w=s.branch,shapes=[];
 const add=p=>{const q=path(p);if(!ClipperLib.Clipper.Orientation(q))q.reverse();shapes.push(q);};
 const line=(a,b,width)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*width/2,ny=dx/l*width/2;add([[a[0]+nx,a[1]+ny],[a[0]-nx,a[1]-ny],[b[0]-nx,b[1]-ny],[b[0]+nx,b[1]+ny]]);};
 add(circle(0,0,w*2,24));
 for(let arm=0;arm<6;arm++){
 const angle=Math.PI/2+arm*Math.PI/3,point=(x,y)=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
 line(point(0,0),point(R,0),w);
 for(let j=0;j<s.complexity;j++){
 const t=.16+j*.068+(slots[j]-.5)*.035,base=R*t,len=R*(.10+slots[10+j]*.14)*(1-t),slope=.65+slots[20+j]*.6;
 for(const side of [-1,1]){
 const a=point(base,0),b=point(Math.min(R-w,base+len),side*len*slope);line(a,b,w*.75);
 if(s.pattern==='lattice'||s.pattern==='mixed'&&slots[30+j]>.48)line(b,point(Math.min(R-w,base+len*1.9),0),w*.65);
 if(j<3&&s.complexity>5){const c=point(base+len*.55,side*len*slope*.55);line(c,point(base+len*.45,side*(len*slope*.55+R*.045)),w*.65);}
 }
 }
 }
 // The ring overlaps the top arm by 1 mm; its bore is cut after the union.
 const cy=R+3;add(circle(0,cy,4));
 const clip=new ClipperLib.Clipper();clip.AddPaths(shapes,ClipperLib.PolyType.ptSubject,true);let union=new ClipperLib.Paths();clip.Execute(ClipperLib.ClipType.ctUnion,union,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 const cut=new ClipperLib.Clipper();cut.AddPaths(union,ClipperLib.PolyType.ptSubject,true);cut.AddPath(path(circle(0,cy,2)),ClipperLib.PolyType.ptClip,true);const tree=new ClipperLib.PolyTree();cut.Execute(ClipperLib.ClipType.ctDifference,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 if(tree.Childs().length!==1)throw Error('Design must be one connected ornament.');
 const outer=tree.Childs()[0],loops=[outer.Contour(),...outer.Childs().map(n=>n.Contour())].map(p=>p.map(v=>[v.X/scale,v.Y/scale]));
 const flat=[],holes=[];for(let i=0;i<loops.length;i++){if(i)holes.push(flat.length/2);for(const p of loops[i])flat.push(...p);}
 const top=earcut(flat,holes),n=flat.length/2,vertices=[],faces=[];
 for(const z of [0,s.thickness])for(let i=0;i<n;i++)vertices.push(flat[i*2],flat[i*2+1],z);
 for(let i=0;i<top.length;i+=3){const [a,b,c]=top.slice(i,i+3);faces.push(a,c,b,a+n,b+n,c+n);}
 let offset=0;for(const loop of loops){for(let j=0;j<loop.length;j++){const a=offset+j,b=offset+(j+1)%loop.length;faces.push(a,b,a+n,b,b+n,a+n);}offset+=loop.length;}
 const xs=flat.filter((_,i)=>i%2===0),ys=flat.filter((_,i)=>i%2===1),bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
 const width=bounds.maxX-bounds.minX,height=bounds.maxY-bounds.minY,limit=printers[s.printer].size-4,valid=width<=limit&&height<=limit;
 return {s,loops,vertices:new Float64Array(vertices),faces:new Uint32Array(faces),bounds,width,height,valid,limit};
}
export function encode(s){return new URLSearchParams({v:'1',...s}).toString();}
export function decode(search){const q=new URLSearchParams(search);if(q.has('v')&&q.get('v')!=='1')throw Error('Unsupported design version.');return settings(Object.fromEntries(Object.entries(defaults).filter(([k])=>q.has(k)).map(([k])=>[k,q.get(k)])));}
