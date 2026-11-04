import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
 root:'snowflake',
 publicDir:'public',
 build:{outDir:'../dist-snowflake',emptyOutDir:true,rollupOptions:{input:{index:fileURLToPath(new URL('./index.html',import.meta.url)),contact:fileURLToPath(new URL('./contact.html',import.meta.url)),analytics:fileURLToPath(new URL('./analytics.html',import.meta.url)),privacy:fileURLToPath(new URL('./privacy.html',import.meta.url)),usage:fileURLToPath(new URL('./usage.html',import.meta.url)),help:fileURLToPath(new URL('./help.html',import.meta.url)),independence:fileURLToPath(new URL('./independence.html',import.meta.url))}}},
 plugins:[{
  name:'isolated-routes',
  generateBundle:{order:'post',handler(_,bundle){
   // Pages serves snowflake.html at /snowflake using its native clean URLs.
   // Rewriting to index.html can canonicalize to / and loop back here.
   const page=bundle['index.html'];
   if(!page||page.type!=='asset')throw Error('Missing generator HTML entry.');
   delete bundle['index.html'];
   this.emitFile({type:'asset',fileName:'snowflake.html',source:page.source});
   this.emitFile({type:'asset',fileName:'_redirects',source:'/ /snowflake 302\n/snowflake/ /snowflake 302\n'});
   this.emitFile({type:'asset',fileName:'404.html',source:'<!doctype html><title>Not found</title><h1>Not found</h1>'});
  }}
 }]
});
