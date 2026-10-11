import {seedRandom} from './engine.js';

const images=new Map(),renders=new WeakMap();
function loadImage(path){
 if(!images.has(path))images.set(path,new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=new URL(`../assets/overworld/${path}`,import.meta.url).href;}));
 return images.get(path);
}

// Native 16-pixel tiles and unmodified FireRed/HGSS sprite assets.
export async function drawMap(canvas,partnerId=25,dark=false){
 const generation=(renders.get(canvas)??0)+1;renders.set(canvas,generation);
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const rng=seedRandom('silver-summit-snow'),T=16;
 const palette=dark?{
  snow:'#829ba7',light:'#acbec7',white:'#c6d3da',shade:'#6e8b98',ice:'#8ea7b3',deep:'#587887',
  rock:'#354d5a',rockLight:'#496371',rockMid:'#405967',rockDark:'#253c49',rockEdge:'#1e3440',flake:'#e0e8ed'
 }:{
  snow:'#dce7e9',light:'#edf2f2',white:'#fbfcf7',shade:'#b6ced1',ice:'#c8dce0',deep:'#9fb9c0',
  rock:'#647a80',rockLight:'#899b9e',rockMid:'#728a8e',rockDark:'#4b646d',rockEdge:'#405962',flake:'#fffef8'
 };
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 function snowTile(x,y){
  rect(x,y,T,T,palette.snow);
  poly([[x,y+4],[x+4,y],[x+10,y],[x+6,y+4],[x+6,y+6],[x+2,y+10],[x,y+10]],palette.ice);
  poly([[x+8,y+3],[x+11,y],[x+16,y],[x+16,y+5],[x+13,y+9],[x+9,y+9],[x+6,y+6]],palette.light);
  poly([[x,y+14],[x+4,y+9],[x+8,y+9],[x+10,y+12],[x+8,y+16],[x,y+16]],palette.light);
  rect(x+5,y+7,2,2,palette.shade);rect(x+12,y+10,2,3,palette.ice);rect(x+14,y+9,2,2,palette.shade);
  rect(x+2,y+11,3,2,palette.white);rect(x+10,y+3,3,2,palette.white);
  if(rng()>.5){rect(x+2,y+4,2,1,palette.shade);rect(x+8,y+14,2,1,palette.snow);}
 }
 function cliff(x,y){
  rect(x,y,16,16,palette.rockDark);
  poly([[x,y+4],[x+3,y+1],[x+10,y+1],[x+15,y+3],[x+16,y+7],[x+15,y+12],[x+11,y+14],[x+3,y+14],[x,y+11]],palette.rock);
  poly([[x+2,y+5],[x+5,y+3],[x+8,y+4],[x+6,y+6],[x+4,y+9],[x+1,y+8]],palette.rockMid);
  poly([[x+11,y+6],[x+14,y+5],[x+15,y+9],[x+12,y+12],[x+10,y+10]],palette.rockDark);
  rect(x+3,y+13,7,1,palette.rockLight);rect(x+5,y+15,7,1,palette.rockEdge);
  rect(x+2,y,11,1,palette.light);rect(x+1,y+1,3,2,palette.white);
  rect(x+6,y+1,2,2,palette.ice);rect(x+10,y,4,2,palette.white);
  rect(x+3,y+6,1,2,palette.light);rect(x+7,y+9,1,1,palette.ice);
  if(rng()>.5)rect(x+12,y+11,1,2,palette.light);
 }
 function boulder(x,y){
  rect(x+2,y+12,19,3,palette.deep);
  poly([[x+4,y+2],[x+15,y],[x+21,y+5],[x+23,y+12],[x+17,y+15],[x+3,y+14],[x,y+9]],palette.rockMid);
  poly([[x+4,y+2],[x+15,y],[x+20,y+5],[x+15,y+9],[x+9,y+7],[x+4,y+10],[x+1,y+7]],palette.light);
  rect(x+6,y+2,8,2,palette.white);rect(x+16,y+8,3,4,palette.rockDark);rect(x+4,y+12,9,1,palette.rockLight);
 }
 function terrain(){
  for(let y=0;y<192;y+=T)for(let x=0;x<320;x+=T)snowTile(x,y);
  for(let row=0;row<4;row++){
   const start=[6,5,4,5][row],end=[14,15,16,15][row];
   for(let col=start;col<end;col++)cliff(col*T,row*T);
  }
  for(let row=4;row<12;row++)for(const col of [4,5,14,15])cliff(col*T,row*T);
  rect(100,65,120,89,palette.deep);rect(104,61,112,83,palette.rockEdge);
  for(let x=104;x<216;x+=T)cliff(x,137);
  rect(103,62,114,76,palette.shade);rect(106,61,108,74,palette.snow);
  rect(111,58,98,3,palette.light);rect(108,61,104,4,palette.light);
  rect(107,65,3,64,palette.light);rect(210,65,3,64,palette.ice);
  for(let i=0;i<100;i++){
   const x=111+Math.floor(rng()*98),y=67+Math.floor(rng()*66);
   rect(x,y,1+Math.floor(rng()*2),1,rng()>.5?palette.light:palette.ice);
  }
  rect(109,134,102,3,palette.light);rect(112,137,96,2,palette.white);
  rect(142,136,36,23,palette.rockEdge);rect(144,137,32,21,palette.rockMid);
  for(let y=138;y<158;y+=4){rect(144,y,32,2,palette.light);rect(145,y+2,30,1,palette.shade);rect(145,y+3,30,1,palette.rockDark);}
  [[28,34],[275,15],[278,93],[20,145],[275,164]].forEach(([x,y])=>boulder(x,y));
  for(const[x,y]of[[51,83],[285,61],[34,183]]){rect(x,y,7,1,palette.deep);rect(x+2,y-3,5,3,palette.light);rect(x+3,y-4,3,1,palette.white);}
  for(let y=166;y<188;y+=7){rect(155,y,2,1,palette.shade);rect(161,y+3,2,1,palette.shade);}
 }
 terrain();
 const roster=[{id:143,x:113,y:49},{id:131,x:175,y:49},{id:3,x:101,y:79},{id:6,x:187,y:79},{id:25,x:123,y:104},{id:9,x:164,y:104}];
 const [red,partner,...pokemon]=await Promise.all([loadImage('red.png'),loadImage(`pokemon/${partnerId}-up.png`),...roster.map(p=>loadImage(`pokemon/${p.id}-down.png`))]);
 if(renders.get(canvas)!==generation)return;
 terrain();
 function shadow(x,y,w=15){c.fillStyle=dark?'#243d5066':'#597f8650';c.fillRect(x,y,w,2);c.fillRect(x+2,y-1,w-4,1);}
 roster.forEach((p,i)=>{if(!pokemon[i])return;shadow(p.x+9,p.y+29);c.drawImage(pokemon[i],p.x,p.y,32,32);});
 if(red){
  shadow(152,103,16);c.drawImage(red,0,0,16,32,152,74,16,32);
  shadow(152,180,16);c.drawImage(red,16,0,16,32,152,151,16,32);
 }
 if(partner){shadow(178,179,14);c.drawImage(partner,170,151,32,32);}
 for(let i=0;i<42;i++){const x=Math.floor(rng()*320),y=Math.floor(rng()*192);rect(x,y,1,1,palette.flake);if(i%8===0){rect(x-1,y,3,1,palette.flake);rect(x,y-1,1,3,palette.flake);}}
}
