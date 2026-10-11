import {mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../assets/overworld/',import.meta.url);
await mkdir(root,{recursive:true});
await mkdir(new URL('pokemon/',root),{recursive:true});
async function download(url,path){const r=await fetch(url);if(!r.ok)throw Error(`No se pudo descargar ${path}: ${r.status}`);await writeFile(new URL(path,root),new Uint8Array(await r.arrayBuffer()));}
const tasks=Array.from({length:151},(_,i)=>i+1).map(id=>({url:`https://raw.githubusercontent.com/teobz/pkmn-hgss-animated-overworld-sprites/main/APNG/by-direction/up/regular/${String(id).padStart(3,'0')}_up.png`,path:`pokemon/${id}-up.png`}));
for(const id of [25,131,143,3,6,9])tasks.push({url:`https://raw.githubusercontent.com/teobz/pkmn-hgss-animated-overworld-sprites/main/APNG/by-direction/down/regular/${String(id).padStart(3,'0')}_down.png`,path:`pokemon/${id}-down.png`});
let cursor=0;await Promise.all(Array.from({length:8},async()=>{while(cursor<tasks.length){const t=tasks[cursor++];await download(t.url,t.path);}}));
await download('https://raw.githubusercontent.com/pret/pokefirered/master/graphics/object_events/pics/people/red_normal.png','red.png');
await download('https://raw.githubusercontent.com/pret/pokefirered/master/graphics/trainers/front_pics/red_front_pic.png','red-portrait.png');
console.log('159 sprites originales de campo y entrenador preparados.');
