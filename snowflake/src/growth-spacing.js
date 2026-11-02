export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
function pointDistance(p,a,b){const v=sub(b,a),l=dot(v,v);if(!l)return distance(p,a);const t=Math.max(0,Math.min(1,dot(sub(p,a),v)/l));return distance(p,[a[0]+v[0]*t,a[1]+v[1]*t]);}
export function segmentDistance(a,b,c,d){const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return 0;return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));}
