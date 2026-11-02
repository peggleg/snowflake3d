// Minimal ZIP writer for generated 3MF files. Stored entries, UTF-8 names, no ZIP64.
// No archive import or decompression code is included in the application.
const table=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
export const strToU8=text=>new TextEncoder().encode(text);
export function zipSync(files){
 const entries=Object.entries(files).map(([name,data])=>({name:strToU8(name),data,crc:crc32(data)}));
 let size=22;for(const e of entries)size+=30+e.name.length+e.data.length+46+e.name.length;
 if(size>0xffffffff||entries.length>65535)throw Error('Archive is too large.');
 const out=new Uint8Array(size),d=new DataView(out.buffer);let offset=0;
 for(const e of entries){
  e.offset=offset;d.setUint32(offset,0x04034b50,true);d.setUint16(offset+4,20,true);d.setUint16(offset+6,0x0800,true);d.setUint16(offset+12,33,true);
  d.setUint32(offset+14,e.crc,true);d.setUint32(offset+18,e.data.length,true);d.setUint32(offset+22,e.data.length,true);d.setUint16(offset+26,e.name.length,true);
  out.set(e.name,offset+30);out.set(e.data,offset+30+e.name.length);offset+=30+e.name.length+e.data.length;
 }
 const central=offset;
 for(const e of entries){
  d.setUint32(offset,0x02014b50,true);d.setUint16(offset+4,20,true);d.setUint16(offset+6,20,true);d.setUint16(offset+8,0x0800,true);d.setUint16(offset+14,33,true);
  d.setUint32(offset+16,e.crc,true);d.setUint32(offset+20,e.data.length,true);d.setUint32(offset+24,e.data.length,true);d.setUint16(offset+28,e.name.length,true);d.setUint32(offset+42,e.offset,true);
  out.set(e.name,offset+46);offset+=46+e.name.length;
 }
 const centralSize=offset-central;d.setUint32(offset,0x06054b50,true);d.setUint16(offset+8,entries.length,true);d.setUint16(offset+10,entries.length,true);d.setUint32(offset+12,centralSize,true);d.setUint32(offset+16,central,true);
 return out;
}
