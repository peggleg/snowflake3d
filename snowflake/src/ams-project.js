// Geometry and named material parts only: printer/process/filament settings belong to the slicer.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const identity='1 0 0 0 1 0 0 0 1 0 0 0';
function mesh(part,id){
 const vertices=[],triangles=[];
 for(let i=0;i<part.vertices.length;i+=3)vertices.push(`<vertex x="${part.vertices[i]}" y="${part.vertices[i+1]}" z="${part.vertices[i+2]}"/>`);
 for(let i=0;i<part.faces.length;i+=3)triangles.push(`<triangle v1="${part.faces[i]}" v2="${part.faces[i+1]}" v3="${part.faces[i+2]}"/>`);
 return `<object id="${id}" type="model" pid="10" pindex="${id-1}"><mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh></object>`;
}
export function geometryProjectFiles(m,{size,name='Snowflake'}){
 const parts=m.parts||[{...m,name:'Snowflake',colour:m.s.mainColour,extruder:1}];
 const cx=(m.bounds.minX+m.bounds.maxX)/2,cy=(m.bounds.minY+m.bounds.maxY)/2;
 const transform=`1 0 0 0 1 0 0 0 1 ${size/2-cx} ${size/2-cy} 0`;
 const model=`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021"><metadata name="Application">Snowflake3D</metadata><metadata name="BambuStudio:3mfVersion">1</metadata><resources><basematerials id="10">${parts.map(p=>`<base name="${esc(p.name)}" displaycolor="${p.colour}"/>`).join('')}</basematerials>${parts.map((p,i)=>mesh(p,i+1)).join('')}<object id="3" type="model"><components>${parts.map((_,i)=>`<component objectid="${i+1}" transform="${identity}"/>`).join('')}</components></object></resources><build><item objectid="3" transform="${transform}"/></build></model>`;
 const metadata=`<?xml version="1.0" encoding="UTF-8"?><config><object id="3"><metadata key="name" value="${esc(name)}"/><metadata key="extruder" value="1"/>${parts.map((p,i)=>`<part id="${i+1}" subtype="normal_part"><metadata key="name" value="${esc(p.name)}"/><metadata key="extruder" value="${p.extruder}"/><metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/></part>`).join('')}</object><plate><metadata key="plater_id" value="1"/><model_instance><metadata key="object_id" value="3"/><metadata key="instance_id" value="0"/><metadata key="identify_id" value="1"/></model_instance></plate><assemble><assemble_item object_id="3" instance_id="0" transform="${transform}" offset="0 0 0"/></assemble></config>`;
 return {
 '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="application/xml"/><Default Extension="json" ContentType="application/json"/></Types>',
 '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>',
 '3D/3dmodel.model':model,'Metadata/model_settings.config':metadata,
 };
}
