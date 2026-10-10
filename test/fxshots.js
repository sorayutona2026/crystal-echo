require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:768,height:672}});
p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://' + __dirname + '/index.html');await p.waitForFunction(()=>window.__rpg&&__rpg.G.scene);
await p.evaluate(()=>{window.__manual=true;const c=document.getElementById('screen');c.style.cssText='position:fixed;left:0;top:0;width:768px;height:672px;z-index:99;border:0';const R=__rpg;R.newGame();for(let i=0;i<5;i++)R.step();R.G.script=null;R.G.narr=null;R.G.dialog=null;R.G.fadeLevel=0;R.G.fadeTarget=0;R.joinParty('kai');R.joinParty('zek');R.G.party.forEach(m=>{m.lv=15;m.exp=R.expAt(15);});R.healAll();});
const shots=[['world',12,10,['wolf','bee','gmage'],'fire',['zek','fire']],['cave',4,17,['skeleton','redslime','bat'],'ice',['zek','frost']],['tower1',8,10,['armor','specter'],'bolt',['zek','bolt']],['tower3',9,7,['garva'],'holy',['lina','holy']],['tower1',8,10,['guardian'],'meteor',['zek','meteor']]];
for(const [m,x,y,ids,name,[who,sk]] of shots){
 await p.evaluate(([m,x,y,ids,who,sk])=>{const R=__rpg;R.Field.enter(m,x,y);R.startBattle({ids});for(let i=0;i<200;i++)R.step();
   const B=R.B; const i=R.G.party.findIndex(q=>q.id===who); B.ready=[];B.menu=null; B.queue.push({side:'p',i,kind:'skill',id:sk,target:{side:'e',i:0}}); B.pb.forEach(pb=>pb.atb=0); B.enemies.forEach(e=>e.atb=-9999);
   for(let k=0;k<30;k++)R.step();},[m,x,y,ids,who,sk]);
 await p.evaluate(()=>__rpg.render()); await p.screenshot({path:`test-out/fx-${name}.png`});
 await p.evaluate(()=>{for(let k=0;k<12;k++)__rpg.step();__rpg.render();}); await p.screenshot({path:`test-out/fx-${name}2.png`});
 await p.evaluate(()=>{__rpg.G.scene=__rpg.Field;});
}
// death dissolve
await p.evaluate(()=>{const R=__rpg;R.startBattle({ids:['golem']});for(let i=0;i<200;i++)R.step();R.B.enemies[0].hp=0;R.B.enemies[0].alive=false;R.B.enemies[0].dying=1;R.B.enemies.forEach(e=>e.atb=-9999);R.B.pb.forEach(pb=>pb.atb=0);for(let i=0;i<14;i++)R.step();R.render();});
await p.screenshot({path:'test-out/fx-death.png'});
await b.close();})();
