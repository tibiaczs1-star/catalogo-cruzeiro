const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const gate=document.querySelector('#experience-gate');
const modeButtons=[...document.querySelectorAll('[data-mode]')].filter(el=>el.tagName==='BUTTON');

function activateMode(mode,{closeGate=true,persist=true}={}){
  const safeMode=mode==='kids'?'kids':'adult';
  document.body.setAttribute('data-mode',safeMode);
  modeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===safeMode)));
  document.querySelector('#audience').value=safeMode==='kids'?'Kids / família':'Jovem / adulto';
  if(persist)localStorage.setItem('questfest-mode',safeMode);
  if(closeGate){gate.classList.add('closed');setTimeout(()=>gate.hidden=true,700)}
  document.querySelector('main').setAttribute('aria-label',safeMode==='kids'?'Experiência VR Kids':'Modo experiência jovem e adulto');
}
modeButtons.forEach(button=>button.addEventListener('click',()=>activateMode(button.dataset.mode)));
document.querySelector('[data-switch-mode]').addEventListener('click',()=>{
  const next=document.body.dataset.mode==='kids'?'adult':'kids';
  activateMode(next,{closeGate:false});
  document.querySelector('#topo').scrollIntoView({behavior:reduceMotion?'auto':'smooth'});
});
const savedMode=localStorage.getItem('questfest-mode');
if(savedMode)activateMode(savedMode,{closeGate:false,persist:false});

const worlds=[{theme:'zero',rgb:'22,104,255'},{theme:'beat',rgb:'255,63,187'},{theme:'dream',rgb:'19,215,255'}];
const videos=[...document.querySelectorAll('.adult-stage .world-video')];
const worldButtons=[...document.querySelectorAll('[data-world]')];
const progress=document.querySelector('.world-progress span');let activeWorld=0,worldTimer;
function restartProgress(){if(!progress)return;progress.style.animation='none';progress.offsetHeight;progress.style.animation=reduceMotion?'none':'progress 7s linear'}
function activateWorld(index,userInitiated=false){activeWorld=(index+worlds.length)%worlds.length;document.body.dataset.theme=worlds[activeWorld].theme;videos.forEach((video,i)=>{video.classList.toggle('active',i===activeWorld);if(i===activeWorld){const attempt=video.play();if(attempt)attempt.catch(()=>{})}else video.pause()});worldButtons.forEach((button,i)=>{button.classList.toggle('active',i===activeWorld);button.setAttribute('aria-pressed',String(i===activeWorld))});restartProgress();if(userInitiated)resetWorldTimer()}
function resetWorldTimer(){clearInterval(worldTimer);if(!reduceMotion)worldTimer=setInterval(()=>activateWorld(activeWorld+1),7000)}
worldButtons.forEach((button,i)=>button.addEventListener('click',()=>activateWorld(i,true)));resetWorldTimer();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearInterval(worldTimer);videos.forEach(video=>video.pause())}else{activateWorld(activeWorld);resetWorldTimer()}});

if(!reduceMotion){document.addEventListener('pointermove',event=>{const mx=event.clientX/innerWidth-.5,my=event.clientY/innerHeight-.5;document.documentElement.style.setProperty('--cursor-x',`${event.clientX}px`);document.documentElement.style.setProperty('--cursor-y',`${event.clientY}px`);document.documentElement.style.setProperty('--mx',mx);document.documentElement.style.setProperty('--my',my)});document.querySelectorAll('.tilt').forEach(card=>{card.addEventListener('pointermove',event=>{const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;card.style.transform=`rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-8px)`});card.addEventListener('pointerleave',()=>card.style.transform='')})}

const canvas=document.querySelector('#portal-canvas'),ctx=canvas.getContext('2d');let particles=[];
function sizeCanvas(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);particles=Array.from({length:innerWidth<700?24:60},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.7+.3,s:Math.random()*.3+.08}))}
function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);particles.forEach(p=>{p.y-=p.s;if(p.y<0)p.y=innerHeight;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(56,190,255,.5)';ctx.shadowColor='#1b8dff';ctx.shadowBlur=10;ctx.fill()});requestAnimationFrame(draw)}sizeCanvas();addEventListener('resize',sizeCanvas);if(!reduceMotion)requestAnimationFrame(draw);

const reveals=document.querySelectorAll('.section');const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('visible',entry.isIntersecting)),{threshold:.05});reveals.forEach(el=>revealObserver.observe(el));
const guests=document.querySelector('#guests'),guestOutput=document.querySelector('#guest-output');guests.addEventListener('input',()=>guestOutput.value=`${guests.value} pessoas`);
const contactModal=document.querySelector('#contact-modal');
document.querySelector('#event-form').addEventListener('submit',event=>{event.preventDefault();const type=document.querySelector('#event-type').value,audience=document.querySelector('#audience').value,total=guests.value;document.querySelector('#modal-summary').textContent=`${type} · ${audience} · ${total} participante(s)`;document.querySelector('#message-preview').value=`Olá! Quero consultar uma experiência QUESTFEST. Formato: ${type}. Público: ${audience}. Participantes: ${total}. Entendi que a estrutura tem 2 headsets e funciona com rodízio. Poderia informar disponibilidade e valor?`;contactModal.showModal()});
document.querySelectorAll('.modal-close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelector('#copy-message').addEventListener('click',async event=>{await navigator.clipboard.writeText(document.querySelector('#message-preview').value);event.currentTarget.textContent='MENSAGEM COPIADA ✓'});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!gate.hidden){gate.classList.add('closed');setTimeout(()=>gate.hidden=true,700)}});
activateWorld(0);
