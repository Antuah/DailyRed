import {POKEMON,MOVES} from './data.js';
import {dailyTeam,redTeam,dayKey,LEGENDS,RARE,TYPE_NAMES,Battle,effectiveness} from './engine.js';
import {drawMap} from './scene.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sprite=(p,side='front')=>`./assets/pokemon/${side}/${p.formId??p.id}.png`;
const badges=p=>p.types.map(t=>`<span class="type-badge type-${t}">${TYPE_NAMES[t]}</span>`).join('');
let day=dayKey(),team=dailyTeam(day),lead=0,battle=null,view=null,busy=false,menu='main',battleDay=day,log=[],sound=false,audio=null,record={};
let storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem('daily-red-record-v1')??'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))record=saved;}catch{storageAvailable=false;}
function numbers(date=day){const r=record[date]??{};return {attempts:Number.isSafeInteger(r.attempts)&&r.attempts>=0?r.attempts:0,wins:Number.isSafeInteger(r.wins)&&r.wins>=0?r.wins:0};}
function saveRecord(){try{localStorage.setItem('daily-red-record-v1',JSON.stringify(record));}catch{storageAvailable=false;toast('El navegador no permite guardar tus resultados. Puedes seguir jugando.');}renderRecord();}
function renderRecord(){const r=numbers();$('attempt-count').textContent=r.attempts;$('win-count').textContent=r.wins;$('days-count').textContent=Object.keys(record).filter(k=>numbers(k).wins>0).length;$('record-summary').textContent=!storageAvailable?'Los resultados se guardan durante esta sesión.':r.wins?'Ya conquistaste la cima de hoy. ¿Una revancha?':r.attempts?'La cima sigue ahí. Cada intento cuenta.':'El primer paso es aceptar el reto.';}
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function openModal(html){$('modal-content').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
function closeModal(){$('modal').close();}
$('close-modal').addEventListener('click',closeModal);
$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function tone(freq,duration=.1,offset=0){if(!sound)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const t=audio.currentTime+offset,o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.055,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration);}catch{}}
$('sound-button').onclick=()=>{sound=!sound;$('sound-button').setAttribute('aria-pressed',String(sound));$('sound-button').setAttribute('aria-label',sound?'Desactivar sonido':'Activar sonido');$('sound-label').textContent=sound?'Sonido on':'Sonido off';$('sound-icon').textContent=sound?'♪':'♫';if(sound){tone(523);tone(659,.15,.1);}};
function renderTeam(){
 const shown=view?.player??team;
 $('team-grid').innerHTML=shown.map((p,i)=>`<button class="team-card ${i===(battle?view.active:lead)?'lead':''} ${p.hp===0?'is-fainted':''}" data-detail="${i}" aria-label="Revisar ${esc(p.name)}, nivel ${p.level}${i===lead&&!battle?', Pokémon inicial':''}"><div class="card-topline"><span>#${String(p.id).padStart(3,'0')}</span>${i===(battle?view.active:lead)?`<span class="lead-badge">${battle?'EN CAMPO':'↗ INICIAL'}</span>`:LEGENDS.includes(p.id)?'<span class="legend-mark" title="Legendario o mítico">✦</span>':''}</div><img src="${sprite(p)}" alt="" width="64" height="64"><h3>${esc(p.name)}</h3><div class="card-level">Nivel ${p.level}${p.status?` · ${p.status.toUpperCase()}`:''}</div><div class="types">${badges(p)}</div>${battle?`<div class="card-health">${p.hp===0?'Debilitado':`${p.hp} / ${p.maxHp} PS`}</div>`:''}<div class="card-bottom"><span>Ver ficha</span><span>↗</span></div></button>`).join('');
 $('team-note-text').textContent=battle?busy?'El turno está en marcha.':'Revisa tu equipo para decidir tu próximo movimiento.':'Tu equipo está listo. Tú decides cuándo empezar.';
}
function renderRed(){
 const roster=view?.red??redTeam();$('red-preview').innerHTML=roster.map(p=>`<img class="${p.hp===0?'fainted':''}" src="${sprite(p)}" width="64" height="64" alt="${esc(p.name)}, nivel ${p.level}${p.hp===0?', debilitado':''}" title="${esc(p.name)} · Nv. ${p.level}">`).join('');
 $('rival-status').textContent=battle?(view.over==='win'?'HAS CONQUISTADO LA CIMA':view.over?'COMBATE TERMINADO':`TURNO ${view.turn} · ${view.red.filter(p=>p.hp>0).length} POKÉMON RESTANTES`):'ESPERANDO TU DESAFÍO';
}
function renderExplore(){
 $('map').hidden=false;$('map-red').hidden=false;document.querySelector('.map-caption').hidden=false;$('battle-scene').hidden=true;
 $('phase-label').innerHTML='<span class="status-dot"></span> EXPLORACIÓN';
 $('game-controls').innerHTML=`<div class="control-message"><strong>Todo empieza con un “…”</strong><p>Elige tu Pokémon inicial y habla con Red.<br>El combate comienza cuando tú estés listo.</p></div><button class="primary-button" data-action="talk">Hablar con Red <span>→</span></button>`;
 renderTeam();renderRed();
}
function showDetail(i){
 const p=(view?.player??team)[i];if(!p)return;
 const names={hp:'PS',atk:'Ataque',def:'Defensa',spa:'At. especial',spd:'Def. especial',spe:'Velocidad'};
 const rarity=LEGENDS.includes(p.id)?'Legendario / mítico':RARE.includes(p.id)?'Poco común':'Común';
 openModal(`<div class="modal-kicker">TU EQUIPO · ${esc(rarity.toUpperCase())}</div><div class="detail-top"><img src="${sprite(p)}" width="112" height="112" alt="${esc(p.name)}"><div><h2 id="modal-title" class="modal-title">${esc(p.name)}</h2><div class="detail-level">#${String(p.id).padStart(3,'0')} · Nivel ${p.level} · ${p.hp} / ${p.maxHp} PS</div><div class="types">${badges(p)}</div></div></div><div class="stat-grid">${Object.entries(p.stats).map(([k,v])=>`<div>${names[k]}<strong>${v}</strong></div>`).join('')}</div><h3 class="detail-subtitle">MOVIMIENTOS</h3>${p.moves.map(m=>`<div class="detail-move"><span>${m.name}<span class="type-badge type-${m.type}">${TYPE_NAMES[m.type]}</span></span><span>${m.category==='status'?'Estado':m.fixed?'Daño fijo':`Pot. ${m.flail?'variable':m.power}`} · PP ${m.ppLeft}/${m.pp}</span></div>`).join('')}<div class="button-row">${!battle?`<button class="primary-button" data-lead="${i}" ${i===lead?'disabled':''}>${i===lead?'Es tu Pokémon inicial':'Elegir como inicial'} <span>↗</span></button>`:!busy&&!battle.over&&p.hp>0&&i!==battle.active?`<button class="primary-button" data-switch="${i}">Enviar al combate <span>→</span></button>`:''}<button class="secondary-button" data-action="close">Volver</button></div>`);
}
function talk(){
 if(battle)return;tone(440);
 openModal('<div class="modal-kicker">MONTE PLATEADO · RED</div><h2 id="modal-title" class="modal-title">La leyenda te mira.</h2><div class="dialogue">…</div><p class="dialogue-caption">Red ajusta su gorra. Parece que ha estado esperando este momento.<br><br>¿Estás listo para desafiarlo con tu equipo de hoy?</p><div class="button-row"><button class="primary-button" data-action="start">Aceptar el reto <span>→</span></button><button class="secondary-button" data-action="close">Seguir preparando mi equipo</button></div>');
}
function begin(){
 if(battle)return;refreshDay();closeModal();battle=new Battle(team,lead);battleDay=day;view=battle.snapshot();menu='main';busy=false;log=[`Reto del ${battleDay}. Red envía a Pikachu. ¡Adelante, ${battle.ally.name}!`];
 const r=numbers();record[day]={attempts:r.attempts+1,wins:r.wins};saveRecord();
 $('map').hidden=true;$('map-red').hidden=true;document.querySelector('.map-caption').hidden=true;$('battle-scene').hidden=false;
 $('phase-label').innerHTML='<span class="status-dot"></span> COMBATE';renderBattle();renderControls(log[0]);renderTeam();renderRed();
 [392,494,587,784].forEach((f,i)=>tone(f,.17,i*.12));
}
function hud(p,side){
 const fraction=p.hp/p.maxHp,roster=side==='player'?view.player:view.red;
 return `<div class="battle-hud ${side==='player'?'ally':'enemy'}-hud"><div class="hud-name"><span>${p.status?`<span class="status-badge">${p.status.toUpperCase()}</span>`:''}${esc(p.name)}</span><span class="hud-level">Nv. ${p.level}</span></div><div class="hud-hp-line"><span class="hp-label">PS</span><span class="hp-track"><span class="hp-fill ${fraction<=.2?'low':fraction<=.5?'medium':''}" style="width:${fraction*100}%"></span></span></div><div class="hp-numbers">${side==='player'?`${p.hp} / ${p.maxHp}`:`${Math.ceil(fraction*100)} %`}</div><div class="battle-balls">${roster.map(p=>`<span class="tiny-ball ${p.hp===0?'empty':''}"></span>`).join('')}</div></div>`;
}
function renderBattle(event={}){
 const p=view.player[view.active],r=view.red[view.enemy];
 $('battle-scene').innerHTML=`<div class="battle-platform enemy-platform"></div><div class="battle-platform ally-platform"></div><img class="battle-sprite enemy-sprite ${event.attack==='red'?'attack-red':''} ${event.hit==='red'?'hit':''} ${event.heal==='red'?'heal':''}" src="${sprite(r)}" alt="${esc(r.name)} de Red" style="opacity:${r.hp===0?.18:1}">${hud(r,'red')}<img class="battle-sprite ally-sprite ${event.attack==='player'?'attack-player':''} ${event.hit==='player'?'hit':''} ${event.heal==='player'?'heal':''}" src="${sprite(p,'back')}" alt="Tu ${esc(p.name)}" style="opacity:${p.hp===0?.18:1}">${hud(p,'player')}`;
}
function renderControls(message){
 if(!battle)return;const p=view.player[view.active];
 const text=message??(battle.forced?'Elige un Pokémon para seguir luchando.':`¿Qué debería hacer ${p.name}?`);
 let controls='';
 if(busy){controls='<span class="battle-legend">Resolviendo el turno<span aria-hidden="true"> …</span></span>';}
 else if(battle.over){controls=`<div class="battle-action-row"><button data-action="return">Volver a la cima ↗</button><button data-action="result">Resultado</button><button data-action="log">Registro</button></div>`;}
 else if(menu==='moves'){
  const available=p.moves.some(m=>m.ppLeft>0);
  controls=`<div class="move-grid">${available?p.moves.map((m,i)=>`<button class="move-button" data-move="${i}" ${!m.ppLeft?'disabled':''}><span class="move-main">${m.name}<span class="type-badge type-${m.type}">${TYPE_NAMES[m.type]}</span></span><span class="move-sub"><span>${m.category==='status'?'Estado':m.fixed?'Daño fijo':`Potencia ${m.flail?'variable':m.power}`}</span><span>PP ${m.ppLeft}/${m.pp}</span></span></button>`).join(''):'<button class="move-button" data-move="-1"><span class="move-main">Forcejeo</span><span class="move-sub">Sin PP · Daño con retroceso</span></button>'}</div><div class="battle-controls-footer"><button data-action="main">← Volver</button><span>Los movimientos usan categorías de la generación III</span></div>`;
 }else if(menu==='team'||battle.forced){
  controls=`<div class="switch-grid">${view.player.map((p,i)=>`<button class="switch-button" data-switch="${i}" ${p.hp===0||i===view.active?'disabled':''}><img src="${sprite(p)}" alt=""><span>${esc(p.name)}<small>${p.hp===0?'Debilitado':`${p.hp}/${p.maxHp} PS`}</small></span></button>`).join('')}</div>${!battle.forced?'<div class="battle-controls-footer"><button data-action="main">← Volver</button><span>Cambiar consume tu turno</span></div>':''}`;
 }else{
  controls=`<div class="battle-action-row"><button data-action="moves">Luchar <span>↗</span></button><button data-action="team">Equipo</button><button data-action="bag" ${battle.potions===0||p.hp===p.maxHp?'disabled':''}>Mochila · ${battle.potions}</button></div><div class="battle-controls-footer"><button data-action="retreat">Retirarse</button><button class="log-button" data-action="log">Ver registro ↗</button></div>`;
 }
 $('game-controls').innerHTML=`<div class="battle-controls"><p class="battle-message" role="status" aria-live="polite">${esc(text)}</p>${controls}</div>`;
}
async function play(action){
 if(!battle||busy||battle.over)return;closeModal();const events=battle.choose(action);if(!events.length)return;
 busy=true;menu='main';renderControls('El turno está en marcha…');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const event of events){view=event.state;log.push(event.text);renderBattle(event);renderControls(event.text);renderTeam();renderRed();if(event.attack)tone(event.attack==='player'?523:330,.12);if(event.faint)tone(196,.25);await delay(reduce?100:event.attack?450:event.faint?600:380);}
 busy=false;view=battle.snapshot();renderBattle();renderControls(events.at(-1).text);renderTeam();renderRed();
 if(battle.over){complete();await delay(250);showResult();}
}
function complete(){if(battle.over==='win'){const r=numbers(battleDay);record[battleDay]={attempts:r.attempts,wins:r.wins+1};saveRecord();[523,659,784,1046].forEach((f,i)=>tone(f,.22,i*.15));}}
function showResult(){
 if(!battle?.over)return;
 const won=battle.over==='win',draw=battle.over==='draw';
 openModal(`<div class="modal-kicker">RETO DEL ${battleDay} · ${view.turn} TURNOS</div><div class="result-badge" aria-hidden="true">${won?'⚑':draw?'◇':'↗'}</div><h2 id="modal-title" class="modal-title">${won?'La cima es tuya.':draw?'A la par de la leyenda.':'La leyenda sigue en pie.'}</h2><p class="modal-copy">${won?'Seis compañeros. Una victoria que ya forma parte de tu historia. Mañana, un nuevo equipo y otro desafío.':'Todavía puedes conquistar el reto de hoy. Revisa los movimientos de tu equipo y prueba otra estrategia.'}</p><div class="result-mons">${view.player.map(p=>`<img src="${sprite(p)}" alt="${esc(p.name)}" class="${p.hp===0?'is-fainted':''}">`).join('')}</div><div class="button-row"><button class="primary-button" data-action="return">Volver a la cima <span>→</span></button><button class="secondary-button" data-action="share">Copiar resultado</button></div>`);
}
function backToSummit(){closeModal();battle=null;view=null;busy=false;menu='main';refreshDay();team=dailyTeam(day);renderExplore();}
function showHelp(){openModal('<div class="modal-kicker">ANTES DE SUBIR A LA CIMA</div><h2 id="modal-title" class="modal-title">Tu reto, a tu ritmo.</h2><div class="modal-copy"><p><strong>1. Conoce a tu equipo.</strong> Toca sus fichas para ver estadísticas y movimientos. Elige quién saldrá primero.</p><p><strong>2. Habla con Red.</strong> Toca a Red en el mapa o el botón “Hablar con Red”. Después, acepta el reto.</p><p><strong>3. Decide cada turno.</strong> Ataca, cambia de Pokémon o usa una de tus dos Máximas Pociones. Cambiar o curar consume un turno; elegir un sustituto cuando uno cae es gratis.</p><p>Gana quien conserve algún Pokémon en pie. Puedes repetir el combate con el mismo equipo. Tu equipo se renueva a las <strong>00:00 UTC</strong>, al mismo tiempo para todos.</p><p>Esta es una recreación web con reglas simplificadas de la generación III: tipos, estadísticas, PP, estados y prioridad. No incluye habilidades, objetos equipados ni todos los efectos de los juegos originales.</p></div><div class="button-row"><button class="primary-button" data-action="close">Entendido <span>↗</span></button></div>');}
function showRates(){openModal('<div class="modal-kicker">EL AZAR TAMBIÉN JUEGA</div><h2 id="modal-title" class="modal-title">Un equipo distinto cada día.</h2><div class="modal-copy"><p>Los <strong>151 Pokémon de Kanto</strong> pueden aparecer. Cada una de las seis plazas sortea una categoría y después una especie, sin repetir Pokémon.</p></div><div class="rate-row"><span>Comunes</span><strong>74 %</strong></div><div class="rate-row"><span>Poco comunes</span><strong>24 %</strong></div><div class="rate-row legend"><span>Legendarios y Mew ✦</span><strong>2 %</strong></div><div class="modal-copy" style="margin-top:20px"><p>Porcentajes <strong>por plaza</strong>. La categoría especial contiene a Articuno, Zapdos, Moltres, Mewtwo y Mew. La probabilidad de obtener al menos uno en las seis plazas es aproximadamente del <strong>11,4 %</strong>.</p><p>Tu equipo tiene niveles <strong>84–88</strong>, frente a los <strong>80–88</strong> de Red. El nivel está equilibrado; la fuerza de las especies y los tipos también influye en la dificultad.</p><p>El sorteo depende de la fecha UTC: todos reciben el mismo reto. Recargar la página conserva el equipo del día. Los resultados se guardan en este navegador.</p></div>');}
function showCredits(){openModal('<div class="modal-kicker">HECHO POR FANS, PARA FANS</div><h2 id="modal-title" class="modal-title">Créditos.</h2><div class="modal-copy"><p>Pokémon y sus personajes pertenecen a Nintendo, Game Freak y Creatures. Proyecto de fans independiente, sin afiliación oficial.</p><p>Datos y sprites de Rojo Fuego / Verde Hoja: <a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a> y su <a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener">repositorio de sprites</a>. Mapa, interfaz y sonidos creados para Daily Red.</p><p>Tipografías DM Sans y Press Start 2P, disponibles con licencia SIL Open Font License.</p><p>Esta web es una recreación del combate. La ROM adjunta no se modifica, se ejecuta ni se distribuye.</p></div>');}
$('help-button').onclick=showHelp;$('rates-button').onclick=showRates;$('credits-button').onclick=showCredits;$('map-red').onclick=talk;
document.addEventListener('click',async e=>{
 const button=e.target.closest('button');if(!button||button.disabled)return;
 if(button.dataset.detail!==undefined){showDetail(Number(button.dataset.detail));return;}
 if(button.dataset.lead!==undefined){lead=Number(button.dataset.lead);closeModal();renderTeam();toast(`${team[lead].name} saldrá primero.`);return;}
 if(button.dataset.move!==undefined){await play({kind:'move',index:Number(button.dataset.move)});return;}
 if(button.dataset.switch!==undefined){await play({kind:'switch',index:Number(button.dataset.switch)});return;}
 const action=button.dataset.action;
 if(action==='talk')talk();else if(action==='close')closeModal();else if(action==='start')begin();
 else if(['moves','team','main'].includes(action)){if(!battle||busy)return;menu=action;renderControls();}
 else if(action==='bag'){openModal(`<div class="modal-kicker">TU MOCHILA · ${battle.potions} DISPONIBLES</div><h2 id="modal-title" class="modal-title">Máxima Poción.</h2><p class="modal-copy">Restaura todos los PS de ${esc(battle.ally.name)}. Usar la poción consume tu turno y Red podrá atacar. No cura los problemas de estado.</p><div class="button-row"><button class="primary-button" data-action="potion">Usar poción <span>→</span></button><button class="secondary-button" data-action="close">Volver</button></div>`);}
 else if(action==='potion')await play({kind:'potion'});
 else if(action==='return')backToSummit();else if(action==='result')showResult();
 else if(action==='retreat')openModal('<div class="modal-kicker">EL RETO PUEDE ESPERAR</div><h2 id="modal-title" class="modal-title">¿Volver a la cima?</h2><p class="modal-copy">Este intento terminará. Podrás volver a hablar con Red y empezar otro combate con tu equipo recuperado.</p><div class="button-row"><button class="primary-button" data-action="return">Retirarme</button><button class="secondary-button" data-action="close">Seguir luchando</button></div>');
 else if(action==='log')openModal(`<div class="modal-kicker">RETO DEL ${battleDay}</div><h2 id="modal-title" class="modal-title">Registro del combate.</h2><div class="battle-log">${log.map(text=>`<p>${esc(text)}</p>`).join('')}</div>`);
 else if(action==='share'){
  const result=`Daily Red · ${battleDay}\n${battle.over==='win'?'⚑ Victoria':battle.over==='draw'?'◇ Empate':'↗ Sigue el reto'} en ${battle.turn} turnos\n${battle.player.map(p=>`${p.hp>0?'●':'○'} ${POKEMON.find(x=>x.id===p.id).name}`).join(' · ')}\n${location.href.split('#')[0]}`;
  try{await navigator.clipboard.writeText(result);toast('Resultado copiado.');}catch{openModal(`<h2 id="modal-title" class="modal-title">Tu resultado.</h2><textarea readonly style="width:100%;height:150px;padding:12px" aria-label="Resultado para copiar">${esc(result)}</textarea>`);}
 }
});
function refreshDay(){const next=dayKey();if(next!==day&&!battle){day=next;team=dailyTeam(day);lead=0;renderExplore();renderRecord();toast('Ha llegado un nuevo día. Tu próximo equipo está listo.');}}
function updateClock(){
 const now=new Date(),next=new Date(`${dayKey(now)}T00:00:00Z`);next.setUTCDate(next.getUTCDate()+1);
 const seconds=Math.max(0,Math.floor((next-now)/1000)),hh=String(Math.floor(seconds/3600)).padStart(2,'0'),mm=String(Math.floor(seconds%3600/60)).padStart(2,'0'),ss=String(seconds%60).padStart(2,'0');
 $('countdown').textContent=`${hh}:${mm}:${ss}`;
 const formatted=new Intl.DateTimeFormat('es',{day:'numeric',month:'long',timeZone:'UTC'}).format(now);$('today-label').textContent=formatted[0].toUpperCase()+formatted.slice(1)+` '${String(now.getUTCFullYear()).slice(-2)}`;
 refreshDay();
}
drawMap($('map'));renderExplore();renderRecord();updateClock();setInterval(updateClock,1000);
