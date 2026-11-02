import ClipperLib from 'clipper-lib';
import montecarlo from './fonts/montecarlo.json' with {type:'json'};
import niconne from './fonts/niconne.json' with {type:'json'};
import lato from './fonts/lato.json' with {type:'json'};
import breeserif from './fonts/breeserif.json' with {type:'json'};
export const scriptFonts={montecarlo,niconne,lato,breeserif};
const SCALE=10000;
export function scriptLettering(text,radius,branch,font,size=100,position=0,layout='mirrored',spacing=0){
 const clean=font==='lato'||font==='breeserif',single=layout==='single';
 const data=scriptFonts[font],contours=[],bridges=[],attachments=[];let pen=0;
 for(let i=0;i<text.length;i++){
  if(i)pen+=(data.kern[text[i-1]+text[i]]||0)+(clean?.1:0)+spacing/100;
  const glyph=data.glyphs[text[i]];
  if(!glyph)throw Error('This font does not contain one of the entered characters.');
  for(const c of glyph.contours)contours.push(c.map(([x,y])=>[x+pen,y]));
  for(const pair of glyph.bridges)bridges.push(pair.map(([x,y])=>[x+pen,y]));
  const all=glyph.contours.flat();if(all.length){const p=all.reduce((a,p)=>Math.abs(p[1])<Math.abs(a[1])?p:a);attachments.push([[p[0]+pen,p[1]],[p[0]+pen,0]]);}
  pen+=glyph.advance;
 }
 const points=contours.flat(),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
 const factor=radius*(single?.64:.78)/(maxX-minX),start=radius*((single?.28:.14)+position/100);
 const maxY=Math.max(...points.map(p=>Math.abs(p[1])));
 const height=single?Math.min(size/100,Math.max(.01,start)*.48/(maxY*factor)):size/100;
 let raw=contours.map(c=>c.map(([x,y])=>[start+(x-minX)*factor,y*factor*height]));
 let links=[...bridges,...attachments].map(pair=>pair.map(([x,y])=>[start+(x-minX)*factor,y*factor*height]));
 const maxRadius=Math.max(...raw.flat().map(([x,y])=>Math.hypot(x,y))),shrink=Math.min(1,(radius-.9)/maxRadius);
 raw=raw.map(c=>c.map(([x,y])=>({X:Math.round(x*shrink*SCALE),Y:Math.round(y*shrink*SCALE)})));
 links=links.map(pair=>pair.map(([x,y])=>[x*shrink,y*shrink]));
 const padding=clean?Math.max(.2,.4-.035*factor*shrink)+(branch-1.2)*.07:.4+(branch-1.2)*.12;
 const bridgeHalf=clean?Math.max(.001,.4-padding):.001;
 // Each component joins to its glyph, and every glyph reaches the arm baseline.
 for(const [a,b]of links){const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<1e-6)continue;const nx=-dy/length*bridgeHalf,ny=dx/length*bridgeHalf;let c=[[a[0]+nx,a[1]+ny],[a[0]-nx,a[1]-ny],[b[0]-nx,b[1]-ny],[b[0]+nx,b[1]+ny]].map(([x,y])=>({X:Math.round(x*SCALE),Y:Math.round(y*SCALE)}));if(!ClipperLib.Clipper.Orientation(c))c.reverse();raw.push(c);}
 const clip=new ClipperLib.Clipper();clip.AddPaths(raw,ClipperLib.PolyType.ptSubject,true);const union=[];clip.Execute(ClipperLib.ClipType.ctUnion,union,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);
 // Expand actual outlines to provide at least an approximately 0.8 mm stroke.
 const offset=new ClipperLib.ClipperOffset(2,.015*SCALE);offset.AddPaths(union,ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);const thick=[];
 offset.Execute(thick,padding*SCALE);
 const paths=ClipperLib.Clipper.CleanPolygons(thick,.025*SCALE).filter(c=>c.length>=3).map(c=>c.map(p=>[p.X/SCALE,p.Y/SCALE]));
 // Offset operations can separate a fine flourish. Every filled component gets
 // a short baseline join if it doesn't already cross the arm's central spine.
 const join=clean?Math.max(.8,padding*2):padding*2;
 for(const contour of paths.slice()){
  const signed=contour.reduce((a,p,i)=>{const q=contour[(i+1)%contour.length];return a+p[0]*q[1]-q[0]*p[1];},0);
  if(signed<=0)continue;
  if(Math.min(...contour.map(p=>p[1]))<=0&&Math.max(...contour.map(p=>p[1]))>=0)continue;
  const p=contour.reduce((a,p)=>Math.abs(p[1])<Math.abs(a[1])?p:a);
  const y0=Math.min(0,p[1])-join/2,y1=Math.max(0,p[1])+join/2;
  paths.push([[p[0]-join/2,y0],[p[0]+join/2,y0],[p[0]+join/2,y1],[p[0]-join/2,y1]]);
 }
 return {paths,printable:factor*shrink*(single?Math.min(1,height):1)>=6};
}
