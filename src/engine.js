import { POKEMON, MOVES } from './data.js';

export const TYPE_NAMES = {normal:'Normal',fire:'Fuego',water:'Agua',electric:'Eléctrico',grass:'Planta',ice:'Hielo',fighting:'Lucha',poison:'Veneno',ground:'Tierra',flying:'Volador',psychic:'Psíquico',bug:'Bicho',rock:'Roca',ghost:'Fantasma',dragon:'Dragón',dark:'Siniestro',steel:'Acero'};
export const LEGENDS = [144,145,146,150,151];
export const RARE = [1,2,3,4,5,6,7,8,9,25,26,35,36,63,64,65,83,106,107,113,115,122,123,124,125,126,127,128,130,131,133,134,135,136,137,142,143,147,148,149];
export const RED_ROSTER = [[25,88,['thunderbolt','iron-tail','quick-attack','thunder-wave']],[131,80,['surf','ice-beam','body-slam','psychic']],[143,82,['body-slam','shadow-ball','earthquake','rest']],[3,84,['giga-drain','sludge-bomb','sleep-powder','body-slam']],[6,84,['flamethrower','wing-attack','earthquake','slash']],[9,84,['surf','ice-beam','earthquake','bite']]];
const CHART={
 normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},
 water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},
 grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
 ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
 fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2},
 poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
 flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
 bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5},
 rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},ghost:{normal:0,psychic:2,ghost:2,dark:.5,steel:.5},
 dragon:{dragon:2,steel:.5},dark:{fighting:.5,psychic:2,ghost:2,dark:.5,steel:.5},steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5}
};
export function effectiveness(type, types) {return types.reduce((v,t)=>v*(CHART[type]?.[t]??1),1);}
export function dayKey(date=new Date()) {return date.toISOString().slice(0,10);}
export function seedRandom(seed) {
 let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
 return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
}
export function pickDailyIds(day) {
 const rng=seedRandom(`daily-red-v1:${day}`),used=new Set(),team=[];
 const normal=POKEMON.map(p=>p.id).filter(id=>!LEGENDS.includes(id)&&!RARE.includes(id));
 for(let i=0;i<6;i++) {
  const roll=rng();const bucket=roll<.02?LEGENDS:roll<.26?RARE:normal;
  const available=bucket.filter(id=>!used.has(id));const id=available[Math.floor(rng()*available.length)];
  used.add(id);team.push({id,level:84+Math.floor(rng()*5)});
 }
 return team;
}
function chooseMoves(p) {
 const all=p.learn.map(id=>MOVES[id]).filter(Boolean);
 if(p.id===132)return ['transform'];
 const damage=all.filter(m=>m.power>0||m.fixed);
 const score=m=>(m.power||65)*(p.types.includes(m.type)?1.5:1)*(m.accuracy/100)*(m.category==='special'?p.stats.spa/p.stats.atk:1);
 damage.sort((a,b)=>score(b)-score(a));
 const picks=[];
 const stab=damage.find(m=>p.types.includes(m.type));if(stab)picks.push(stab);
 for(const m of damage)if(picks.length<3&&!picks.some(x=>x.type===m.type))picks.push(m);
 const status=all.filter(m=>m.category==='status'&&!m.splash&&!m.lower&&!m.transform).sort((a,b)=>(b.heal?5:b.status?4:b.boost?3:1)-(a.heal?5:a.status?4:a.boost?3:1));
 if(status[0])picks.push(status[0]);
 for(const m of [...damage,...all])if(picks.length<4&&!picks.includes(m))picks.push(m);
 return picks.map(m=>m.id);
}
export function makePokemon(id,level,moves) {
 const p=POKEMON.find(p=>p.id===id);if(!p)throw Error(`Pokémon desconocido: ${id}`);
 const stats={};for(const [key,base]of Object.entries(p.stats))stats[key]=Math.floor((2*base+31+21)*level/100)+(key==='hp'?level+10:5);
 return {id,name:p.name,types:[...p.types],level,stats,hp:stats.hp,maxHp:stats.hp,status:null,statusTurns:0,toxic:0,
  stages:{atk:0,def:0,spa:0,spd:0,spe:0},moves:(moves??chooseMoves(p)).map(id=>({...MOVES[id],ppLeft:MOVES[id].pp})),formId:null};
}
export function dailyTeam(day) {return pickDailyIds(day).map(p=>makePokemon(p.id,p.level));}
export function redTeam() {return RED_ROSTER.map(([id,level,moves])=>makePokemon(id,level,moves));}
function stat(p,key) {const s=p.stages[key]??0;return p.stats[key]*(s>=0?(2+s)/2:2/(2-s))*(key==='spe'&&p.status==='par'?.25:1)*(key==='atk'&&p.status==='brn'?.5:1);}
function movePower(p,m) {
 if(!m.flail)return m.power;
 const ratio=p.hp/p.maxHp;return ratio<=.0417?200:ratio<=.1042?150:ratio<=.2083?100:ratio<=.3542?80:ratio<=.6875?40:20;
}
export function estimateDamage(a,d,m) {
 const eff=effectiveness(m.type,d.types);if(!eff)return 0;
 if(m.fixed)return m.fixed==='level'?a.level:m.fixed;
 if(!m.power)return 0;
 const physical=m.category==='physical';return Math.floor(((2*a.level/5+2)*movePower(a,m)*stat(a,physical?'atk':'spa')/stat(d,physical?'def':'spd')/50+2)*(a.types.includes(m.type)?1.5:1)*eff*(m.hits??1));
}
export function bestMove(a,d,rng=Math.random) {
 const available=a.moves.map((m,i)=>({m,i})).filter(x=>x.m.ppLeft>0);
 if(!available.length)return {kind:'move',index:-1};
 const ranked=available.map(({m,i})=>{
  let score=estimateDamage(a,d,m)*m.accuracy/100;
  if(m.heal||m.rest)score=a.hp<a.maxHp*.42?(a.maxHp-a.hp)*.7:0;
  else if(m.transform)score=120;
  else if(m.status&&m.category==='status')score=!d.status&&canStatus(d,m.status,m.type)?45:0;
  else if(m.boost)score=Object.keys(m.boost).some(k=>a.stages[k]<2)?25:0;
  return {i,score:score*(.88+rng()*.24)};
 }).sort((a,b)=>b.score-a.score);
 return {kind:'move',index:ranked[0].i};
}
function canStatus(p,status,type) {
 if(p.status||p.hp<=0)return false;
 if(['psn','tox'].includes(status)&&p.types.some(t=>['poison','steel'].includes(t)))return false;
 if(status==='brn'&&p.types.includes('fire'))return false;
 if(status==='frz'&&p.types.includes('ice'))return false;
 if(type==='electric'&&p.types.includes('ground'))return false;
 return true;
}
const STATUS_LABEL={par:'paralizado',psn:'envenenado',tox:'gravemente envenenado',slp:'dormido',brn:'quemado',frz:'congelado'};
export class Battle {
 constructor(team,lead=0,rng=Math.random) {
  this.player=structuredClone(team);this.red=redTeam();this.active=lead;this.enemy=0;this.turn=0;this.rng=rng;
  this.events=[];this.over=null;this.forced=false;this.potions=2;
 }
 get ally(){return this.player[this.active];}get foe(){return this.red[this.enemy];}
 snapshot(){return {player:structuredClone(this.player),red:structuredClone(this.red),active:this.active,enemy:this.enemy,turn:this.turn,over:this.over,potions:this.potions,forced:this.forced};}
 emit(text,extra={}) {this.events.push({text,...extra,state:this.snapshot()});}
 choose(action) {
  if(this.over)return [];
  if(this.forced){if(action.kind!=='switch'||!this.player[action.index]?.hp||action.index===this.active)return [];this.switchTo(action.index);this.forced=false;this.emit(`¡Adelante, ${this.ally.name}!`);return this.events.splice(0);}
  if(!this.valid(action))return [];
  this.turn++;this.flinched=new Set();const enemyAction=bestMove(this.foe,this.ally,this.rng);
  if(action.kind==='switch'){this.switchTo(action.index);this.emit(`¡Adelante, ${this.ally.name}!`);this.attack('red',enemyAction.index);}
  else if(action.kind==='potion'){this.potions--;this.ally.hp=this.ally.maxHp;this.emit(`La Máxima Poción restauró los PS de ${this.ally.name}.`,{heal:'player'});this.attack('red',enemyAction.index);}
  else {
   const pm=this.getMove(this.ally,action.index),em=this.getMove(this.foe,enemyAction.index);
   const first=pm.priority!==em.priority?(pm.priority>em.priority?'player':'red'):stat(this.ally,'spe')!==stat(this.foe,'spe')?(stat(this.ally,'spe')>stat(this.foe,'spe')?'player':'red'):(this.rng()<.5?'player':'red');
   this.attack(first,first==='player'?action.index:enemyAction.index);
   if(this.ally.hp>0&&this.foe.hp>0)this.attack(first==='player'?'red':'player',first==='player'?enemyAction.index:action.index);
  }
  for(const side of ['player','red'])this.residual(side);
  this.finishTurn();return this.events.splice(0);
 }
 valid(a) {
  if(a.kind==='switch')return !!this.player[a.index]?.hp&&a.index!==this.active;
  if(a.kind==='potion')return this.potions>0&&this.ally.hp<this.ally.maxHp;
  if(a.kind==='move')return a.index===-1?this.ally.moves.every(m=>m.ppLeft===0):!!this.ally.moves[a.index]?.ppLeft;
  return false;
 }
 getMove(p,i){return i===-1?{id:'struggle',name:'Forcejeo',type:'normal',power:50,category:'physical',accuracy:100,priority:0,recoil:.25}:p.moves[i];}
 switchTo(i){
  if(this.ally.formId){const original=makePokemon(this.ally.id,this.ally.level);Object.assign(this.ally,{name:original.name,types:original.types,stats:original.stats,moves:original.moves,formId:null});}
  this.ally.stages={atk:0,def:0,spa:0,spd:0,spe:0};this.ally.toxic=0;this.active=i;
 }
 attack(side,index) {
  const a=side==='player'?this.ally:this.foe,d=side==='player'?this.foe:this.ally;
  if(!a.hp||!d.hp)return;
  if(this.flinched.has(side)){this.emit(`${a.name} retrocedió y no pudo atacar.`);return;}
  if(a.status==='slp'){a.statusTurns--;if(a.statusTurns>0){this.emit(`${a.name} está dormido.`);return;}a.status=null;this.emit(`${a.name} despertó.`);}
  if(a.status==='frz'){if(this.rng()<.2){a.status=null;this.emit(`${a.name} se descongeló.`);}else{this.emit(`${a.name} está congelado.`);return;}}
  if(a.status==='par'&&this.rng()<.25){this.emit(`${a.name} está paralizado. No se puede mover.`);return;}
  const m=this.getMove(a,index);if(index!==-1)m.ppLeft--;
  this.emit(`${a.name} usó ${m.name}.`,{attack:side,type:m.type});
  if(!m.neverMiss&&this.rng()*100>=m.accuracy){this.emit(`¡El ataque de ${a.name} falló!`);return;}
  if(m.transform){a.formId=d.formId??d.id;a.name=`Ditto (${d.name})`;a.types=[...d.types];a.stats={...d.stats,hp:a.maxHp};a.stages={...d.stages};a.moves=d.moves.map(m=>({...m,ppLeft:5,pp:5}));this.emit(`¡Ditto se transformó en ${d.name}!`);return;}
  if(m.heal||m.rest){const old=a.hp;a.hp=Math.min(a.maxHp,a.hp+(m.rest?a.maxHp:Math.floor(a.maxHp*m.heal)));if(m.rest){a.status='slp';a.statusTurns=3;}this.emit(a.hp>old?`${a.name} recuperó ${a.hp-old} PS.`:'No tuvo efecto.',{heal:side});return;}
  if(m.boost||m.lower){const target=m.boost?a:d;let changed=false;for(const[k,v]of Object.entries(m.boost??m.lower)){const old=target.stages[k];target.stages[k]=Math.max(-6,Math.min(6,old+v));if(old!==target.stages[k])changed=true;}this.emit(changed?`${m.boost?'Subieron':'Bajaron'} las estadísticas de ${target.name}.`:'Las estadísticas no pueden cambiar más.');return;}
  if(m.splash){this.emit('Pero no ocurrió nada.');return;}
  if(m.category==='status'){this.applyStatus(d,m.status,m.type);return;}
  const eff=m.id==='struggle'?1:effectiveness(m.type,d.types);
  if(eff===0){this.emit(`No afecta a ${d.name}.`);return;}
  const crit=this.rng()<(m.crit?1/8:1/16);
  let damage=estimateDamage(a,d,m);if(m.id==='struggle')damage=Math.floor(((2*a.level/5+2)*50*stat(a,'atk')/stat(d,'def')/50+2));
  damage=Math.max(1,Math.floor(damage*(m.fixed?1:(.85+this.rng()*.15)*(crit?2:1))));
  const dealt=Math.min(d.hp,damage);d.hp-=dealt;
  this.emit(`${d.name} perdió ${dealt} PS.${!m.fixed&&crit?' ¡Golpe crítico!':''}${eff>1?' ¡Es supereficaz!':eff<1?' No es muy eficaz.':''}`,{hit:side==='player'?'red':'player'});
  if(m.drain){const restored=Math.min(a.maxHp-a.hp,Math.max(1,Math.floor(dealt*m.drain)));a.hp+=restored;if(restored)this.emit(`${a.name} recuperó ${restored} PS.`,{heal:side});}
  if(m.recoil){const recoil=Math.min(a.hp,Math.max(1,Math.floor(dealt*m.recoil)));a.hp-=recoil;this.emit(`${a.name} recibió ${recoil} PS de daño por retroceso.`,{hit:side});}
  if(m.chance&&this.rng()*100<m.chance&&d.hp>0&&!d.status)this.applyStatus(d,m.status,m.type);
  if(m.flinch&&this.rng()*100<m.flinch)this.flinched.add(side==='player'?'red':'player');
 }
 applyStatus(p,status,type) {
  if(!status||!canStatus(p,status,type)){this.emit('No tuvo efecto.');return;}
  p.status=status;p.statusTurns=status==='slp'?2+Math.floor(this.rng()*3):0;p.toxic=0;this.emit(`${p.name} quedó ${STATUS_LABEL[status]}.`);
 }
 residual(side){
  const p=side==='player'?this.ally:this.foe;if(!p.hp)return;
  let amount=0;if(p.status==='tox'){p.toxic++;amount=Math.max(1,Math.floor(p.maxHp*p.toxic/16));}
  else if(['brn','psn'].includes(p.status))amount=Math.max(1,Math.floor(p.maxHp/8));
  if(amount){p.hp=Math.max(0,p.hp-amount);this.emit(`${p.name} pierde PS por ${p.status==='brn'?'la quemadura':'el veneno'}.`,{hit:side});}
 }
 finishTurn(){
  if(!this.ally.hp)this.emit(`${this.ally.name} se debilitó.`,{faint:'player'});
  if(!this.foe.hp)this.emit(`${this.foe.name} se debilitó.`,{faint:'red'});
  const alive=this.player.some(p=>p.hp>0),redAlive=this.red.some(p=>p.hp>0);
  if(!alive||!redAlive){this.over=!alive&&!redAlive?'draw':redAlive?'loss':'win';this.emit(this.over==='win'?'¡Has derrotado a Red!':this.over==='draw'?'Los dos equipos se debilitaron. ¡Empate!':'Red ganó este combate. Puedes volver a intentarlo.');return;}
  if(!this.foe.hp){this.enemy=this.red.findIndex(p=>p.hp>0);this.emit(`Red envía a ${this.foe.name}.`);}
  if(!this.ally.hp){this.forced=true;this.emit('Elige un Pokémon para seguir luchando.');}
 }
}
