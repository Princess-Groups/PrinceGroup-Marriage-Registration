const { spawn } = require('child_process');
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9290;
const cp = spawn(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--remote-debugging-port='+PORT,'--user-data-dir='+process.env.TEMP+'/pcdp-diag','about:blank'], {stdio:'ignore'});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
  let list;
  for(let i=0;i<40;i++){ try{ const r=await fetch('http://localhost:'+PORT+'/json'); list=await r.json(); if(list.some(p=>p.type==='page')) break; }catch{} await sleep(300); }
  const page=list.find(p=>p.type==='page');
  const ws=new (require('ws'))(page.webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.on("open",r);setTimeout(()=>j(new Error("ws open timeout")),5000);});
  let id=0; const pend=new Map();
  ws.on('message',ev=>{ let m; try { m = JSON.parse(ev.data); } catch { return; }
    if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(m.error.message)):res(m.result);}
    else if(m.method==='Runtime.consoleAPICalled'){ const t=m.params.args.map(a=>a.value??a.description??'').join(' '); console.log('[console:'+m.params.type+']', t.slice(0,500)); }
    else if(m.method==='Runtime.exceptionThrown'){ console.log('[exception]', m.params.exceptionDetails.text, (m.params.exceptionDetails.exception?.description||'').slice(0,500)); }
  });
  const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method,params}));});
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Page.navigate',{url:'http://localhost:5178/admin/login'});
  await sleep(4000);
  const r=await send('Runtime.evaluate',{expression:`(()=>{ const h=document.querySelector('h1'); return JSON.stringify({ url:location.href, h1:h?h.innerText:null, hasForm:!!document.querySelector('form'), hasSpinner:!!document.querySelector('.animate-spin'), bodyLen:document.body.innerText.length, inputs:[...document.querySelectorAll('input')].map(i=>i.type) }); })()`, returnByValue:true});
  console.log('DIAG:', r.result.value); process.exit(0);
  ws.close(); cp.kill();
})().catch(e=>{console.error(e);cp.kill();process.exit(1);});
