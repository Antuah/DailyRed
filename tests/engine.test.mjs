import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {POKEMON,MOVES} from '../src/data.js';
import {Battle,dailyTeam,pickDailyIds,makePokemon,redTeam,seedRandom,LEGENDS,effectiveness,bestMove,dayKey} from '../src/engine.js';

test('El equipo diario es reproducible y cambia con la fecha UTC',()=>{
 assert.deepEqual(dailyTeam('2026-10-11'),dailyTeam('2026-10-11'));
 assert.notDeepEqual(pickDailyIds('2026-10-11'),pickDailyIds('2026-10-12'));
 assert.equal(dayKey(new Date('2026-10-11T23:59:59Z')),'2026-10-11');
 assert.equal(dayKey(new Date('2026-10-12T00:00:00Z')),'2026-10-12');
});
test('10.000 sorteos mantienen seis especies únicas, nivel equilibrado y rareza del 2 %',()=>{
 let count=0;const found=new Set();
 for(let i=0;i<10000;i++){const team=pickDailyIds(`sample-${i}`);assert.equal(team.length,6);assert.equal(new Set(team.map(p=>p.id)).size,6);
  for(const p of team){assert.ok(p.id>=1&&p.id<=151);assert.ok(p.level>=84&&p.level<=88);if(LEGENDS.includes(p.id))count++;found.add(p.id);}}
 assert.equal(found.size,151);assert.ok(count/60000>.017&&count/60000<.023);
});
test('Los 151 Pokémon incluyen datos, movimientos legales seleccionados y sprites locales',async()=>{
 assert.equal(POKEMON.length,151);
 for(const data of POKEMON){const p=makePokemon(data.id,86);assert.ok(p.moves.length>=1&&p.moves.length<=4,data.name);assert.ok(p.hp>0);
  for(const m of p.moves){assert.ok(data.learn.includes(m.id),`${data.name}: ${m.id}`);assert.ok(m.ppLeft>0);assert.ok(m.type);}
  for(const side of ['front','back'])await access(new URL(`../assets/pokemon/${side}/${p.id}.png`,import.meta.url));
 }
});
test('Tabla de tipos de generación III: inmunidades, resistencias y doble debilidad',()=>{
 assert.equal(effectiveness('electric',['ground']),0);assert.equal(effectiveness('normal',['ghost']),0);
 assert.equal(effectiveness('rock',['fire','flying']),4);assert.equal(effectiveness('water',['water','dragon']),.25);
 assert.equal(effectiveness('ghost',['steel']),.5);assert.equal(effectiveness('psychic',['poison']),2);
});
test('Equipo de Red contiene únicamente primera generación y niveles 80–88',()=>{
 assert.deepEqual(redTeam().map(p=>p.id),[25,131,143,3,6,9]);assert.ok(redTeam().every(p=>p.level>=80&&p.level<=88));
});
test('No se puede elegir un movimiento sin PP ni curarse sin necesidad',()=>{
 const b=new Battle(dailyTeam('2026-10-11'));b.ally.moves.forEach(m=>m.ppLeft=0);
 assert.deepEqual(b.choose({kind:'move',index:0}),[]);assert.deepEqual(b.choose({kind:'potion'}),[]);assert.equal(b.turn,0);
 assert.ok(b.choose({kind:'move',index:-1}).length>0);
});
test('Un movimiento consume PP y ambos lados actúan por turnos',()=>{
 const b=new Battle([makePokemon(9,84,['surf','ice-beam'])],0,()=>.5);const pp=b.ally.moves[0].ppLeft;
 const events=b.choose({kind:'move',index:0});assert.equal(b.turn,1);assert.equal(b.ally.moves[0].ppLeft,pp-1);
 assert.ok(events.some(e=>e.attack==='player'));assert.ok(events.some(e=>e.attack==='red'));
});
test('Ataque rápido tiene prioridad incluso contra un rival más veloz',()=>{
 const b=new Battle([makePokemon(19,84,['quick-attack'])],0,()=>.5);b.foe.moves=[{...MOVES.surf,ppLeft:15}];b.foe.stats.spe=999;
 assert.equal(b.choose({kind:'move',index:0}).find(e=>e.attack).attack,'player');
});
test('El cambio voluntario deja a Red atacar al sustituto',()=>{
 const b=new Battle([makePokemon(9,84,['surf']),makePokemon(143,84,['body-slam'])],0,()=>.5);
 const events=b.choose({kind:'switch',index:1});assert.equal(b.active,1);assert.equal(b.turn,1);
 assert.equal(events.filter(e=>e.attack==='player').length,0);assert.ok(events.some(e=>e.attack==='red'));
});
test('Elegir sustituto tras un debilitamiento es gratis y no provoca otro ataque',()=>{
 const b=new Battle([makePokemon(10,84,['tackle']),makePokemon(143,84,['body-slam'])],0,()=>.5);b.ally.hp=1;
 b.choose({kind:'move',index:0});assert.equal(b.forced,true);const turn=b.turn;
 const events=b.choose({kind:'switch',index:1});assert.equal(b.turn,turn);assert.equal(b.forced,false);assert.equal(b.active,1);assert.ok(events.every(e=>!e.attack));
});
test('Las pociones recuperan PS, consumen recurso y permiten la respuesta de Red',()=>{
 const b=new Battle([makePokemon(143,84,['body-slam'])],0,()=>.5);b.ally.hp=20;
 const events=b.choose({kind:'potion'});assert.equal(b.potions,1);assert.ok(events.some(e=>e.heal==='player'));assert.ok(events.some(e=>e.attack==='red'));
 assert.ok(b.ally.hp>20);
});
test('Inmunidad Tierra evita Rayo y Onda trueno',()=>{
 const b=new Battle([makePokemon(25,84,['thunderbolt','thunder-wave'])],0,()=>.5);b.red=[makePokemon(51,84,['growl'])];
 const hp=b.foe.hp;b.choose({kind:'move',index:0});assert.equal(b.foe.hp,hp);b.choose({kind:'move',index:1});assert.equal(b.foe.status,null);
});
test('El sueño y el veneno producen efectos persistentes y los tipos Veneno/Acero son inmunes al veneno',()=>{
 const b=new Battle([makePokemon(3,84,['sleep-powder','toxic'])],0,()=>.5);b.ally.stats.spe=999;b.foe.moves=[{...MOVES.growl,ppLeft:40}];
 let e=b.choose({kind:'move',index:0});assert.equal(b.foe.status,'slp');assert.ok(e.some(x=>x.text.includes('está dormido')));
 b.foe.status=null;const hp=b.foe.hp;b.choose({kind:'move',index:1});assert.equal(b.foe.status,'tox');assert.ok(b.foe.hp<hp);
 for(const id of [3,82]){b.red=[makePokemon(id,84,['growl'])];b.enemy=0;b.choose({kind:'move',index:1});assert.equal(b.foe.status,null);}
});
test('Ditto copia el rival sin copiar sus PS y recibe cinco PP por movimiento',()=>{
 const b=new Battle([makePokemon(132,86)],0,()=>.5),hp=b.ally.maxHp;b.choose({kind:'move',index:0});
 assert.equal(b.ally.formId,25);assert.equal(b.ally.maxHp,hp);assert.equal(b.ally.stats.hp,hp);assert.ok(b.ally.moves.every(m=>m.pp===5));
});
test('Ditto recupera su forma y estadísticas al salir del campo',()=>{
 const b=new Battle([makePokemon(132,86),makePokemon(143,86,['body-slam'])],0,()=>.5);
 b.choose({kind:'move',index:0});assert.equal(b.ally.formId,25);b.choose({kind:'switch',index:1});
 assert.equal(b.player[0].formId,null);assert.equal(b.player[0].name,'Ditto');assert.equal(b.player[0].moves[0].id,'transform');
});
test('Cien combates completos terminan con PS válidos y sin bloquear el cambio forzado',()=>{
 for(let i=0;i<100;i++){const rng=seedRandom(`battle-${i}`),b=new Battle(dailyTeam(`date-${i}`),0,rng);let turns=0;
  while(!b.over&&turns++<500){const action=b.forced?{kind:'switch',index:b.player.findIndex(p=>p.hp>0)}:bestMove(b.ally,b.foe,rng);const events=b.choose(action);assert.ok(events.length>0);
   assert.ok([...b.player,...b.red].every(p=>p.hp>=0&&p.hp<=p.maxHp));}
  assert.ok(b.over,`Combate ${i} no terminó`);
 }
});
test('Derrotar al último Pokémon termina el combate e impide más turnos',()=>{
 const b=new Battle([makePokemon(150,88,['psychic'])],0,()=>.5);b.red=[makePokemon(10,1,['tackle'])];
 b.choose({kind:'move',index:0});assert.equal(b.over,'win');assert.deepEqual(b.choose({kind:'move',index:0}),[]);
});
