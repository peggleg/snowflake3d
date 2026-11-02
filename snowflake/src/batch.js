import {settings} from './design.js';
export const MAX_BATCH=24;
export function batchSettings(input,count){
 if(!Number.isInteger(count)||count<1||count>MAX_BATCH)throw Error(`Choose between 1 and ${MAX_BATCH} snowflakes.`);
 const s=settings(input);
 return Array.from({length:count},(_,i)=>({...s,seed:count===1?s.seed:`${s.seed.slice(0,120)}~${i+1}`}));
}
