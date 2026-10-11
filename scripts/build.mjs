import {mkdir,cp,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);await rm(new URL('dist/',root),{recursive:true,force:true});await mkdir(new URL('dist/',root),{recursive:true});
for(const file of ['index.html','src','assets'])await cp(new URL(file,root),new URL(`dist/${file}`,root),{recursive:true});
console.log('Daily Red está listo en dist/.');
