require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const OUT = process.env.OUT || 'test-out/g';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:768,height:672}});
p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://' + __dirname + '/index.html');await p.waitForFunction(()=>window.__rpg&&__rpg.G.scene);
await p.evaluate(()=>{window.__manual=true;const c=document.getElementById('screen');c.style.cssText='position:fixed;left:0;top:0;width:768px;height:672px;z-index:99;border:0';});
const snap=async n=>{await p.evaluate(()=>__rpg.render());await p.screenshot({path:`${OUT}/${n}.png`,clip:{x:0,y:0,width:768,height:672}});};
await p.evaluate(()=>{for(let i=0;i<120;i++)__rpg.step();}); await snap('00-title');
await p.evaluate(()=>{const R=__rpg;R.newGame();for(let i=0;i<5;i++)R.step();R.G.script=null;R.G.narr=null;R.G.dialog=null;R.G.fadeLevel=0;R.G.fadeTarget=0;R.joinParty('kai');R.joinParty('zek');R.G.banner=null;});
const F=[['elm',12,9],['world',12,10],['world',20,24],['cave',4,17],['rosa',13,10],['pub',5,6],['tower1',8,10],['tower2',6,9],['tower3',9,7]];
for(const [m,x,y] of F){await p.evaluate(([m,x,y])=>{const R=__rpg;R.Field.enter(m,x,y,'down');R.G.banner=null;for(let i=0;i<40;i++)R.step();R.G.banner=null;},[m,x,y]);await snap('f-'+m+x);}
const Bt=[['world',12,10,['slime','bat','goblin']],['cave',4,17,['skeleton','redslime']],['tower1',8,10,['golem','darkmage']],['tower3',9,7,['garva']]];
for(const [m,x,y,ids] of Bt){await p.evaluate(([m,x,y,ids])=>{const R=__rpg;R.Field.enter(m,x,y);R.startBattle({ids});for(let i=0;i<260;i++)R.step();},[m,x,y,ids]);await snap('b-'+m);await p.evaluate(()=>{__rpg.G.scene=__rpg.Field;});}
await b.close();})();
