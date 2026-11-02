import ClipperLib from 'clipper-lib';
const SCALE=10000;
export const centreChoices=['solid-star','star-frame','hexagon','hex-frame','circle','ring','rosette','web'];
export const centreLabels={'solid-star':'Solid star','star-frame':'Open star',hexagon:'Solid hexagon','hex-frame':'Hexagon frame',circle:'Solid circle',ring:'Circular ring',rosette:'Petal rosette',web:'Hexagonal web',original:'Original centre'};
const polygon=(r,n=6,rotation=Math.PI/2)=>Array.from({length:n},(_,i)=>[Math.cos(rotation+i*Math.PI*2/n)*r,Math.sin(rotation+i*Math.PI*2/n)*r]);
const integer=p=>p.map(([x,y])=>({X:Math.round(x*SCALE),Y:Math.round(y*SCALE)}));
export function centrePlan({choice,radius,branch,slots,matched=false}){
 const kind=choice==='random'?centreChoices[Math.min(centreChoices.length-1,Math.floor(slots[90]*centreChoices.length))]:choice;
 const joinWidth=matched?branch:null;
 const rim=Math.max(.8,Math.min(branch*.65,radius*.24)),paths=[];
 const add=p=>{const c=integer(p);if(!ClipperLib.Clipper.Orientation(c))c.reverse();paths.push(c);return c;};
 const frame=p=>{const outer=add(p),offset=new ClipperLib.ClipperOffset();offset.AddPath(outer,ClipperLib.JoinType.jtMiter,ClipperLib.EndType.etClosedPolygon);const inside=[];offset.Execute(inside,-rim*SCALE);for(const c of inside){if(ClipperLib.Clipper.Orientation(c))c.reverse();paths.push(c);}};
 const bar=(a,b,width=rim)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),x=-dy/length*width/2,y=dx/length*width/2;add([[a[0]+x,a[1]+y],[a[0]-x,a[1]-y],[b[0]-x,b[1]-y],[b[0]+x,b[1]+y]]);};
 const star=Array.from({length:12},(_,i)=>{const a=Math.PI/2+i*Math.PI/6,r=i%2?radius*(.48+slots[91]*.12):radius;return[Math.cos(a)*r,Math.sin(a)*r];});
 if(kind==='solid-star')add(star);
 if(kind==='star-frame')frame(star);
 if(kind==='hexagon')add(polygon(radius));
 if(kind==='hex-frame')frame(polygon(radius));
 if(kind==='circle')add(polygon(radius,96));
 if(kind==='ring')frame(polygon(radius,96));
 if(kind==='rosette'){
  add(polygon(Math.max(rim*1.2,radius*.28),48));
  for(let i=0;i<6;i++){const a=Math.PI/2+i*Math.PI/3;frame(Array.from({length:64},(_,j)=>{const t=j*Math.PI*2/64,x=radius*(.48+.52*Math.cos(t)),y=radius*.24*Math.sin(t);return[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}));}
 }
 if(kind==='web'){
  frame(polygon(radius));frame(polygon(Math.max(radius*.48,rim*1.5)));
  for(let i=0;i<6;i++){const a=Math.PI/2+i*Math.PI/3;bar([Math.cos(a)*radius*.4,Math.sin(a)*radius*.4],[Math.cos(a)*radius,Math.sin(a)*radius]);}
 }
 // Join the six arm axes without running spokes across the open centre.
 for(let i=0;i<6;i++){const a=Math.PI/2+i*Math.PI/3,unit=[Math.cos(a),Math.sin(a)],start=radius-rim*.3,width=joinWidth??rim;bar(unit.map(x=>x*start),unit.map(x=>x*(radius+Math.max(rim,width))),width);add(polygon(width/2,16).map(([x,y])=>[x+unit[0]*start,y+unit[1]*start]));}
 return {kind,radius,rim,joinWidth:joinWidth??rim,paths};
}
function execute(subject,clips,type){const c=new ClipperLib.Clipper();c.AddPaths(subject,ClipperLib.PolyType.ptSubject,true);if(clips.length)c.AddPaths(clips,ClipperLib.PolyType.ptClip,true);const tree=new ClipperLib.PolyTree();c.Execute(type,tree,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero);return tree;}
const flatten=tree=>ClipperLib.Clipper.PolyTreeToPaths(tree);
export function replaceCentre(subject,plan){
 const outside=execute(subject,[integer(polygon(plan.radius,192))],ClipperLib.ClipType.ctDifference);
 let tree=execute([...flatten(outside),...plan.paths],[],ClipperLib.ClipType.ctUnion);
 // Clipping an inner branch can leave a short outer fragment. Attach it to the
 // closest material boundary using a printable bridge, rather than dropping it.
 if(tree.Childs().length>1){
  const roots=tree.Childs().slice().sort((a,b)=>Math.abs(ClipperLib.Clipper.Area(b.Contour()))-Math.abs(ClipperLib.Clipper.Area(a.Contour()))),main=roots[0],boundaries=[main.Contour(),...main.Childs().map(c=>c.Contour())];
  const candidates=boundaries.flatMap(c=>c.filter((_,i)=>i%Math.max(1,Math.floor(c.length/600))===0)),joins=[];
  for(const node of roots.slice(1)){
   let best=Infinity,pair;
   for(const p of node.Contour())for(const q of candidates){const d=(p.X-q.X)**2+(p.Y-q.Y)**2;if(d<best){best=d;pair=[p,q];}}
   if(!pair)continue;const [a,b]=pair,dx=b.X-a.X,dy=b.Y-a.Y,length=Math.hypot(dx,dy),half=plan.joinWidth*SCALE/2;
   if(length<1){joins.push(integer(polygon(plan.joinWidth/2,24).map(([x,y])=>[x+a.X/SCALE,y+a.Y/SCALE])));continue;}const nx=-dy/length*half,ny=dx/length*half,ux=dx/length*half,uy=dy/length*half;
   let c=[{X:a.X+nx-ux,Y:a.Y+ny-uy},{X:a.X-nx-ux,Y:a.Y-ny-uy},{X:b.X-nx+ux,Y:b.Y-ny+uy},{X:b.X+nx+ux,Y:b.Y+ny+uy}].map(p=>({X:Math.round(p.X),Y:Math.round(p.Y)}));if(!ClipperLib.Clipper.Orientation(c))c.reverse();joins.push(c);
  }
  tree=execute([...flatten(tree),...joins],[],ClipperLib.ClipType.ctUnion);
 }
 return flatten(tree);
}
