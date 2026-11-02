// Earcut may bridge aligned holes with edges that skip collinear boundary vertices.
// Split those triangle edges so the top/bottom and extrusion walls share exact edges.
export function conformTriangles(flat,triangles){
 const count=flat.length/2,coords=flat.map(v=>Math.round(v*10000)),edges=new Map();
 const key=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
 for(let j=0;j<triangles.length;j+=3)for(let i=0;i<3;i++){
  const a=triangles[j+i],b=triangles[j+(i+1)%3],k=key(a,b);const e=edges.get(k)||{a,b,count:0};e.count++;edges.set(k,e);
 }
 const splits=new Map();
 for(const [k,{a,b,count:uses}]of edges){
  if(uses!==1)continue;
  const ax=coords[a*2],ay=coords[a*2+1],dx=coords[b*2]-ax,dy=coords[b*2+1]-ay,l2=dx*dx+dy*dy,points=[];
  for(let i=0;i<count;i++){
   if(i===a||i===b)continue;
   const px=coords[i*2]-ax,py=coords[i*2+1]-ay;
   if(px*dy-py*dx!==0)continue;
   const t=px*dx+py*dy;if(t>0&&t<l2)points.push({i,t});
  }
  if(points.length){points.sort((p,q)=>p.t-q.t);splits.set(k,{a,ids:points.filter((p,i)=>i===0||p.t!==points[i-1].t).map(p=>p.i)});}
 }
 const out=[];
 for(let j=0;j<triangles.length;j+=3){
  const tri=triangles.slice(j,j+3),boundary=[];let changed=false;
  for(let i=0;i<3;i++){
   const a=tri[i],b=tri[(i+1)%3];boundary.push(a);const split=splits.get(key(a,b));
   if(split){changed=true;boundary.push(...(split.a===a?split.ids:split.ids.slice().reverse()));}
  }
  if(!changed){out.push(...tri);continue;}
  const center=flat.length/2;flat.push(tri.reduce((sum,i)=>sum+flat[i*2],0)/3,tri.reduce((sum,i)=>sum+flat[i*2+1],0)/3);
  for(let i=0;i<boundary.length;i++)out.push(center,boundary[i],boundary[(i+1)%boundary.length]);
 }
 return out;
}
