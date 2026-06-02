(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const state = {
    screen: 'intro',
    selectedCharacter: null,
    game: 'pool',
    poolMode: 'Livre',
    chat: [
      { user: 'Rayxpx', text: 'Bar aberto. Escolha personagem e mesa.' },
      { user: 'Mesa', text: '10 jogadores por instância, sem dinheiro real nesta fatia.' }
    ],
    checkersSelected: null,
    chessSelected: null,
    pool: { balls: [], dragging: false, aim: null, power: 0 }
  };
  const characters = [
    ['Ribeirinho Neon','🎣','controle e calma'],['Motogirl CZS','🏍️','velocidade e blefe'],['Dama do Taco','🎱','sinuca precisa'],['Rei do Mercado','👑','xadrez agressivo'],['Guardião Juruá','🛶','defesa e leitura'],
    ['DJ do Bar','🎧','emotes e moral'],['Mecânico 307','🔧','virada no fim'],['Rainha Cacheada','💚','charme e estratégia'],['Velho Lendário','🃏','truques de mesa'],['Novato Sortudo','🍀','risco alto']
  ];
  const botNames = ['Naldo','Bia','Tainá','Ruan','Jéssica','Cairo','Mika','João','Lia'];
  const emotes = ['👋','😂','🔥','🎱','♟️','🏆','💚','☕','😎','👏'];

  function setScreen(screen){
    state.screen = screen;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${screen}`));
    $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));
    if(screen === 'report') updateReport();
    if(screen === 'games') drawPool();
  }
  function renderCharacters(){
    $('#characterGrid').innerHTML = characters.map((c, i) => `
      <button class="char-card ${state.selectedCharacter === i ? 'selected' : ''}" data-char="${i}">
        <span class="avatar">${c[1]}</span><strong>${c[0]}</strong><small>${c[2]}</small>
      </button>`).join('');
    $('#selectedCharacter').textContent = state.selectedCharacter == null ? 'Nenhum selecionado' : characters[state.selectedCharacter][0];
  }
  function renderSlots(){
    const selected = state.selectedCharacter == null ? 'Junior Play' : characters[state.selectedCharacter][0];
    const names = [selected, ...botNames];
    $('#slotGrid').innerHTML = names.map((name, i) => `<div class="slot"><span><span class="dot"></span></span><strong>${i+1}. ${name}</strong><small>${i===0?'você':'bot'}</small></div>`).join('');
  }
  function renderChat(){
    $('#chatLog').innerHTML = state.chat.map(m => `<div class="chat-line"><b>${m.user}:</b> ${escapeHtml(m.text)}</div>`).join('');
    $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
    $('#emoteRow').innerHTML = emotes.map(e => `<button type="button" data-emote="${e}">${e}</button>`).join('');
  }
  function escapeHtml(text){ return String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  function setGame(game){
    state.game = game;
    const titles = { pool:`Sinuca — modo ${state.poolMode}`, checkers:'Damas — board jogável', chess:'Xadrez — base visual' };
    $('#gameTitle').textContent = titles[game];
    $$('.game-switcher button').forEach(b => b.classList.toggle('active', b.dataset.game === game));
    $$('.game-panel').forEach(p => p.classList.remove('active'));
    $(`#${game}Panel`).classList.add('active');
    if(game === 'pool') drawPool();
  }

  function setupCheckers(){
    const board = $('#checkersBoard');
    board.innerHTML = '';
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const dark = (r+c)%2 === 1;
      const cell = document.createElement('button');
      cell.className = `cell ${dark?'dark':'light'}`;
      cell.dataset.r = r; cell.dataset.c = c;
      if(dark && r < 3) cell.innerHTML = '<span class="piece black">●</span>';
      if(dark && r > 4) cell.innerHTML = '<span class="piece white">●</span>';
      board.appendChild(cell);
    }
  }
  function handleCheckers(cell){
    if(!cell.classList.contains('dark')) return;
    const piece = $('.piece', cell);
    if(piece && piece.classList.contains('white')){
      $$('.checkers .cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected'); state.checkersSelected = cell; return;
    }
    if(state.checkersSelected && !piece){
      const sr = +state.checkersSelected.dataset.r, sc = +state.checkersSelected.dataset.c;
      const tr = +cell.dataset.r, tc = +cell.dataset.c;
      if(Math.abs(sc-tc) === 1 && tr === sr-1){ cell.innerHTML = state.checkersSelected.innerHTML; state.checkersSelected.innerHTML = ''; }
      state.checkersSelected.classList.remove('selected'); state.checkersSelected = null;
    }
  }
  function setupChess(){
    const back = [['♜','♞','♝','♛','♚','♝','♞','♜'],['♟','♟','♟','♟','♟','♟','♟','♟'],[],[],[],[],['♙','♙','♙','♙','♙','♙','♙','♙'],['♖','♘','♗','♕','♔','♗','♘','♖']];
    const board = $('#chessBoard'); board.innerHTML = '';
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const cell = document.createElement('button');
      cell.className = `cell ${(r+c)%2?'dark':'light'}`; cell.dataset.r=r; cell.dataset.c=c;
      const p = back[r][c]; if(p) cell.innerHTML = `<span class="piece ${r<2?'black':'white'}">${p}</span>`;
      board.appendChild(cell);
    }
  }
  function handleChess(cell){
    const piece = $('.piece', cell);
    if(piece){ $$('.chess .cell').forEach(c => c.classList.remove('selected')); cell.classList.add('selected'); state.chessSelected = cell; return; }
    if(state.chessSelected && !piece){ cell.innerHTML = state.chessSelected.innerHTML; state.chessSelected.innerHTML = ''; state.chessSelected.classList.remove('selected'); state.chessSelected = null; }
  }

  function resetPool(){
    const cols = state.poolMode === 'Brasileira' ? ['#fff','#f2d13d','#e23d3d','#3176ff','#913dff','#ff8f2d','#31d77b','#e8e8e8'] : ['#fff','#f2d13d','#3176ff','#e23d3d','#913dff','#ff8f2d','#31d77b','#111','#f2d13d','#3176ff'];
    state.pool.balls = cols.map((color,i)=>({x:i?560+(i%4)*28:210,y:i?185+Math.floor(i/4)*30:215,vx:0,vy:0,color,r:i?12:13,num:i}));
  }
  function drawPool(){
    const canvas = $('#poolCanvas'); if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height); grad.addColorStop(0,'#0d5a35'); grad.addColorStop(1,'#062414');
    ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#91ffc4'; ctx.lineWidth=2; ctx.strokeRect(36,36,canvas.width-72,canvas.height-72);
    [[40,40],[460,30],[880,40],[40,390],[460,400],[880,390]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fillStyle='#010302';ctx.fill();});
    state.pool.balls.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();ctx.strokeStyle='#ffffffaa';ctx.stroke(); if(b.num){ctx.fillStyle=b.color==='#111'?'#fff':'#06100c';ctx.font='bold 11px Segoe UI';ctx.textAlign='center';ctx.fillText(b.num,b.x,b.y+4);}});
    const cue = state.pool.balls[0];
    if(state.pool.aim){ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(state.pool.aim.x,state.pool.aim.y);ctx.strokeStyle='#ffd36a';ctx.lineWidth=4;ctx.stroke();}
  }
  function poolStep(){
    let moving = false;
    state.pool.balls.forEach(b=>{ b.x+=b.vx; b.y+=b.vy; b.vx*=.985; b.vy*=.985; if(Math.abs(b.vx)+Math.abs(b.vy)>.05)moving=true; if(b.x<52||b.x>868)b.vx*=-1; if(b.y<52||b.y>378)b.vy*=-1; b.x=Math.max(52,Math.min(868,b.x)); b.y=Math.max(52,Math.min(378,b.y)); });
    drawPool(); requestAnimationFrame(poolStep);
  }
  function canvasPoint(ev){
    const canvas=$('#poolCanvas'); const rect=canvas.getBoundingClientRect(); const t=ev.touches?ev.touches[0]:ev;
    return {x:(t.clientX-rect.left)*canvas.width/rect.width,y:(t.clientY-rect.top)*canvas.height/rect.height};
  }
  function updateReport(){ $('#reportText').textContent = window.renderGameToText(); }
  window.renderGameToText = () => {
    const checkersPieces = $$('.checkers .piece').length;
    const chessPieces = $$('.chess .piece').length;
    return [
      'PubPaid 3.0 / Cruzeiro do Sul Barzinho — fatia local',
      `screen=${state.screen}`,
      `selectedCharacter=${state.selectedCharacter == null ? 'none' : characters[state.selectedCharacter][0]}`,
      `slots=10`,
      `chatMessages=${state.chat.length}`,
      `emotes=${emotes.length}`,
      `activeGame=${state.game}`,
      `poolMode=${state.poolMode}`,
      `poolBalls=${state.pool.balls.length}`,
      `checkersPieces=${checkersPieces}`,
      `chessPieces=${chessPieces}`,
      'guard=separate-project-no-canonical-replace',
      'r5=pagamento-publicacao-dinheiro-real-bloqueados'
    ].join('\n');
  };

  function bind(){
    $$('.tabs button').forEach(b => b.addEventListener('click', () => setScreen(b.dataset.screen)));
    $('#startBtn').addEventListener('click', () => setScreen('lobby'));
    $('#quickReportBtn').addEventListener('click', () => setScreen('report'));
    $('#characterGrid').addEventListener('click', ev => { const card = ev.target.closest('[data-char]'); if(!card) return; state.selectedCharacter = +card.dataset.char; renderCharacters(); renderSlots(); });
    $('#chatForm').addEventListener('submit', ev => { ev.preventDefault(); const input=$('#chatInput'); if(input.value.trim()){ state.chat.push({user:'Junior Play',text:input.value.trim()}); input.value=''; renderChat(); }});
    $('#emoteRow').addEventListener('click', ev => { const btn=ev.target.closest('[data-emote]'); if(btn){ state.chat.push({user:'Junior Play',text:btn.dataset.emote}); renderChat(); }});
    $$('.game-switcher button').forEach(b => b.addEventListener('click', () => setGame(b.dataset.game)));
    $$('.pool-toolbar button').forEach(b => b.addEventListener('click', () => { state.poolMode = b.dataset.poolMode; $$('.pool-toolbar button').forEach(x=>x.classList.toggle('active',x===b)); $('#poolStatus').textContent = `Modo ${state.poolMode} carregado.`; $('#gameTitle').textContent = `Sinuca — modo ${state.poolMode}`; resetPool(); drawPool(); }));
    $('#checkersBoard').addEventListener('click', ev => { const cell=ev.target.closest('.cell'); if(cell) handleCheckers(cell); });
    $('#chessBoard').addEventListener('click', ev => { const cell=ev.target.closest('.cell'); if(cell) handleChess(cell); });
    const canvas=$('#poolCanvas');
    canvas.addEventListener('pointerdown', ev => { state.pool.dragging=true; state.pool.aim=canvasPoint(ev); drawPool(); });
    canvas.addEventListener('pointermove', ev => { if(state.pool.dragging){ state.pool.aim=canvasPoint(ev); drawPool(); }});
    canvas.addEventListener('pointerup', ev => { if(!state.pool.dragging) return; const p=canvasPoint(ev), cue=state.pool.balls[0]; cue.vx=(cue.x-p.x)*.045; cue.vy=(cue.y-p.y)*.045; state.pool.dragging=false; state.pool.aim=null; $('#poolStatus').textContent='Tacada executada.'; });
  }
  function init(){ renderCharacters(); renderSlots(); renderChat(); setupCheckers(); setupChess(); resetPool(); bind(); setGame('pool'); poolStep(); }
  document.addEventListener('DOMContentLoaded', init);
})();
