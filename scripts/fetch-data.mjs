import {mkdir, writeFile} from 'node:fs/promises';

// Data is bundled once. The deployed game does not call PokéAPI.
const definitions = [
 ['tackle','Placaje',35],['body-slam','Golpe cuerpo',85,{chance:30,status:'par'}],
 ['slam','Portazo',80],['double-edge','Doble filo',120,{recoil:1/3}],
 ['swift','Rapidez',60],['quick-attack','Ataque rápido',40,{priority:1}],
 ['slash','Cuchillada',70,{crit:true}],['headbutt','Golpe cabeza',70,{flinch:30}],
 ['hyper-fang','Hipercolmillo',80,{flinch:10}],['strength','Fuerza',80],
 ['flamethrower','Lanzallamas',95,{chance:10,status:'brn'}],
 ['fire-blast','Llamarada',120,{chance:10,status:'brn'}],['ember','Ascuas',40,{chance:10,status:'brn'}],
 ['surf','Surf',95],['hydro-pump','Hidrobomba',120],['bubble-beam','Rayo burbuja',65],['water-gun','Pistola agua',40],
 ['razor-leaf','Hoja afilada',55,{crit:true}],['giga-drain','Gigadrenado',60,{drain:.5}],
 ['vine-whip','Látigo cepa',35],['mega-drain','Megaagotar',40,{drain:.5}],
 ['thunderbolt','Rayo',95,{chance:10,status:'par'}],['thunder','Trueno',120,{chance:30,status:'par'}],
 ['thunder-shock','Impactrueno',40,{chance:10,status:'par'}],
 ['ice-beam','Rayo hielo',95,{chance:10,status:'frz'}],['blizzard','Ventisca',120,{chance:10,status:'frz'}],['aurora-beam','Rayo aurora',65],
 ['brick-break','Demolición',75],['submission','Sumisión',80,{recoil:.25}],['cross-chop','Tajo cruzado',100,{crit:true}],
 ['seismic-toss','Movimiento sísmico',0,{fixed:'level'}],['karate-chop','Golpe kárate',50,{crit:true}],
 ['psychic','Psíquico',90],['confusion','Confusión',50],['psybeam','Psicorrayo',65],
 ['earthquake','Terremoto',100],['bone-club','Hueso palo',65,{flinch:10}],
 ['rock-slide','Avalancha',75,{flinch:30}],['rock-throw','Lanzarrocas',50],
 ['wing-attack','Ataque ala',60],['drill-peck','Pico taladro',80],['aerial-ace','Golpe aéreo',60],['peck','Picotazo',35],
 ['twineedle','Doble ataque',25,{hits:2,chance:20,status:'psn'}],['megahorn','Megacuerno',120],
 ['silver-wind','Viento plata',60],['leech-life','Chupavidas',20,{drain:.5}],
 ['shadow-ball','Bola sombra',80],['lick','Lengüetazo',20,{chance:30,status:'par'}],['night-shade','Tinieblas',0,{fixed:'level'}],
 ['sludge-bomb','Bomba lodo',90,{chance:30,status:'psn'}],['sludge','Residuos',65,{chance:30,status:'psn'}],
 ['poison-sting','Picotazo veneno',15,{chance:30,status:'psn'}],['acid','Ácido',40],
 ['iron-tail','Cola férrea',100],['metal-claw','Garra metal',50],['bite','Mordisco',60,{flinch:30}],['crunch','Triturar',80],
 ['dragon-rage','Furia dragón',0,{fixed:40}],['dragon-claw','Garra dragón',80],['dragon-breath','Dragoaliento',60,{chance:30,status:'par'}],
 ['flail','Azote',1,{flail:true}],['rage','Furia',20,{rage:true}],
 ['thunder-wave','Onda trueno',0,{status:'par'}],['toxic','Tóxico',0,{status:'tox'}],
 ['sleep-powder','Somnífero',0,{status:'slp'}],['hypnosis','Hipnosis',0,{status:'slp'}],['spore','Espora',0,{status:'slp'}],
 ['stun-spore','Paralizador',0,{status:'par'}],['poison-powder','Polvo veneno',0,{status:'psn'}],
 ['recover','Recuperación',0,{heal:.5}],['soft-boiled','Amortiguador',0,{heal:.5}],['rest','Descanso',0,{rest:true}],
 ['swords-dance','Danza espada',0,{boost:{atk:2}}],['agility','Agilidad',0,{boost:{spe:2}}],
 ['amnesia','Amnesia',0,{boost:{spd:2}}],['barrier','Barrera',0,{boost:{def:2}}],
 ['growl','Gruñido',0,{lower:{atk:-1}}],['tail-whip','Látigo',0,{lower:{def:-1}}],
 ['screech','Chirrido',0,{lower:{def:-2}}],['string-shot','Disparo demora',0,{lower:{spe:-1}}],
 ['harden','Fortaleza',0,{boost:{def:1}}],['withdraw','Refugio',0,{boost:{def:1}}],
 ['growth','Desarrollo',0,{boost:{spa:1}}],['splash','Salpicadura',0,{splash:true}],
 ['transform','Transformación',0,{transform:true}],
];
const specialTypes = new Set(['fire','water','grass','electric','ice','psychic','dragon','dark']);
const dir = new URL('../',import.meta.url);
await mkdir(new URL('assets/pokemon/front/',dir),{recursive:true});
await mkdir(new URL('assets/pokemon/back/',dir),{recursive:true});
async function get(url, binary=false) {
 for(let retry=0;retry<4;retry++) {
  try {const res=await fetch(url); if(!res.ok)throw Error(`${res.status} ${url}`);return binary?new Uint8Array(await res.arrayBuffer()):await res.json();}
  catch(e){if(retry===3)throw e;await new Promise(r=>setTimeout(r,500*(retry+1)));}
 }
}
async function pool(items, fn) {
 let cursor=0;const out=[];
 await Promise.all(Array.from({length:10},async()=>{while(cursor<items.length){const i=cursor++;out[i]=await fn(items[i]);}}));
 return out;
}
const moveList=await pool(definitions,async([id,name,power,extra={}])=>{
 const m=await get(`https://pokeapi.co/api/v2/move/${id}`);
 return {id,name,type:m.type.name,power,accuracy:m.accuracy??100,neverMiss:m.accuracy===null,pp:m.pp,
  category:m.damage_class.name==='status'?'status':specialTypes.has(m.type.name)?'special':'physical',priority:m.priority,...extra};
});
const known=new Set(moveList.map(m=>m.id));
const statKeys=['hp','atk','def','spa','spd','spe'];
const inherit={11:10,14:13,15:13};
const raw=await pool(Array.from({length:151},(_,i)=>i+1),async id=>{
 const p=await get(`https://pokeapi.co/api/v2/pokemon/${id}`);
 const oldTypes=p.past_types.find(x=>['generation-iii','generation-iv','generation-v'].includes(x.generation.name));
 const types=(oldTypes?.types??p.types).sort((a,b)=>a.slot-b.slot).map(t=>t.type.name).filter(t=>t!=='fairy');
 if(!types.length)types.push('normal');
 const stats=Object.fromEntries(p.stats.map((s,i)=>[statKeys[i],s.base_stat]));
 // Pre-generation-VI base stats for the species buffed afterwards.
 const old={12:{spa:80},15:{atk:80},18:{spe:91},24:{atk:85},25:{def:30,spd:40},26:{spe:100},31:{atk:82},34:{atk:92},
  36:{spa:85},40:{spa:75},45:{spa:100},62:{atk:85},65:{spd:85},71:{spd:60},76:{atk:110},83:{atk:65},
  85:{spe:100},101:{spe:140},103:{spd:65},164:{spa:76}};
 Object.assign(stats,old[id]??{});
 const learn=p.moves.filter(m=>known.has(m.move.name)&&m.version_group_details.some(v=>v.version_group.name==='firered-leafgreen'&&v.level_learned_at<=88)).map(m=>m.move.name);
 const names={29:'Nidoran ♀',32:'Nidoran ♂',83:"Farfetch’d",122:'Mr. Mime'};
 await Promise.all(['front','back'].map(async side=>{
  const tail=side==='back'?'back/':'';
  const sprite=await get(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${tail}${id}.png`,true);
  await writeFile(new URL(`assets/pokemon/${side}/${id}.png`,dir),sprite);
 }));
 return {id,name:names[id]??p.name[0].toUpperCase()+p.name.slice(1),types,stats,learn};
});
for(const p of raw)if(inherit[p.id])p.learn=[...new Set([...p.learn,...raw[inherit[p.id]-1].learn])];
await writeFile(new URL('src/data.js',dir),`// Bundled PokéAPI data. FireRed/LeafGreen learnsets and generation III stats.\nexport const POKEMON = ${JSON.stringify(raw)};\nexport const MOVES = ${JSON.stringify(Object.fromEntries(moveList.map(m=>[m.id,m])))};\n`);
console.log(`Bundled ${raw.length} Pokémon, ${moveList.length} supported moves and ${raw.length*2} sprites.`);
