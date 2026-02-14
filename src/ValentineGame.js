import { useState, useEffect, useRef, useCallback } from "react";

const PX = 4;

const ENEMY_ABILITIES = {
  bite:      { name:"Savage Bite",    mult:1.0,  emoji:"🦷", msg:"bites savagely",           weapon:"fangs" },
  scratch:   { name:"Claw Swipe",     mult:0.85, emoji:"🐾", msg:"swipes with claws",        weapon:"claws" },
  poison:    { name:"Venom Spit",     mult:0.7,  emoji:"☠️", msg:"spits deadly venom",       weapon:"venom glands", dot:{turns:3,pct:0.06} },
  freeze:    { name:"Frost Blast",    mult:0.9,  emoji:"🥶", msg:"blasts freezing cold",     weapon:"ice staff", debuff:{type:"slow",turns:2} },
  chill:     { name:"Deep Chill",     mult:0.6,  emoji:"🧊", msg:"chills to the bone",       weapon:"frost orb", debuff:{type:"slow",turns:3} },
  burn:      { name:"Fire Breath",    mult:1.3,  emoji:"🔥", msg:"breathes scorching flames", weapon:"fire maw" },
  drain:     { name:"Life Drain",     mult:0.8,  emoji:"🩸", msg:"drains life force",        weapon:"soul siphon", healPct:0.5 },
  roar:      { name:"Terrifying Roar",mult:0.4,  emoji:"😱", msg:"roars in terror",          weapon:"dread aura", debuff:{type:"fear",turns:2} },
  eruption:  { name:"Eruption",       mult:1.6,  emoji:"🌋", msg:"erupts with fury",         weapon:"magma core", cd:3 },
  blizzard:  { name:"Blizzard",       mult:1.4,  emoji:"❄️", msg:"summons a blizzard",       weapon:"storm crystal", cd:3 },
  voidstrike:{ name:"Void Strike",    mult:1.5,  emoji:"🕳️", msg:"strikes from the void",   weapon:"void blade", ignoresDef:true },
  darkslash: { name:"Dark Slash",     mult:1.1,  emoji:"⚔️", msg:"slashes with dark steel",  weapon:"cursed sword" },
};

const LEVELS = [
  { name:"The Enchanted Forest", bg:"#1a0a2e", ground:"#2d5a27", desc:"Dark creatures lurk in the shadows...", extraAtk:0.15,
    minions:[
      { name:"Shadow Imp",  hp:45,  atk:14, def:2, color:"#6b3fa0", reward:22, abilities:["bite","scratch"],        weaponName:"Rusty Dagger" },
      { name:"Dark Sprite", hp:55,  atk:16, def:3, color:"#8b5cf6", reward:28, abilities:["bite","poison"],         weaponName:"Thorn Wand" },
    ],
    boss:{ name:"Forest Wraith", hp:130, atk:24, def:4, color:"#4c1d95", reward:65, abilities:["bite","drain","roar","scratch"], isBoss:true, weaponName:"Soul Scythe" },
    msg:"You feel a gentle warmth guiding you deeper... 💜",
  },
  { name:"The Frozen Caverns", bg:"#0c1445", ground:"#1e3a5f", desc:"Ice demons guard the passage ahead...", extraAtk:0.25,
    minions:[
      { name:"Frost Goblin", hp:70,  atk:20, def:4, color:"#38bdf8", reward:35, abilities:["bite","freeze","scratch"], weaponName:"Ice Shard" },
      { name:"Ice Phantom",  hp:80,  atk:22, def:5, color:"#0ea5e9", reward:40, abilities:["bite","freeze","chill"],   weaponName:"Frozen Staff" },
      { name:"Snow Fiend",   hp:85,  atk:24, def:5, color:"#0284c7", reward:45, abilities:["bite","freeze","scratch"], weaponName:"Glacier Axe" },
    ],
    boss:{ name:"Blizzard King", hp:220, atk:32, def:7, color:"#075985", reward:110, abilities:["bite","freeze","blizzard","roar","scratch"], isBoss:true, weaponName:"Frostbite Crown" },
    msg:"The ice melts before your courage... ❄️→💧",
  },
  { name:"The Volcanic Depths", bg:"#1a0000", ground:"#5c2d0e", desc:"Flames and fury await the brave...", extraAtk:0.35,
    minions:[
      { name:"Ember Demon",  hp:95,  atk:26, def:5, color:"#f97316", reward:50, abilities:["bite","burn","scratch"],      weaponName:"Flame Whip" },
      { name:"Magma Beast",  hp:105, atk:30, def:6, color:"#ea580c", reward:55, abilities:["bite","burn","eruption"],     weaponName:"Lava Hammer" },
      { name:"Flame Howler", hp:110, atk:32, def:6, color:"#dc2626", reward:60, abilities:["bite","burn","roar","scratch"], weaponName:"Inferno Horn" },
    ],
    boss:{ name:"Inferno Dragon", hp:320, atk:40, def:8, color:"#991b1b", reward:160, abilities:["bite","burn","eruption","drain","roar"], isBoss:true, weaponName:"Dragon's Maw" },
    msg:"Your love burns brighter than any flame... 🔥💕",
  },
  { name:"The Shadow Realm", bg:"#0a0a0a", ground:"#1f1f1f", desc:"Reality bends in this dark dimension...", extraAtk:0.45,
    minions:[
      { name:"Void Walker",     hp:120, atk:34, def:7, color:"#581c87", reward:65, abilities:["bite","drain","voidstrike"],          weaponName:"Phase Blade" },
      { name:"Nightmare Shade", hp:130, atk:36, def:7, color:"#3b0764", reward:70, abilities:["bite","poison","drain","darkslash"],  weaponName:"Dream Eater" },
      { name:"Dark Sentinel",   hp:140, atk:38, def:8, color:"#1e1b4b", reward:75, abilities:["bite","voidstrike","roar"],           weaponName:"Shadow Lance" },
      { name:"Abyss Lurker",    hp:150, atk:40, def:8, color:"#312e81", reward:80, abilities:["bite","drain","poison","voidstrike"], weaponName:"Abyss Tendril" },
    ],
    boss:{ name:"Shadow Overlord", hp:420, atk:48, def:10, color:"#020617", reward:220, abilities:["bite","drain","voidstrike","roar","blizzard","darkslash"], isBoss:true, weaponName:"Oblivion Edge" },
    msg:"Even darkness cannot dim your determination... 🌟",
  },
  { name:"The Dark Fortress", bg:"#0f0515", ground:"#2a1a3a", desc:"The final battle... Your love awaits! 💕", extraAtk:0.55,
    minions:[
      { name:"Doom Knight",   hp:160, atk:42, def:9,  color:"#7f1d1d", reward:90,  abilities:["bite","voidstrike","burn","roar","darkslash"],    weaponName:"Doom Greatsword" },
      { name:"Chaos Mage",    hp:150, atk:46, def:7,  color:"#701a75", reward:95,  abilities:["burn","freeze","drain","poison"],                weaponName:"Chaos Orb" },
      { name:"Death Bringer",  hp:170, atk:44, def:10, color:"#4a044e", reward:100, abilities:["voidstrike","drain","roar","eruption"],          weaponName:"Death's Scythe" },
      { name:"Soul Reaver",   hp:180, atk:48, def:9,  color:"#365314", reward:105, abilities:["drain","poison","voidstrike","darkslash"],       weaponName:"Soul Ripper" },
    ],
    boss:{ name:"Demon Lord Malachar", hp:580, atk:58, def:12, color:"#450a0a", reward:350, abilities:["bite","drain","voidstrike","eruption","blizzard","roar","darkslash"], isBoss:true, weaponName:"Hellfire Throne" },
    msg:"LOVE CONQUERS ALL! 💖💖💖",
  },
];

const SKILLS = [
  { id:0, name:"Love Strike",     base:20, emoji:"💕", lv:1, type:"atk", cd:0 },
  { id:1, name:"Heart Shield",    base:0,  emoji:"🛡️", lv:1, type:"heal", healPct:0.25, cd:3 },
  { id:2, name:"Cupid's Arrow",   base:32, emoji:"💘", lv:2, type:"atk", pierce:0.6, cd:1 },
  { id:3, name:"Rose Tempest",    base:42, emoji:"🌹", lv:3, type:"atk", dot:{turns:3,dmg:12}, cd:2 },
  { id:4, name:"Starlight Burst", base:58, emoji:"✨", lv:4, type:"atk", critBonus:0.25, cd:2 },
  { id:5, name:"Eternal Love",    base:85, emoji:"💖", lv:5, type:"atk", cd:4 },
];

function calcPlayerDmg(skill, pAtk, eDef, hasFear) {
  let base = skill.base + pAtk + Math.floor(Math.random()*10) - 4;
  let defReduce = skill.pierce ? eDef * (1 - skill.pierce) : eDef;
  let dmg = Math.max(5, Math.floor(base - defReduce * 0.3));
  let feared = false, crit = false;
  if (hasFear && Math.random() < 0.3) { dmg = Math.floor(dmg * 0.6); feared = true; }
  if (!feared && Math.random() < (0.12 + (skill.critBonus || 0))) { dmg = Math.floor(dmg * 1.75); crit = true; }
  return { dmg, crit, feared };
}

function calcEnemyDmg(ab, eAtk, pDef) {
  let base = eAtk * ab.mult + Math.floor(Math.random()*8) - 3;
  let red = ab.ignoresDef ? 0 : pDef * 0.35;
  return Math.max(3, Math.floor(base - red));
}

// ========== DRAWING ==========
function drawHero(ctx, x, y, sc, frame, flash) {
  const s = PX * sc;
  if (flash) ctx.globalAlpha = 0.4 + Math.sin(Date.now()*0.025)*0.4;
  const p = [
    [3,0,"#8B4513"],[4,0,"#8B4513"],[5,0,"#8B4513"],[6,0,"#8B4513"],
    [2,1,"#8B4513"],[3,1,"#8B4513"],[4,1,"#8B4513"],[5,1,"#8B4513"],[6,1,"#8B4513"],[7,1,"#8B4513"],
    [3,2,"#FDBCB4"],[4,2,"#FDBCB4"],[5,2,"#FDBCB4"],[6,2,"#FDBCB4"],[2,2,"#8B4513"],[7,2,"#8B4513"],
    [3,3,"#FDBCB4"],[4,3,"#2d1b00"],[5,3,"#FDBCB4"],[6,3,"#2d1b00"],
    [3,4,"#FDBCB4"],[4,4,"#FDBCB4"],[5,4,"#ff8fa3"],[6,4,"#FDBCB4"],
    [3,5,"#ec4899"],[4,5,"#ec4899"],[5,5,"#ec4899"],[6,5,"#ec4899"],
    [2,6,"#FDBCB4"],[3,6,"#db2777"],[4,6,"#ec4899"],[5,6,"#ec4899"],[6,6,"#db2777"],[7,6,"#FDBCB4"],
    [1,7,"#FDBCB4"],[3,7,"#db2777"],[4,7,"#f472b6"],[5,7,"#f472b6"],[6,7,"#db2777"],[8,7,"#FDBCB4"],
    [9,5,"#fbbf24"],[9,4,"#d4d4d8"],[9,3,"#d4d4d8"],[9,2,"#d4d4d8"],[9,1,"#fef08a"],
    [3,8,"#1e3a5f"],[4,8,"#1e3a5f"],[5,8,"#1e3a5f"],[6,8,"#1e3a5f"],
    [3,9,"#7c3aed"],[4,9,"#1e3a5f"],[5,9,"#1e3a5f"],[6,9,"#7c3aed"],
  ];
  if (frame%2===1) p.push([2,9,"#7c3aed"],[7,9,"#7c3aed"]);
  p.forEach(([px,py,c])=>{ ctx.fillStyle=c; ctx.fillRect(x+px*s,y+py*s,s,s); });
  ctx.globalAlpha=1;
}

function drawMonster(ctx, x, y, color, sc, frame, boss, flash) {
  const s = PX*sc, sz = boss?12:8;
  if(flash) ctx.globalAlpha=0.4+Math.sin(Date.now()*0.025)*0.4;
  const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
  const lt=`rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`;
  const dk=`rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})`;
  for(let i=1;i<sz-1;i++) for(let j=2;j<sz-1;j++){ctx.fillStyle=color;ctx.fillRect(x+i*s,y+j*s,s,s);}
  for(let i=0;i<sz;i++){ctx.fillStyle=dk;ctx.fillRect(x+i*s,y+s,s,s);ctx.fillRect(x+i*s,y+2*s,s,s);}
  ctx.fillStyle="#ff0000";ctx.fillRect(x+2*s,y+2*s,s,s);ctx.fillRect(x+(sz-3)*s,y+2*s,s,s);
  // White eye glint
  ctx.fillStyle="#ff6666";ctx.fillRect(x+2*s,y+2*s,s*0.5,s*0.5);ctx.fillRect(x+(sz-3)*s,y+2*s,s*0.5,s*0.5);
  ctx.fillStyle=lt;ctx.fillRect(x+s,y,s,s);ctx.fillRect(x+(sz-2)*s,y,s,s);
  if(boss){
    ctx.fillStyle="#ff0000";ctx.fillRect(x+s,y-s,s,s);ctx.fillRect(x+(sz-2)*s,y-s,s,s);
    ctx.fillStyle="#fbbf24";for(let i=3;i<sz-3;i++){ctx.fillRect(x+i*s,y,s,s);if(i%2===0)ctx.fillRect(x+i*s,y-s,s,s);}
  }
  ctx.fillStyle="#ff0000";for(let i=2;i<sz-2;i++)ctx.fillRect(x+i*s,y+(boss?5:4)*s,s,s);
  ctx.fillStyle="#fff";ctx.fillRect(x+3*s,y+(boss?5:4)*s,s,s);ctx.fillRect(x+(sz-4)*s,y+(boss?5:4)*s,s,s);
  // Weapon drawn left of monster
  ctx.fillStyle="#a0a0a0";
  if(boss){ctx.fillRect(x-2*s,y+3*s,s,s);ctx.fillRect(x-2*s,y+2*s,s,s);ctx.fillRect(x-2*s,y+s,s,s);ctx.fillRect(x-3*s,y+s,s*2,s);ctx.fillStyle="#8b0000";ctx.fillRect(x-2*s,y+4*s,s,s);}
  else{ctx.fillRect(x-s,y+3*s,s,s);ctx.fillRect(x-s,y+2*s,s,s);ctx.fillStyle="#666";ctx.fillRect(x-s,y+4*s,s,s);}
  const lo=frame%2;ctx.fillStyle=dk;
  ctx.fillRect(x+(1+lo)*s,y+(sz-1)*s,s,s);ctx.fillRect(x+(sz-2-lo)*s,y+(sz-1)*s,s,s);
  ctx.fillRect(x+(1+lo)*s,y+sz*s,s,s);ctx.fillRect(x+(sz-2-lo)*s,y+sz*s,s,s);
  ctx.globalAlpha=1;
}

function drawBoy(ctx,x,y,sc){
  const s=PX*sc;
  [[3,0,"#1a1a2e"],[4,0,"#1a1a2e"],[5,0,"#1a1a2e"],[6,0,"#1a1a2e"],
  [2,1,"#1a1a2e"],[3,1,"#1a1a2e"],[4,1,"#1a1a2e"],[5,1,"#1a1a2e"],[6,1,"#1a1a2e"],[7,1,"#1a1a2e"],
  [3,2,"#D2A679"],[4,2,"#D2A679"],[5,2,"#D2A679"],[6,2,"#D2A679"],
  [3,3,"#D2A679"],[4,3,"#2d1b00"],[5,3,"#D2A679"],[6,3,"#2d1b00"],
  [3,4,"#D2A679"],[4,4,"#D2A679"],[5,4,"#e88"],[6,4,"#D2A679"],
  [3,5,"#3b82f6"],[4,5,"#3b82f6"],[5,5,"#3b82f6"],[6,5,"#3b82f6"],
  [2,6,"#D2A679"],[3,6,"#2563eb"],[4,6,"#3b82f6"],[5,6,"#3b82f6"],[6,6,"#2563eb"],[7,6,"#D2A679"],
  [3,7,"#2563eb"],[4,7,"#ef4444"],[5,7,"#ef4444"],[6,7,"#2563eb"],
  [3,8,"#1e3a5f"],[4,8,"#1e3a5f"],[5,8,"#1e3a5f"],[6,8,"#1e3a5f"],
  [3,9,"#6b7280"],[6,9,"#6b7280"],
  [1,6,"#a8a29e"],[0,6,"#a8a29e"],[8,6,"#a8a29e"],[9,6,"#a8a29e"],
  ].forEach(([px,py,c])=>{ctx.fillStyle=c;ctx.fillRect(x+px*s,y+py*s,s,s);});
}

function drawHeart(ctx,x,y,sz,col="#ef4444"){
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y+sz/4);
  ctx.bezierCurveTo(x,y,x-sz/2,y,x-sz/2,y+sz/4);ctx.bezierCurveTo(x-sz/2,y+sz/2,x,y+sz*.7,x,y+sz);
  ctx.bezierCurveTo(x,y+sz*.7,x+sz/2,y+sz/2,x+sz/2,y+sz/4);ctx.bezierCurveTo(x+sz/2,y,x,y,x,y+sz/4);ctx.fill();
}

const HP = ({cur,max,color,label})=>(
  <div style={{width:"100%",marginBottom:3}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#e2e8f0",fontFamily:"monospace",marginBottom:1}}>
      <span>{label}</span><span style={{color:cur<max*0.25?"#ef4444":color}}>{Math.max(0,cur)}/{max}</span>
    </div>
    <div style={{background:"#1e293b",borderRadius:4,height:12,overflow:"hidden",border:"1px solid #334155"}}>
      <div style={{width:`${Math.max(0,(cur/max)*100)}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}aa)`,transition:"width 0.3s",borderRadius:3,boxShadow:`0 0 8px ${color}66`}}/>
    </div>
  </div>
);

// ========== MAIN COMPONENT ==========
export default function ValentineGame() {
  const [screen,setScreen]=useState("title");
  const [pName,setPName]=useState("");
  const [player,setPlayer]=useState(null);
  const [lvl,setLvl]=useState(0);
  const [eIdx,setEIdx]=useState(0);
  const [enemy,setEnemy]=useState(null);
  const [logs,setLogs]=useState([]);
  const [hitEnemy,setHitEnemy]=useState(false);
  const [hitHero,setHitHero]=useState(false);
  const [flash,setFlash]=useState(null);
  const [frame,setFrame]=useState(0);
  const [levelUp,setLevelUp]=useState(false);
  const [boss,setBoss]=useState(false);
  const [pots,setPots]=useState(2);
  const [cds,setCds]=useState({});
  const [pDots,setPDots]=useState([]);
  const [eDots,setEDots]=useState([]);
  const [pDebuffs,setPDebuffs]=useState([]);
  const [eCds,setECds]=useState({});
  const [over,setOver]=useState(false);
  const [particles,setParticles]=useState([]);
  const [turn,setTurn]=useState(0);
  const [floats,setFloats]=useState([]);
  const cvRef=useRef(null);
  const bRef=useRef(null);
  const logRef=useRef(null);
  const floatId=useRef(0);

  useEffect(()=>{const i=setInterval(()=>setFrame(f=>f+1),400);return()=>clearInterval(i);},[]);

  // Floating damage numbers decay
  useEffect(()=>{
    if(floats.length===0)return;
    const i=setInterval(()=>{
      setFloats(prev=>prev.map(f=>({...f,y:f.y-1.5,life:f.life-0.03})).filter(f=>f.life>0));
    },30);
    return()=>clearInterval(i);
  },[floats.length>0]);

  // Title canvas
  useEffect(()=>{
    if(screen!=="title"||!cvRef.current)return;
    const cv=cvRef.current,ctx=cv.getContext("2d");
    let f=0,run=true;
    const hts=Array.from({length:15},()=>({x:Math.random()*400,y:Math.random()*300,sp:.5+Math.random()*1.5,sz:8+Math.random()*16,ph:Math.random()*Math.PI*2}));
    const go=()=>{if(!run)return;ctx.fillStyle="#0f0520";ctx.fillRect(0,0,400,300);f++;
      hts.forEach(h=>{h.y-=h.sp;if(h.y<-20){h.y=310;h.x=Math.random()*400;}drawHeart(ctx,h.x,h.y,h.sz*(1+Math.sin(f*.05+h.ph)*.2),`rgba(236,72,153,${.3+Math.sin(f*.03+h.ph)*.2})`);});
      drawHero(ctx,100,120,3,Math.floor(f/20),false);drawBoy(ctx,240,120,3);
      drawHeart(ctx,190+Math.sin(f*.05)*5,150,16+Math.sin(f*.08)*3,"#ef4444");
      requestAnimationFrame(go);};
    requestAnimationFrame(go);return()=>{run=false;};
  },[screen]);

  // Battle canvas
  useEffect(()=>{
    if(screen!=="battle"||!bRef.current||!enemy)return;
    const cv=bRef.current,ctx=cv.getContext("2d"),lv=LEVELS[lvl];
    ctx.fillStyle=lv.bg;ctx.fillRect(0,0,400,200);
    ctx.fillStyle=lv.ground;ctx.fillRect(0,160,400,40);
    for(let i=0;i<400;i+=8)if(Math.random()>.7){ctx.fillStyle=lv.ground+"cc";ctx.fillRect(i,155+Math.random()*5,4,4);}
    for(let i=0;i<20;i++){ctx.fillStyle=`rgba(255,255,255,${.3+Math.sin(frame*.5+i)*.3})`;ctx.fillRect((i*47)%400,(i*23)%140,2,2);}
    const hx=40+(hitHero?(Math.random()-.5)*12:0),hy=110+(hitHero?(Math.random()-.5)*12:0);
    drawHero(ctx,hx,hy,3,frame,hitHero);
    const mx=(boss?255:275)+(hitEnemy?(Math.random()-.5)*14:0),my=(boss?90:105)+(hitEnemy?(Math.random()-.5)*14:0);
    drawMonster(ctx,mx,my,enemy.color,boss?3.5:3,frame,boss,hitEnemy);
    // Particles
    particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;
    // Status icons
    if(pDebuffs.length>0){ctx.font="14px serif";ctx.fillText(pDebuffs.map(d=>d.type==="slow"?"🥶":"😱").join(""),55,102);}
    if(pDots.length>0){ctx.font="12px serif";ctx.fillText("☠️".repeat(Math.min(pDots.length,3)),55,92);}
    if(eDots.length>0){ctx.font="12px serif";ctx.fillText("🩸".repeat(Math.min(eDots.length,3)),boss?275:295,boss?83:98);}
    // Weapon label under monster
    if(enemy.weaponName){
      ctx.font="bold 9px monospace";ctx.fillStyle="#fbbf2488";ctx.textAlign="center";
      ctx.fillText("⚔️ "+enemy.weaponName,boss?290:310,boss?160:165);ctx.textAlign="start";
    }
    // Floating damage numbers
    floats.forEach(f=>{
      ctx.globalAlpha=Math.max(0,f.life);
      ctx.font=`bold ${f.size}px monospace`;
      ctx.fillStyle=f.color;
      ctx.strokeStyle="#000";ctx.lineWidth=2;
      ctx.strokeText(f.text,f.x,f.y);
      ctx.fillText(f.text,f.x,f.y);
    });
    ctx.globalAlpha=1;
  },[screen,enemy,frame,hitEnemy,hitHero,particles,lvl,boss,pDebuffs,pDots,eDots,floats]);

  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[logs]);

  const addFloat=(x,y,text,color,size=16)=>{
    floatId.current++;
    setFloats(prev=>[...prev,{id:floatId.current,x:x+Math.random()*30-15,y,text,color,size,life:1.2}]);
  };

  const spark=(x,y,color,n=10)=>{
    const np=Array.from({length:n},()=>({x:x+Math.random()*40,y:y+Math.random()*40,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:1,color,size:3+Math.random()*4}));
    setParticles(np);
    const d=setInterval(()=>{setParticles(prev=>{const u=prev.map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,life:p.life-.05})).filter(p=>p.life>0);if(!u.length)clearInterval(d);return u;});},30);
  };

  const startGame=()=>{
    if(!pName.trim())return;
    setPlayer({hp:130,maxHp:130,atk:12,def:5,level:1,xp:0,xpNext:50});
    setLvl(0);setEIdx(0);setPots(2);setCds({});setPDots([]);setEDots([]);setPDebuffs([]);setECds({});setTurn(0);setFloats([]);
    setScreen("intro");
  };

  const beginBattle=useCallback((levelIdx,enemyIdx)=>{
    const lv=LEVELS[levelIdx];
    const all=[...lv.minions,lv.boss];
    const ed=all[enemyIdx];
    const isBoss=enemyIdx===all.length-1;
    setBoss(isBoss);
    setEnemy({...ed,currentHp:ed.hp});
    setLogs([`${isBoss?"👑 BOSS: ":"👹 "}${ed.name} appears!`,`⚔️ Armed with: ${ed.weaponName}`]);
    setOver(false);setPDots([]);setEDots([]);setPDebuffs([]);setECds({});setParticles([]);setTurn(0);setFloats([]);
    setScreen("battle");
  },[]);

  // === ENEMY ATTACK LOGIC ===
  const enemyAttack=(p,e,lg,pd,pdb,ec)=>{
    let nP={...p},nE={...e},nL=[...lg],nPD=[...pd],nPDB=[...pdb],nEC={...ec};
    const abs=e.abilities||["bite"];
    let avail=abs.filter(a=>{const ab=ENEMY_ABILITIES[a];return!(ab.cd&&nEC[a]>0);});
    if(!avail.length)avail=["bite"];
    const eHp=nE.currentHp/nE.hp, pHp=nP.hp/nP.maxHp;
    let pick;
    if(eHp<.3&&avail.includes("drain"))pick="drain";
    else if(pHp<.25){const big=avail.find(a=>ENEMY_ABILITIES[a].mult>=1.3);pick=big||avail[Math.floor(Math.random()*avail.length)];}
    else if(!nPDB.length&&avail.includes("roar")&&Math.random()<.35)pick="roar";
    else if(!nPD.length&&avail.includes("poison")&&Math.random()<.4)pick="poison";
    else{const w=avail.map(a=>ENEMY_ABILITIES[a].mult+.5);const t=w.reduce((s,v)=>s+v,0);let r=Math.random()*t;pick=avail[0];for(let i=0;i<avail.length;i++){r-=w[i];if(r<=0){pick=avail[i];break;}}}
    const ab=ENEMY_ABILITIES[pick];
    const isSlow=nPDB.some(d=>d.type==="slow");
    const dodge=Math.random()<(isSlow?.03:.09);
    if(dodge){
      nL.push(`✨ ${pName} dodges ${ab.emoji} ${ab.name}!`);
      addFloat(60,100,"DODGE!","#fbbf24",14);
    } else {
      const dmg=calcEnemyDmg(ab,nE.atk,nP.def);
      nP.hp=Math.max(0,nP.hp-dmg);
      nL.push(`${ab.emoji} ${nE.name} ${ab.msg}! ⚔️${nE.weaponName} → -${dmg} HP!`);
      addFloat(50,115,`-${dmg}`,"#ef4444",dmg>40?20:16);
      if(ab.healPct){const h=Math.floor(dmg*ab.healPct);nE.currentHp=Math.min(nE.hp,nE.currentHp+h);nL.push(`🩸 Drains ${h} HP back!`);addFloat(290,110,`+${h}`,"#4ade80",13);}
      if(ab.dot){nPD.push({turns:ab.dot.turns,pct:ab.dot.pct});nL.push(`☠️ ${pName} poisoned! (${ab.dot.turns}t)`);}
      if(ab.debuff){const ex=nPDB.find(d=>d.type===ab.debuff.type);if(ex)ex.turns=Math.max(ex.turns,ab.debuff.turns);else nPDB.push({type:ab.debuff.type,turns:ab.debuff.turns});nL.push(`${ab.debuff.type==="slow"?"🥶":"😱"} ${pName} is ${ab.debuff.type==="slow"?"frozen":"frightened"}!`);}
    }
    if(ab.cd)nEC[pick]=ab.cd;
    return{nP,nE,nL,nPD,nPDB,nEC};
  };

  const tickPoisons=(p,e,lg,pd,ed)=>{
    let nP={...p},nE={...e},nL=[...lg];
    let nPD=[];
    pd.forEach(d=>{const dmg=Math.max(2,Math.floor(nP.maxHp*d.pct));nP.hp=Math.max(0,nP.hp-dmg);nL.push(`☠️ Poison burns for ${dmg}!`);addFloat(70,130,`-${dmg}`,"#a855f7",12);if(d.turns>1)nPD.push({...d,turns:d.turns-1});});
    let nED=[];
    ed.forEach(d=>{const dmg=d.dmg;nE.currentHp=Math.max(0,nE.currentHp-dmg);nL.push(`🩸 Bleed hits ${nE.name} for ${dmg}!`);addFloat(300,130,`-${dmg}`,"#ef4444",12);if(d.turns>1)nED.push({...d,turns:d.turns-1});});
    return{nP,nE,nL,nPD,nED};
  };

  const handleWin=(p,e,lg)=>{
    setOver(true);
    let up={...p,xp:p.xp+e.reward};
    let nL=[...lg,`🎉 ${e.name} defeated! +${e.reward} XP`];
    if(up.xp>=up.xpNext){
      up={...up,level:up.level+1,xp:up.xp-up.xpNext,xpNext:Math.floor(up.xpNext*1.5),maxHp:up.maxHp+18,hp:up.maxHp+18,atk:up.atk+5,def:up.def+2};
      setLevelUp(true);setTimeout(()=>setLevelUp(false),2500);
      nL.push(`⭐ LEVEL UP → ${up.level}!`);
      const ns=SKILLS.find(s=>s.lv===up.level);if(ns)nL.push(`🆕 Unlocked: ${ns.emoji} ${ns.name}!`);
    }
    setPlayer(up);setLogs(nL.slice(-12));
    const lv=LEVELS[lvl],all=[...lv.minions,lv.boss];
    setTimeout(()=>{
      if(eIdx<all.length-1){const next=eIdx+1;setEIdx(next);beginBattle(lvl,next);}
      else if(lvl<LEVELS.length-1){setPots(pp=>Math.min(pp+1,4));const next=lvl+1;setLvl(next);setEIdx(0);setCds({});setScreen("intro");}
      else{setScreen("victory");}
    },1600);
  };

  const handleLoss=(p,lg)=>{
    setOver(true);setLogs([...lg,`💔 ${pName} has fallen...`].slice(-12));
    setTimeout(()=>setScreen("gameover"),1800);
  };

  // === MAIN SKILL HANDLER ===
  const doSkill=(skill,idx)=>{
    if(!enemy||enemy.currentHp<=0||over||!player||player.hp<=0)return;
    if(cds[idx]>0)return;
    const lvData=LEVELS[lvl];
    let p={...player},e={...enemy},lg=[...logs];
    let pd=[...pDots],ed=[...eDots],pdb=[...pDebuffs],ec={...eCds},pc={...cds};
    const hasFear=pdb.some(d=>d.type==="fear");
    setTurn(t=>t+1);

    // Tick player cooldowns
    Object.keys(pc).forEach(k=>{if(pc[k]>0)pc[k]--;});

    // PLAYER ACTION
    if(skill.type==="heal"){
      const amt=Math.floor(p.maxHp*skill.healPct);p.hp=Math.min(p.maxHp,p.hp+amt);
      lg.push(`${skill.emoji} ${pName} heals ${amt} HP!`);
      addFloat(60,100,`+${amt}`,"#4ade80",18);spark(60,120,"#4ade80",12);
      if(skill.cd)pc[idx]=skill.cd+1;
    } else {
      const res=calcPlayerDmg(skill,p.atk,e.def,hasFear);
      e.currentHp=Math.max(0,e.currentHp-res.dmg);
      let msg=`${skill.emoji} ${skill.name}!`;
      if(res.feared)msg+=" 😱Weakened!";if(res.crit)msg+=" 💥CRIT!";
      msg+=` → -${res.dmg} HP!`;lg.push(msg);
      addFloat(280,95,`-${res.dmg}`,res.crit?"#fbbf24":"#f472b6",res.crit?22:17);
      spark(300,120,res.crit?"#fbbf24":"#ec4899",res.crit?20:10);
      setHitEnemy(true);setTimeout(()=>setHitEnemy(false),300);
      if(skill.dot&&e.currentHp>0){ed.push({turns:skill.dot.turns,dmg:skill.dot.dmg+Math.floor(p.atk*.2)});lg.push(`🩸 ${e.name} is bleeding! (${skill.dot.turns}t)`);}
      if(skill.cd)pc[idx]=skill.cd+1;
    }
    setCds(pc);

    // Check enemy dead from player attack
    if(e.currentHp<=0){setEnemy(e);setPlayer(p);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleWin(p,e,lg);return;}

    // Enemy bleed tick
    const bt=tickPoisons({hp:999,maxHp:999},e,lg,[],ed);e=bt.nE;lg=bt.nL;ed=bt.nED;
    if(e.currentHp<=0){setEnemy(e);setPlayer(p);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleWin(p,e,lg);return;}

    // === ENEMY ATTACKS ===
    // Attack 1: guaranteed
    let r1=enemyAttack(p,e,lg,pd,pdb,ec);p=r1.nP;e=r1.nE;lg=r1.nL;pd=r1.nPD;pdb=r1.nPDB;ec=r1.nEC;
    setHitHero(true);setFlash("#ef444422");setTimeout(()=>{setHitHero(false);setFlash(null);},350);
    if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}

    // Attack 2: level-based extra attack
    if(Math.random()<lvData.extraAtk){
      lg.push(`⚡ ${e.name} attacks again!`);
      let r2=enemyAttack(p,e,lg,pd,pdb,ec);p=r2.nP;e=r2.nE;lg=r2.nL;pd=r2.nPD;pdb=r2.nPDB;ec=r2.nEC;
      if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}
    }

    // Attack 3: slow bonus
    if(pdb.some(d=>d.type==="slow")&&Math.random()<.35){
      lg.push(`🥶 Too slow! ${e.name} strikes again!`);
      let r3=enemyAttack(p,e,lg,pd,pdb,ec);p=r3.nP;e=r3.nE;lg=r3.nL;pd=r3.nPD;pdb=r3.nPDB;ec=r3.nEC;
      if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}
    }

    // Attack 4: boss guaranteed double
    if(boss&&e.currentHp>0&&p.hp>0){
      lg.push(`👑 ${e.name} unleashes a follow-up!`);
      let r4=enemyAttack(p,e,lg,pd,pdb,ec);p=r4.nP;e=r4.nE;lg=r4.nL;pd=r4.nPD;pdb=r4.nPDB;ec=r4.nEC;
      if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}
    }

    // Player poison tick
    if(pd.length&&p.hp>0){const pt=tickPoisons(p,e,lg,pd,[]);p=pt.nP;lg=pt.nL;pd=pt.nPD;
      if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}}

    // Tick debuffs & enemy cds
    pdb=pdb.map(d=>({...d,turns:d.turns-1})).filter(d=>d.turns>0);
    let nec={};Object.entries(ec).forEach(([k,v])=>{if(v>1)nec[k]=v-1;});

    setPlayer(p);setEnemy(e);setLogs(lg.slice(-12));setPDots(pd);setEDots(ed);setPDebuffs(pdb);setECds(nec);
  };

  const drinkPotion=()=>{
    if(pots<=0||over||!enemy||enemy.currentHp<=0||!player)return;
    setPots(pp=>pp-1);
    const lvData=LEVELS[lvl];
    const amt=Math.floor(player.maxHp*.35);
    let p={...player,hp:Math.min(player.maxHp,player.hp+amt)},e={...enemy};
    let lg=[...logs,`🧪 Potion! +${amt} HP! ⚠️ Enemies still attack!`];
    let pd=[...pDots],pdb=[...pDebuffs],ec={...eCds};
    addFloat(60,100,`+${amt}`,"#c084fc",18);spark(60,120,"#c084fc",15);

    // Enemy attacks during potion
    let r1=enemyAttack(p,e,lg,pd,pdb,ec);p=r1.nP;e=r1.nE;lg=r1.nL;pd=r1.nPD;pdb=r1.nPDB;ec=r1.nEC;
    setHitHero(true);setFlash("#ef444422");setTimeout(()=>{setHitHero(false);setFlash(null);},350);
    if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots([...eDots]);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}
    if(Math.random()<lvData.extraAtk+.1){
      lg.push(`⚡ ${e.name} takes advantage!`);
      let r2=enemyAttack(p,e,lg,pd,pdb,ec);p=r2.nP;e=r2.nE;lg=r2.nL;pd=r2.nPD;pdb=r2.nPDB;ec=r2.nEC;
      if(p.hp<=0){setPlayer(p);setEnemy(e);setPDots(pd);setEDots([...eDots]);setPDebuffs(pdb);setECds(ec);handleLoss(p,lg);return;}
    }
    setPlayer(p);setEnemy(e);setLogs(lg.slice(-12));setPDots(pd);setPDebuffs(pdb);setECds(ec);
  };

  const sty={maxWidth:460,margin:"0 auto",background:"linear-gradient(180deg,#0f0520,#1a0a2e)",borderRadius:16,overflow:"hidden",fontFamily:"'Courier New',monospace",color:"#e2e8f0",boxShadow:"0 0 40px rgba(236,72,153,.3)",position:"relative",border:"2px solid #ec489944"};

  // ========== SCREENS ==========
  if(screen==="title")return(
    <div style={sty}>
      <canvas ref={cvRef} width={400} height={300} style={{width:"100%",display:"block",imageRendering:"pixelated"}}/>
      <div style={{padding:"16px 24px 24px",textAlign:"center"}}>
        <h1 style={{fontSize:20,color:"#f472b6",margin:"0 0 4px",textShadow:"0 0 20px #ec489966"}}>💕 Valentine's Quest 💕</h1>
        <p style={{fontSize:11,color:"#a78bfa",margin:"0 0 14px"}}>Fight Through 5 Realms to Rescue Your Love</p>
        <input type="text" placeholder="Enter your name, warrior..." value={pName} onChange={e=>setPName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startGame()}
          style={{width:"75%",padding:"8px 12px",background:"#1e1b4b",border:"2px solid #7c3aed",borderRadius:8,color:"#e2e8f0",fontSize:13,fontFamily:"inherit",outline:"none",textAlign:"center",marginBottom:10}}/>
        <br/>
        <button onClick={startGame} style={{padding:"9px 28px",background:"linear-gradient(135deg,#ec4899,#8b5cf6)",border:"none",borderRadius:8,color:"white",fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:"bold",boxShadow:"0 0 20px #ec489966"}}>⚔️ BEGIN QUEST ⚔️</button>
        <div style={{fontSize:9,color:"#64748b",marginTop:10,lineHeight:1.6}}>⚠️ Enemies attack HARD with weapons, poison, drain & more!<br/>Bosses attack TWICE per turn! Damage is visible on screen!<br/>Higher levels = more frequent enemy attacks!</div>
      </div>
    </div>
  );

  if(screen==="intro"){
    const lv=LEVELS[lvl];
    return(
      <div style={sty}>
        <div style={{padding:"28px 24px",textAlign:"center",background:`radial-gradient(ellipse at center,${lv.bg}cc,${lv.bg})`,minHeight:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>CHAPTER {lvl+1} OF 5</div>
          <h2 style={{fontSize:22,color:"#f472b6",margin:"0 0 6px",textShadow:"0 0 20px #ec489966"}}>{lv.name}</h2>
          <p style={{fontSize:12,color:"#cbd5e1",margin:"0 0 14px",fontStyle:"italic"}}>{lv.desc}</p>
          <div style={{background:"#1e1b4b33",borderRadius:8,padding:14,marginBottom:14,width:"90%",textAlign:"left"}}>
            <div style={{fontSize:10,color:"#fbbf24",marginBottom:6}}>⚔️ {lv.minions.length} MINIONS + 1 BOSS | Extra Attack: {Math.floor(lv.extraAtk*100)}%</div>
            {lv.minions.map((m,i)=>(
              <div key={i} style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>
                👹 {m.name} — HP:{m.hp} ATK:{m.atk} DEF:{m.def}<br/>
                <span style={{fontSize:9,color:"#fbbf24"}}>⚔️ {m.weaponName}</span>{" "}
                <span style={{fontSize:9}}>{m.abilities.map(a=>ENEMY_ABILITIES[a]?.emoji||"").join(" ")}</span>
              </div>
            ))}
            <div style={{fontSize:11,color:"#ef4444",marginTop:6,fontWeight:"bold"}}>
              👑 {lv.boss.name} — HP:{lv.boss.hp} ATK:{lv.boss.atk} DEF:{lv.boss.def}
              <div style={{fontSize:9,color:"#fbbf24",fontWeight:"normal"}}>⚔️ {lv.boss.weaponName} | Attacks TWICE!</div>
              <div style={{fontSize:9,fontWeight:"normal"}}>{lv.boss.abilities.map(a=>ENEMY_ABILITIES[a]?.emoji||"").join(" ")}</div>
            </div>
          </div>
          {player&&<div style={{fontSize:10,color:"#a78bfa",marginBottom:10}}>{pName} — Lv.{player.level} | HP:{player.hp}/{player.maxHp} | ATK:{player.atk} | DEF:{player.def} | 🧪×{pots}</div>}
          {lvl>0&&<div style={{fontSize:11,color:"#4ade80",marginBottom:10,fontStyle:"italic"}}>{LEVELS[lvl-1].msg}</div>}
          <button onClick={()=>beginBattle(lvl,0)} style={{padding:"10px 28px",background:"linear-gradient(135deg,#ec4899,#8b5cf6)",border:"none",borderRadius:8,color:"white",fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:"bold",boxShadow:"0 0 15px #ec489955"}}>
            ⚔️ ENTER BATTLE ⚔️
          </button>
        </div>
      </div>
    );
  }

  if(screen==="battle"&&enemy&&player){
    const avail=SKILLS.filter(s=>s.lv<=player.level);
    return(
      <div style={sty}>
        {flash&&<div style={{position:"absolute",inset:0,background:flash,zIndex:10,pointerEvents:"none"}}/>}
        {levelUp&&<div style={{position:"absolute",top:"25%",left:"50%",transform:"translate(-50%,-50%)",zIndex:20,fontSize:24,color:"#fbbf24",fontWeight:"bold",textShadow:"0 0 30px #fbbf24",background:"#000000bb",padding:"8px 20px",borderRadius:8}}>⭐ LEVEL UP! ⭐</div>}
        <canvas ref={bRef} width={400} height={200} style={{width:"100%",display:"block",imageRendering:"pixelated"}}/>
        <div style={{padding:"6px 12px"}}>
          <div style={{display:"flex",gap:10,marginBottom:3}}>
            <div style={{flex:1}}><HP cur={player.hp} max={player.maxHp} color="#4ade80" label={`💖 ${pName} Lv.${player.level}`}/></div>
            <div style={{flex:1}}><HP cur={enemy.currentHp} max={enemy.hp} color="#ef4444" label={`${boss?"👑":"👹"} ${enemy.name}`}/></div>
          </div>
          <div style={{background:"#1e293b",borderRadius:3,height:6,overflow:"hidden",border:"1px solid #334155",marginBottom:2}}>
            <div style={{width:`${(player.xp/player.xpNext)*100}%`,height:"100%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width 0.3s",borderRadius:2}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#fbbf24",marginBottom:3}}>
            <span>XP: {player.xp}/{player.xpNext}</span>
            <span style={{color:"#94a3b8"}}>⚔️ {enemy.weaponName}</span>
          </div>
          {(pDebuffs.length>0||pDots.length>0||eDots.length>0)&&(
            <div style={{display:"flex",gap:4,fontSize:9,marginBottom:3,flexWrap:"wrap"}}>
              {pDebuffs.map((d,i)=><span key={`db${i}`} style={{color:"#f97316",background:"#f9731622",padding:"1px 4px",borderRadius:3}}>{d.type==="slow"?"🥶 frozen":"😱 fear"}({d.turns}t)</span>)}
              {pDots.map((d,i)=><span key={`pd${i}`} style={{color:"#a855f7",background:"#a855f722",padding:"1px 4px",borderRadius:3}}>☠️ poison({d.turns}t)</span>)}
              {eDots.map((d,i)=><span key={`ed${i}`} style={{color:"#ef4444",background:"#ef444422",padding:"1px 4px",borderRadius:3}}>🩸 bleed({d.turns}t)</span>)}
            </div>
          )}
          <div ref={logRef} style={{background:"#0f172a",borderRadius:5,padding:6,marginBottom:5,height:74,overflow:"auto",border:"1px solid #1e293b"}}>
            {logs.map((l,i)=>(
              <div key={i} style={{fontSize:9,color:i===logs.length-1?"#e2e8f0":"#64748b",marginBottom:1,lineHeight:1.35}}>{l}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:4}}>
            {avail.map((sk,i)=>{
              const onCd=cds[i]>0;const dis=over||onCd;
              return(<button key={i} onClick={()=>!dis&&doSkill(sk,i)} disabled={dis}
                style={{padding:"5px 2px",border:"none",borderRadius:5,color:"white",fontSize:9,fontFamily:"inherit",cursor:dis?"default":"pointer",opacity:dis?.35:1,
                  background:dis?"#334155":sk.type==="heal"?"linear-gradient(135deg,#059669,#10b981)":"linear-gradient(135deg,#7c3aed,#ec4899)"}}>
                <div>{sk.emoji} {sk.name}</div>
                <div style={{fontSize:8,opacity:.7}}>{sk.type==="heal"?`Heal ${Math.floor(sk.healPct*100)}%`:`${sk.base}+ dmg`}</div>
                {onCd&&<div style={{fontSize:8,color:"#fbbf24",fontWeight:"bold"}}>CD: {cds[i]}t</div>}
                {sk.cd>0&&!onCd&&<div style={{fontSize:7,opacity:.4}}>{sk.cd}t CD</div>}
              </button>);
            })}
          </div>
          <button onClick={drinkPotion} disabled={pots<=0||over}
            style={{width:"100%",padding:"5px",border:"none",borderRadius:5,color:"white",fontSize:10,fontFamily:"inherit",cursor:pots>0&&!over?"pointer":"default",opacity:pots<=0||over?.35:1,
              background:pots>0&&!over?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#334155"}}>
            🧪 Potion ({pots}) — Heal 35% ⚠️ Enemies STILL attack!
          </button>
          <div style={{fontSize:8,color:"#475569",textAlign:"center",marginTop:3}}>Turn {turn} | {LEVELS[lvl].name} | Enemy {eIdx+1}/{LEVELS[lvl].minions.length+1}</div>
        </div>
      </div>
    );
  }

  if(screen==="victory")return(
    <div style={sty}>
      <div style={{padding:"28px 24px",textAlign:"center",minHeight:430,background:"radial-gradient(ellipse at center,#1a0a2e,#0f0520)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:36,marginBottom:6}}>💖💕💖</div>
        <h2 style={{fontSize:20,color:"#f472b6",margin:"0 0 6px",textShadow:"0 0 30px #ec489988"}}>YOU DID IT!</h2>
        <p style={{fontSize:13,color:"#e2e8f0",margin:"0 0 2px"}}>{pName} has conquered all 5 realms!</p>
        {player&&<p style={{fontSize:11,color:"#a78bfa",margin:"0 0 14px"}}>Level {player.level} Warrior of Love</p>}
        <div style={{background:"#1e1b4b44",borderRadius:12,padding:18,marginBottom:14,maxWidth:300,border:"1px solid #7c3aed44"}}>
          <p style={{fontSize:13,color:"#fbbf24",margin:"0 0 6px"}}>✨ The chains shatter! ✨</p>
          <p style={{fontSize:12,color:"#e2e8f0",margin:"0 0 10px",lineHeight:1.6}}>Shukruth rushes into your arms. The darkness fades and the world blooms with color.</p>
          <div style={{fontSize:28,marginBottom:10}}>👩‍❤️‍👨</div>
          <p style={{fontSize:13,color:"#f472b6",margin:0,fontStyle:"italic",lineHeight:1.6}}>"You came for me through fire, ice, shadow & darkness... Happy Valentine's Day, {pName}. You're my greatest adventure. 💕"</p>
          <p style={{fontSize:11,color:"#a78bfa",marginTop:10}}>— With all my love, Shukruth 💌</p>
        </div>
        {player&&<div style={{fontSize:10,color:"#64748b",marginBottom:10}}>Final: Lv.{player.level} | ATK:{player.atk} | DEF:{player.def} | HP:{player.maxHp}</div>}
        <button onClick={()=>{setScreen("title");setPName("");}} style={{padding:"8px 20px",background:"linear-gradient(135deg,#ec4899,#8b5cf6)",border:"none",borderRadius:8,color:"white",fontSize:12,fontFamily:"inherit",cursor:"pointer",fontWeight:"bold"}}>💕 Play Again</button>
      </div>
    </div>
  );

  if(screen==="gameover")return(
    <div style={sty}>
      <div style={{padding:"36px 24px",textAlign:"center",minHeight:380,background:"radial-gradient(ellipse at center,#1a0000,#0a0a0a)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:36,marginBottom:10}}>💔</div>
        <h2 style={{fontSize:20,color:"#ef4444",margin:"0 0 6px"}}>Fallen in Battle...</h2>
        <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 16px"}}>But true love never gives up!</p>
        <p style={{fontSize:11,color:"#a78bfa",margin:"0 0 16px",fontStyle:"italic"}}>"Don't give up, {pName}... I'm waiting! 💕" — Shukruth</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setPlayer(pp=>({...pp,hp:pp.maxHp}));setPots(2);setCds({});setPDots([]);setPDebuffs([]);beginBattle(lvl,eIdx);}}
            style={{padding:"9px 20px",background:"linear-gradient(135deg,#ec4899,#8b5cf6)",border:"none",borderRadius:8,color:"white",fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:"bold"}}>💪 Retry</button>
          <button onClick={()=>{setScreen("title");setPName("");}}
            style={{padding:"9px 20px",background:"#334155",border:"none",borderRadius:8,color:"#94a3b8",fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>🏠 Menu</button>
        </div>
      </div>
    </div>
  );

  return null;
}