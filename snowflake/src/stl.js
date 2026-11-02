export function stlBytes({vertices:v,faces:f}) {
  const out=new Uint8Array(84+f.length/3*50), d=new DataView(out.buffer);
  out.set(new TextEncoder().encode('Snowflake ornament; dimensions in mm'));
  d.setUint32(80,f.length/3,true);
  for(let i=0;i<f.length;i+=3) {
    const a=f[i]*3,b=f[i+1]*3,c=f[i+2]*3,o=84+i/3*50;
    const ux=v[b]-v[a],uy=v[b+1]-v[a+1],uz=v[b+2]-v[a+2],vx=v[c]-v[a],vy=v[c+1]-v[a+1],vz=v[c+2]-v[a+2];
    const n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx], l=Math.hypot(...n)||1;
    for(let k=0;k<3;k++) d.setFloat32(o+k*4,n[k]/l,true);
    [a,b,c].forEach((p,j)=>{for(let k=0;k<3;k++)d.setFloat32(o+12+j*12+k*4,v[p+k],true);});
  }
  return out;
}
