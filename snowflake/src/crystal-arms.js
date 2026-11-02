import ClipperLib from 'clipper-lib';
import {segmentDistance,distance} from './growth-spacing.js';
export {crystalFamilies} from './crystal-arms-v4.js';
// Every structure uses the same physical clearances and printable detail widths.
export function crystalArm({profile,R,w,complexity,fullness,slots,point,line}){
 const gap=Math.max(.9,R*.018),fine=Math.max(.8,w*.65),primary=Math.max(.9,w*.85),spread=.78+fullness*.0022,jitter=.94+slots[94]*.06;
 const segments=[{a:[0,0],b:[R,0],width:w,parent:-1}];
 const inside=(p,width)=>Math.hypot(...p)+width/2<R&&Math.abs(p[1])+width/2+gap<(p[0]-width/2)*Math.tan(Math.PI/6);
 const stroke=(a,b,width=w)=>line(point(...a),point(...b),width);
 const mirrorStroke=(a,b,width)=>{stroke(a,b,width);stroke([a[0],-a[1]],[b[0],-b[1]],width);};
 const fits=(a,b,width,parent)=>inside(b,width)&&segments.every((s,i)=>i===parent||(s.parent===parent&&distance(a,s.a)<.001)||segmentDistance(a,b,s.a,s.b)>=(width+s.width)/2+gap);
 const grow=(a,angle,length,width,parent=0)=>{
  const end=l=>[a[0]+Math.cos(angle)*l,a[1]+Math.sin(angle)*l];
  if(!fits(a,a,width,parent))return null;
  let lo=0,hi=length;if(fits(a,end(length),width,parent))lo=length;else for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(fits(a,end(mid),width,parent))lo=mid;else hi=mid;}
  if(lo<Math.max(width*2,1.8))return null;
  const b=end(lo),id=segments.length;segments.push({a,b,width,parent});mirrorStroke(a,b,width);return id;
 };
 const decorate=(id,rows=[.42,.73])=>{
  if(id===null||complexity<7)return;
  const s=segments[id],angle=Math.atan2(s.b[1]-s.a[1],s.b[0]-s.a[0]),length=distance(s.a,s.b),children=[];
  for(const t of complexity<12?[.64]:rows)for(const side of [-1,1]){
   const a=[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t],child=grow(a,angle+side*Math.PI/3,length*(.32+slots[95]*.1),fine,id);if(child!==null)children.push(child);
  }
  if(complexity>=16)for(const child of children){const s=segments[child],angle=Math.atan2(s.b[1]-s.a[1],s.b[0]-s.a[0]),a=[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2];grow(a,angle+Math.PI/3,distance(s.a,s.b)*.5,fine,child);}
 };
 // A frame must have a real opening; omit a vein if it would close that opening.
 const frame=(points,width=w,mirrored=false)=>{
  if(!points.every(p=>inside(p,width)))return null;
  const contour=points.map(([x,y])=>({X:Math.round(x*10000),Y:Math.round(y*10000)}));
  if(!ClipperLib.Clipper.Orientation(contour))contour.reverse();
  const offset=new ClipperLib.ClipperOffset(),open=[];offset.AddPath(contour,ClipperLib.JoinType.jtMiter,ClipperLib.EndType.etClosedPolygon);offset.Execute(open,-(width+gap)/2*10000);
  if(!open.length)return null;
  const ids=[];points.forEach((a,i)=>{const b=points[(i+1)%points.length],id=segments.length;segments.push({a,b,width,parent:-2});ids.push(id);if(mirrored)mirrorStroke(a,b,width);else stroke(a,b,width);});return ids;
 };
 const lance=(base,angle,length,halfWidth,width=primary)=>{
  if(halfWidth<width+gap)return null;
  const u=[Math.cos(angle),Math.sin(angle)],n=[-u[1],u[0]],pts=[[0,0],[length*.58,halfWidth],[length,0],[length*.58,-halfWidth]].map(([x,y])=>[base[0]+u[0]*x+n[0]*y,base[1]+u[1]*x+n[1]*y]);
  const ids=frame(pts,width,true);if(!ids)return null;
  if(complexity>=10&&halfWidth>width/2+fine/2+gap*1.6)mirrorStroke(base,pts[2],fine);
  if(complexity>=12)for(const id of [ids[0],ids[1]]){
   const s=segments[id],a=[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2],dir=Math.atan2(s.b[1]-s.a[1],s.b[0]-s.a[0]);grow(a,dir+Math.PI/3,length*.2,fine,id);
  }
  return ids;
 };
 if(profile==='simple'){
  const roots=complexity<6?[.36,.65]:[.29,.47,.65,.82];
  roots.forEach((t,i)=>{const length=Math.min(R*t*.9,R*(.40-.30*t))*spread*jitter;decorate(grow([R*t,0],Math.PI/3,length,primary));});
 }
 if(profile==='plates'){
  const half=R*(.09+slots[95]*.018)*spread;
  frame([[R*.24,0],[R*.39,half],[R*.87,half],[R*.975,0],[R*.87,-half],[R*.39,-half]],w);
  // Long side plates start on the outer wall, so the openings stay distinct.
  for(const t of complexity<7?[.51]:[.43,.68]){
   const base=[R*t,half],length=R*(t<.5?.29:.20)*spread;
   const ids=lance(base,Math.PI/3,length,Math.max(w+gap,R*.052),primary);
   if(!ids&&complexity>=7){const edge=segments.findIndex(s=>s.a[1]===half&&s.b[1]===half);if(edge>=0)decorate(grow(base,Math.PI/3,length,primary,edge));}
  }
  if(complexity>=10&&half>w/2+fine/2+gap*1.5){
   for(const t of complexity<15?[.56]:[.48,.70])for(const side of [-1,1])stroke([R*t,0],[R*t+half,side*half],fine);
  }
 }
 if(profile==='hex-tips'){
  const hex=(x,y,r,mirror=false)=>{
   if(r*Math.sqrt(3)-2*w<gap*2)return null;
   return frame(Array.from({length:6},(_,i)=>[x+r*Math.cos(i*Math.PI/3),y+r*Math.sin(i*Math.PI/3)]),w,mirror);
  };
  hex(R*.83,0,Math.min(R*.15,R*.17-w/2));
  const roots=complexity<7?[.43]:[.31,.53];
  roots.forEach((t,i)=>{
   const length=R*(.19+i*.10)*spread*jitter,r=Math.max((w+gap)/.866,R*(.065+i*.02)),x=R*t+length*.5,y=length*Math.sqrt(3)/2;
   const ids=hex(x,y,r,true);
   if(ids){const id=segments.length;segments.push({a:[R*t,0],b:[x,y],width:w,parent:0});mirrorStroke([R*t,0],[x,y],w);
    // Small subsidiary twigs ornament the stem, outside the terminal plate.
    if(complexity>=10){const a=[R*t+length*.18,length*.18*Math.sqrt(3)];grow(a,Math.PI*2/3,length*.30,fine,id);}
   }
  });
  if(complexity>=7)for(const t of [.36,.62])decorate(grow([R*t,0],Math.PI/3,R*.18*spread,primary));
 }
 if(profile==='leaves'){
  const count=Math.min(complexity<7?3:4,Math.max(2,Math.floor(R/(w*3+2))));
  for(let i=0;i<count;i++){
   const t=.31+i*.52/(count-1),length=R*(.35-.14*t)*spread*jitter;
   const ids=lance([R*t,0],Math.PI/3,length,Math.max(w+gap,length*.23),primary);
   if(!ids)decorate(grow([R*t,0],Math.PI/3,length,primary));
  }
 }
 if(profile==='needles'){
  const count=Math.min(4+Math.floor(complexity*.35),Math.max(3,Math.floor(R*.68/(primary+gap+1))));
  for(let i=0;i<count;i++){
   const t=.25+i*.66/(count-1),length=Math.min(R*(.38*(1-t)+.035),R*t*.85)*spread*jitter;
   decorate(grow([R*t,0],Math.PI/3,length,primary),[.38,.68]);
  }
 }
 return {gap,segments};
}
