// Distinct crystal structures. All strokes are planar printable material;
// framed plates and leaves keep their openings instead of filling their faces.
export const crystalFamilies=['simple','plates','hex-tips','leaves','needles'];
export function crystalArm({profile,R,w,complexity,fullness,slots,point,line}){
 const stroke=(a,b,width=w)=>line(point(...a),point(...b),width);
 const frame=(points,width=w)=>points.forEach((p,i)=>stroke(p,points[(i+1)%points.length],width));
 const detailWidth=Math.max(.8,w*.7),spread=.78+fullness*.0022,jitter=.9+slots[94]*.1;
 // Keep every motif within the arm's 60-degree sector and the body circle.
 const fits=(points,width)=>points.every(([x,y])=>Math.hypot(x,y)+width/2<R&&Math.abs(y)+width/2+Math.max(.9,R*.018)<(x-width/2)*Math.tan(Math.PI/6));
 const lance=(base,angle,length,halfWidth,width=w)=>{
  const u=[Math.cos(angle),Math.sin(angle)],n=[-u[1],u[0]];
  const pts=[[0,0],[length*.65,halfWidth],[length,0],[length*.65,-halfWidth]].map(([x,y])=>[base[0]+u[0]*x+n[0]*y,base[1]+u[1]*x+n[1]*y]);
  if(!fits(pts,width))return false;
  frame(pts,width);if(complexity>=9)stroke(base,pts[2],detailWidth);return true;
 };
 if(profile==='simple'){
  const roots=complexity<7?[.43,.72]:[.32,.52,.73];
  roots.forEach((t,i)=>{const length=R*(.25-i*.045)*spread*jitter;for(const side of [-1,1])stroke([R*t,0],[R*t+length*.5,side*length*Math.sqrt(3)/2],w);});
 }
 if(profile==='plates'){
  // A broad, open spear on the axis with two pairs of short plate boughs.
  const half=R*(.075+slots[95]*.025)*spread;
  frame([[R*.23,0],[R*.38,half],[R*.89,half],[R*.975,0],[R*.89,-half],[R*.38,-half]],w);
  for(const t of complexity<7?[.48]:[.4,.64])for(const side of [-1,1]){
   lance([R*t,0],side*Math.PI/3,R*(t<.5?.33:.25)*spread,R*.04,w);
  }
 }
 if(profile==='hex-tips'){
  const hex=(x,y,r)=>{const pts=Array.from({length:6},(_,i)=>[x+r*Math.cos(i*Math.PI/3),y+r*Math.sin(i*Math.PI/3)]);if(!fits(pts,w))return false;frame(pts,w);return true;};
  hex(R*.83,0,Math.min(R*.15,R*.17-w/2));
  const rows=complexity<7?[.48]:[.33,.58];
  rows.forEach((t,i)=>{for(const side of [-1,1]){
   const length=R*(.12+i*.11)*spread*jitter,x=R*t+length*.5,y=side*length*Math.sqrt(3)/2,r=R*(.045+i*.04)*spread;
   if(hex(x,y,r))stroke([R*t,0],[x,y],w);
  }});
 }
 if(profile==='leaves'){
  const count=Math.min(complexity<7?3:5,Math.max(2,Math.floor(R/(w*2.6+1.5))));
  for(let i=0;i<count;i++){
   const t=.32+i*.52/(count-1),length=R*(.25-.09*t)*spread*jitter;
   for(const side of [-1,1])lance([R*t,0],side*Math.PI/3,length,Math.max(w*.8,length*.2),detailWidth);
  }
 }
 if(profile==='needles'){
  const count=Math.min(4+Math.floor(complexity*.65),Math.max(3,Math.floor(R*.68/(w+1.25))));
  for(let i=0;i<count;i++){
   const t=.25+i*.67/(count-1),length=Math.min(R*(.29*(1-t)+.025)*spread*jitter,R*t*.47);
   for(const side of [-1,1]){
    const a=[R*t,0],b=[R*t+length*.38,side*length*.925];
    if(fits([b],detailWidth))stroke(a,b,detailWidth);
   }
  }
 }
}
