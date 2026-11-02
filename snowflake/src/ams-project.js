import filamentKeys from './profiles/filament-keys.json' with {type:'json'};
const xml=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const identity='1 0 0 0 1 0 0 0 1 0 0 0';
function meshObject(part,id){
 const v=[],t=[];for(let i=0;i<part.vertices.length;i+=3)v.push(`<vertex x="${part.vertices[i]}" y="${part.vertices[i+1]}" z="${part.vertices[i+2]}"/>`);
 for(let i=0;i<part.faces.length;i+=3)t.push(`<triangle v1="${part.faces[i]}" v2="${part.faces[i+1]}" v3="${part.faces[i+2]}"/>`);
 return `<object id="${id}" type="model" pid="4" pindex="${id-1}"><mesh><vertices>${v.join('')}</vertices><triangles>${t.join('')}</triangles></mesh></object>`;
}
// Bambu's model_settings part IDs refer to the component mesh resource IDs.
// Source: BambuStudio bbs_3mf.cpp, _add_object_components_to_stream and
// _add_model_config_file_to_archive. One assembled object keeps both parts aligned.
export function amsProjectFiles(m,files,{size,cx,cy}){
 const transform=`1 0 0 0 1 0 0 0 1 ${size/2-cx} ${size/2-cy} 0`,parts=m.parts;
 files['3D/3dmodel.model']=`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021"><metadata name="Application">BambuStudio-01.10.00.00</metadata><metadata name="BambuStudio:3mfVersion">1</metadata><resources><basematerials id="4">${parts.map(p=>`<base name="${xml(p.name)}" displaycolor="${p.colour}"/>`).join('')}</basematerials>${parts.map((p,i)=>meshObject(p,i+1)).join('')}<object id="3" type="model"><components><component objectid="1" transform="${identity}"/><component objectid="2" transform="${identity}"/></components></object></resources><build><item objectid="3" transform="${transform}"/></build></model>`;
 const config=JSON.parse(files['Metadata/project_settings.config']);
 for(const key of filamentKeys){const value=config[key];if(Array.isArray(value)&&value.length===1)config[key]=[...value,...value];}
 const profile=config.filament_settings_id[0];
 Object.assign(config,{filament_colour:parts.map(p=>p.colour),filament_settings_id:[profile,profile],filament_type:['PLA','PLA'],filament_vendor:['Bambu Lab','Bambu Lab'],filament_diameter:['1.75','1.75'],filament_density:['1.24','1.24'],single_extruder_multi_material:'1',enable_prime_tower:'1',wipe_tower_x:[String(size-41)],wipe_tower_y:['5'],flush_volumes_matrix:['0','280','280','0'],flush_volumes_vector:['140','140','140','140']});
 files['Metadata/project_settings.config']=JSON.stringify(config,null,2);
 files['Metadata/model_settings.config']=`<?xml version="1.0" encoding="UTF-8"?><config><object id="3"><metadata key="name" value="Snowflake with AMS centre text"/><metadata key="extruder" value="1"/>${parts.map((p,i)=>`<part id="${i+1}" subtype="normal_part"><metadata key="name" value="${xml(p.name)}"/><metadata key="extruder" value="${p.extruder}"/><metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/></part>`).join('')}</object><plate><metadata key="plater_id" value="1"/><metadata key="plater_name" value="Snowflake"/><metadata key="locked" value="false"/><model_instance><metadata key="object_id" value="3"/><metadata key="instance_id" value="0"/><metadata key="identify_id" value="1"/></model_instance></plate><assemble><assemble_item object_id="3" instance_id="0" transform="${transform}" offset="0 0 0"/></assemble></config>`;
 return files;
}
