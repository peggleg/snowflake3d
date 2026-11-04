export const CONSENT_KEY='sf3d_privacy_v1';
export const CONSENT_DAYS=180;
export const CONSENT_MS=CONSENT_DAYS*86400000;
export function readConsent(raw,now=Date.now()){try{const d=JSON.parse(raw);return d?.version===1&&['granted','denied'].includes(d.choice)&&Number.isFinite(d.expires)&&d.expires>now?d.choice:null;}catch{return null;}}
// No open-ended event properties: discard text, URLs, seeds and filenames.
export function safeEvent(name,input={}){
 if(!['page_view','generate','download_stl','download_3mf','download_zip','copy_design_link'].includes(name))return null;
 const params={};if(['generate','download_zip'].includes(name)&&Number.isInteger(input.count)&&input.count>=1&&input.count<=24)params.design_count=input.count;
 if(name==='download_zip'&&['stl','3mf','both'].includes(input.format))params.file_format=input.format;
 return {name,params};
}
