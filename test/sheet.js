require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:620}});
p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://' + __dirname + '/index.html');await p.waitForFunction(()=>window.__rpg&&__rpg.G.scene);
await p.evaluate(()=>{window.__manual=true;const c=document.createElement('canvas');c.width=880;c.height=600;c.style.cssText='position:fixed;left:0;top:0;z-index:99;background:#5a6a4a';document.body.appendChild(c);const x=c.getContext('2d');x.imageSmoothingEnabled=false;
const poses=['idle','walk','strike','cast','hurt','win','kneel','ko'];let y=0;for(const id of ['allen','lina','kai','zek']){poses.forEach((ps,i)=>{const im=SPR[id].hb[ps];x.drawImage(im,10+i*108,10+y*148,im.width*4,im.height*4);});y++;}});
await p.screenshot({path:'test-out/shots/sheet.png'});await b.close();})();
