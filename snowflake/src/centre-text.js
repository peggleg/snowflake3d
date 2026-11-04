import {wordConnectors} from './word-connectors.js';
import ClipperLib from 'clipper-lib';
import {scriptFonts} from './script-lettering.js';
export const centreTextFonts=['lato','breeserif','courgette','berkshireswash','niconne','montecarlo'];
const SCALE=10000;
const path=points=>points.map(([x,y])=>({X:Math.round(x*SCALE),Y:Math.round(y*SCALE)}));
export function textCentrePlan({text,font,radius,branch,join='bar'}){
 const data=scriptFonts[font],letters=[],glyphLinks=[],tracking=join==='bar'?.08:['courgette','niconne','montecarlo'].includes(font)?-.035:0;let pen=0;
 for(let i=0;i<text.length;i++){
  if(i)pen+=(data.kern[text[i-1]+text[i]]||0)+tracking;
  const glyph=data.glyphs[text[i]];
  if(!glyph)throw Error('Centre font does not contain one of these characters.');
  letters.push(glyph.contours.map(c=>c.map(([x,y])=>[x+pen,y])));glyphLinks.push(...glyph.bridges.map(pair=>pair.map(([x,y])=>[x+pen,y])));pen+=glyph.advance;
 }
 const points=letters.flat(2),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const padding=Math.max(.2,Math.min(.28,branch*.1)),width=Math.max(.8,branch*.65);
 const factor=Math.min((radius*1.62-padding*2)/(maxX-minX),(radius*.98-padding*2)/(maxY-minY)),midX=(maxX+minX)/2,midY=(maxY+minY)/2;
 const lift=join==='bar'?width*.25:0;
 const transformed=letters.map(contours=>contours.map(c=>c.map(([x,y])=>[(x-midX)*factor,(y-midY)*factor+lift]))),paths=[];
 const positive=p=>{const c=path(p);if(!ClipperLib.Clipper.Orientation(c))c.reverse();paths.push(c);};
 const bar=(a,b,w)=>{const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<1e-7)return;const x=-dy/len*w/2,y=dx/len*w/2;positive([[a[0]+x,a[1]+y],[a[0]-x,a[1]-y],[b[0]-x,b[1]-y],[b[0]+x,b[1]+y]]);};
 const disk=(p,r)=>positive(Array.from({length:24},(_,i)=>[p[0]+Math.cos(i*Math.PI/12)*r,p[1]+Math.sin(i*Math.PI/12)*r]));
 const offset=new ClipperLib.ClipperOffset(2,.01*SCALE);offset.AddPaths(transformed.flat().map(path),ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);offset.Execute(paths,padding*SCALE);
 let letterPaths=paths.map(c=>c.map(p=>({...p})));
 for(const [a,b]of glyphLinks)bar([(a[0]-midX)*factor,(a[1]-midY)*factor+lift],[(b[0]-midX)*factor,(b[1]-midY)*factor+lift],width);
 let glyphTree=null;
 if(join==='letters'){
  const glyphClip=new ClipperLib.Clipper();glyphClip.AddPaths(paths,ClipperLib.PolyType.ptSubject,true);glyphTree=new ClipperLib.PolyTree();glyphClip.Execute(ClipperLib.ClipType.ctUnion,glyphTree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
  const groups=transformed.map(contours=>{if(!contours.length)return[];const offset=new ClipperLib.ClipperOffset(2,.01*SCALE),out=[];offset.AddPaths(contours.map(path),ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);offset.Execute(out,padding*SCALE);return out;});
  const linkWidth=Math.max(.8,Math.min(1.2,branch*.65));
  for(const curve of wordConnectors(groups,linkWidth)){disk(curve[0],linkWidth/2);for(let i=1;i<curve.length;i++){bar(curve[i-1],curve[i],linkWidth);disk(curve[i],linkWidth/2);}}
  const wordClip=new ClipperLib.Clipper();wordClip.AddPaths(paths,ClipperLib.PolyType.ptSubject,true);const wordTree=new ClipperLib.PolyTree();wordClip.Execute(ClipperLib.ClipType.ctUnion,wordTree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);letterPaths=ClipperLib.Clipper.PolyTreeToPaths(wordTree);
 }else{
 const all=transformed.flat(2),bottom=Math.min(...all.map(p=>p[1]))-width/2+padding*.5,left=Math.min(...all.map(p=>p[0])),right=Math.max(...all.map(p=>p[0]));
 bar([left,bottom],[right,bottom],width);disk([left,bottom],width/2);disk([right,bottom],width/2);
 for(const contours of transformed){const p=contours.flat().sort((a,b)=>a[1]-b[1])[0];if(p)bar(p,[p[0],bottom],width);}
 }
 const clip=new ClipperLib.Clipper();clip.AddPaths(paths,ClipperLib.PolyType.ptSubject,true);const tree=new ClipperLib.PolyTree();clip.Execute(ClipperLib.ClipType.ctUnion,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 const boundaries=(glyphTree||tree).Childs().flatMap(node=>{const c=node.Contour();return c.map((p,i)=>[[p.X/SCALE,p.Y/SCALE],[c[(i+1)%c.length].X/SCALE,c[(i+1)%c.length].Y/SCALE]]);});
 const closest=p=>{let best=Infinity,result;for(const [a,b]of boundaries){const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0,q=[a[0]+t*dx,a[1]+t*dy],d=(p[0]-q[0])**2+(p[1]-q[1])**2;if(d<best){best=d;result=q;}}return result;};
 for(let i=0;i<6;i++){const a=Math.PI/2+i*Math.PI/3,p=[Math.cos(a)*(radius+branch),Math.sin(a)*(radius+branch)],q=closest(p);if(q){bar(p,q,branch);disk(q,branch/2);}}
 return {kind:'text',radius,rim:width,joinWidth:branch,paths,letterPaths,printable:(maxY-minY)*factor>=4,letterHeight:(maxY-minY)*factor};
}
