require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:1000}});
p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://' + __dirname + '/index.html');await p.waitForFunction(()=>window.__rpg&&__rpg.G.scene);
await p.evaluate(()=>{window.__manual=true;const c=document.createElement('canvas');c.width=1200;c.height=1000;c.style.cssText='position:fixed;left:0;top:0;z-index:99;background:#3a4a3a';document.body.appendChild(c);const x=c.getContext('2d');x.imageSmoothingEnabled=false;
let X=10,Y=10,rowH=0;for(const k in ENEMY_ANIM){const f=ENEMY_ANIM[k].frames;const s=f[0].width>70?2:3;const w=f[0].width*s;if(X+w*2+20>1200){X=10;Y+=rowH+10;rowH=0;}x.drawImage(f[0],X,Y,w,f[0].height*s);x.drawImage(f[2],X+w+4,Y,w,f[2].height*s);X+=w*2+20;rowH=Math.max(rowH,f[0].height*s);}});
await p.screenshot({path:'test-out/esheet.png'});await b.close();})();
