import{test}from'node:test';import assert from'node:assert/strict';
import{joinedFrame}from'../snowflake/src/joined-frame.js';
import{design}from'../snowflake/src/design.js';
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
test('closed hexagon strokes have six clean corners and a uniform mitered wall',()=>{
 const r=7.5,w=1.2,points=Array.from({length:6},(_,i)=>[r*Math.cos(i*Math.PI/3),r*Math.sin(i*Math.PI/3)]),frame=joinedFrame(points,w);
 assert.equal(frame.contours.length,2);for(const loop of frame.contours)assert.equal(loop.length,6,'no extra notch or butt-end vertices');
 const loops=frame.contours.slice().sort((a,b)=>area(b)-area(a));
 for(const p of loops[0])assert.ok(Math.abs(Math.hypot(...p)-(r+w/Math.sqrt(3)))<.0002);
 for(const p of loops[1])assert.ok(Math.abs(Math.hypot(...p)-(r-w/Math.sqrt(3)))<.0002);
 assert.ok(Math.abs(frame.triangles.reduce((s,t)=>s+area(t),0)-6*r*w)<.005,'constant-width closed ring');
});
test('terminal spines stop inside the hexagonal tip while the hanging ring stays connected',()=>{
 const m=design({seed:'smooth-hex',growth:'airy',silhouette:'hex-tips',branch:1.2,complexity:12,fullness:100,centre:'hex-frame'});
 assert.ok(Math.abs(m.bounds.minY-(-49-1.2/Math.sqrt(3)))<.001,'no protruding spine at the bottom tip');assert.equal(m.bounds.maxY,57);
 const thick=design({growth:'airy',silhouette:'hex-tips',diameter:40,branch:4});assert.equal(thick.bounds.maxY,27,'ring remains joined when tip frame cannot fit');
});
