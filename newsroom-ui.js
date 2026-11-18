const app=document.querySelector('#app');
const status=document.querySelector('#status');
let tab='Para aprovar';
const levels=['Feed de notícias','Destaque na capa','Manchete principal'];
function element(tag,text,parent=app) {
  const node=document.createElement(tag);
  if(text) node.textContent=text;
  parent.append(node);
  return node;
}
async function api(route='',data) {
  const response=await fetch('/api/editores'+route,data===undefined?{}:{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
  });
  const result=await response.json();
  if(!response.ok) throw Object.assign(new Error(result.error),{status:response.status});
  return result;
}
function form(title,action,submit,parent=app) {
  const panel=element('form','',parent);
  if(title) element('h2',title,panel);
  panel.onsubmit=async event=>{
    event.preventDefault();
    button.disabled=true;
    status.textContent='';
    try {await action(Object.fromEntries(new FormData(panel)));} catch(error){status.textContent=error.message;}
    finally {button.disabled=false;}
  };
  const button=document.createElement('button');
  button.type='submit';
  button.textContent=submit;
  return {panel,finish:()=>panel.append(button)};
}
function field(panel,label,name,kind='text') {
  const wrapper=element('label',label,panel);
  const node=element(kind==='textarea'||kind==='select'?kind:'input','',wrapper);
  node.name=name;
  if(node.tagName==='INPUT') node.type=kind;
  if(kind==='select') levels.forEach((level,i)=>{element('option',level,node).value=i;});
  node.required=kind!=='file';
  return node;
}
function formattedContent(parent, text) {
  const body=element('div','',parent);
  body.className='article-body';
  function inline(node,value) {
    const pattern=/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|~~[^~\n]+~~|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\{(#[0-9a-fA-F]{6})\|([^{}\n]+)\})/g;
    let last=0, match;
    while((match=pattern.exec(value))) {
      node.append(document.createTextNode(value.slice(last,match.index)));
      const token=match[0];
      if(match[2]) {
        const link=element('a',match[2],node); link.href=match[3]; link.target='_blank'; link.rel='noopener noreferrer';
      } else if(match[4]) { const span=element('span',match[5],node); span.style.color=match[4]; }
      else if(token.startsWith('~~')) element('s',token.slice(2,-2),node);
      else element(token.startsWith('**')?'strong':'em',token.slice(token.startsWith('**')?2:1,token.startsWith('**')?-2:-1),node);
      last=pattern.lastIndex;
    }
    node.append(document.createTextNode(value.slice(last)));
  }
  for(const block of String(text||'').split(/\n\s*\n/)) {
    if(!block.trim()) continue;
    const heading=block.match(/^(#{1,3}) (.*)$/s);
    if(heading) { const node=element('h'+heading[1].length,'',body); inline(node,heading[2]); continue; }
    const lines=block.split('\n');
    if(lines.every(line=>/^[-*] /.test(line))) {
      const list=element('ul','',body); lines.forEach(line=>inline(element('li','',list),line.slice(2))); continue;
    }
    if(lines.every(line=>/^\d+\. /.test(line))) {
      const list=element('ol','',body); lines.forEach(line=>inline(element('li','',list),line.replace(/^\d+\. /,''))); continue;
    }
    const quote=lines.every(line=>/^> ?/.test(line));
    const node=element(quote?'blockquote':'p','',body);
    inline(node,quote?lines.map(line=>line.replace(/^> ?/,'')).join('\n'):block);
  }
}
function textEditor(panel, titleInput) {
  const box=element('div','',panel); box.className='text-editor';
  const toolbar=element('div','',box); toolbar.className='editor-toolbar';
  toolbar.setAttribute('role','toolbar'); toolbar.setAttribute('aria-label','Formatação do texto');
  const split=element('div','',box); split.className='editor-split';
  const textarea=field(split,'Texto da matéria','content','textarea'); textarea.maxLength=40000; textarea.rows=16;
  textarea.placeholder='Escreva sua matéria aqui. Selecione um trecho para formatar.';
  const preview=element('div','',split); preview.className='editor-preview';
  element('strong','Prévia da matéria',preview);
  const previewBody=element('div','',preview);
  const statsBar=element('div','',box); statsBar.className='editor-stats';
  const DRAFT_KEY='czs_editor_draft_v1';
  const HISTORY_KEY='czs_editor_history_v1';
  function pushHistorySnap() {
    if(!textarea.value.trim()) return;
    try {
      const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      if(!h.length || h[h.length-1].content!==textarea.value) {
        h.push({title:titleInput?.value||'',content:textarea.value,at:Date.now()});
        localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(-5)));
      }
    } catch {}
  }
  function refresh(saveDraft=true) {
    previewBody.replaceChildren();
    formattedContent(previewBody,textarea.value);
    const words=(textarea.value.trim()?textarea.value.trim().split(/\s+/).length:0);
    const mins=Math.max(1,Math.ceil(words/180));
    const nums=(textarea.value.match(/R\$\s*[\d.,]+|\b\d+(?:[.,]\d+)?%|\b\d{1,4}\/\d{2,4}\b/g)||[]);
    statsBar.textContent=`${words} palavra(s) · ${textarea.value.length}/40000 chars · ~${mins} min · Fact-Lint: ${nums.length} dado(s) numérico(s) [${nums.slice(0,4).join(', ')}]`;
    if(saveDraft && (textarea.value.trim() || titleInput?.value.trim())) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({title:titleInput?.value||'',content:textarea.value,savedAt:Date.now()})); } catch {}
    }
  }
  textarea.addEventListener('input',()=>refresh(true));
  if(titleInput) titleInput.addEventListener('input',()=>refresh(true));
  textarea.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){ e.preventDefault(); refresh(true); status.textContent='Rascunho salvo no navegador.'; }
  });
  function wrap(before,after,placeholder) {
    const start=textarea.selectionStart, end=textarea.selectionEnd;
    const selected=textarea.value.slice(start,end)||placeholder;
    textarea.setRangeText(before+selected+after,start,end,'select'); textarea.focus(); refresh(true);
  }
  function control(label,action) {
    const button=element('button',label,toolbar); button.type='button';
    button.addEventListener('mousedown',event=>event.preventDefault()); button.onclick=action;
  }
  const heading=element('select','',toolbar); heading.setAttribute('aria-label','Nível de título');
  [['Título e subtítulos',''],['Título H1','# '],['Subtítulo H2','## '],['Subtítulo H3','### ']].forEach(([label,value])=>heading.add(new Option(label,value)));
  heading.onchange=()=>{if(heading.value) wrap('\n\n'+heading.value,'\n\n','Título'); heading.value='';};
  control('Negrito',()=>wrap('**','**','texto'));
  control('Itálico',()=>wrap('*','*','texto'));
  control('Riscado',()=>wrap('~~','~~','texto'));
  control('Link',()=>{
    const address=prompt('Endereço do link (começando com https://):','https://');
    if(address===null) return;
    try { const url=new URL(address); if(!['https:','http:'].includes(url.protocol)||/[\s)]/.test(url.href)) throw Error(); wrap('[',']('+url.href+')','texto do link'); }
    catch { status.textContent='Informe um endereço de link válido começando com http ou https.'; }
  });
  control('Lista',()=>wrap('\n\n- ','\n\n','item'));
  control('Lista numerada',()=>wrap('\n\n1. ','\n\n','item'));
  control('Citação',()=>wrap('\n\n> ','\n\n','citação'));
  control('Bloco Essencial',()=>wrap('\n\n> **O essencial:** ','\n\n','Resumo direto em 1 frase.'));
  control('Quadro Comparativo',()=>{
    pushHistorySnap();
    wrap('\n\n## Comparação de Dados\n- **Dado Oficial / CZS:** \n- **O que outros jornais publicaram:** \n- **Veredito da Checagem:** ','\n\n','');
  });
  control('⏪ Desfazer versão',()=>{
    try {
      const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      const prev=h.pop();
      localStorage.setItem(HISTORY_KEY,JSON.stringify(h));
      if(prev){ textarea.value=prev.content; if(titleInput&&prev.title)titleInput.value=prev.title; refresh(true); status.textContent='Versão anterior restaurada.'; }
    } catch {}
  });
  const colorLabel=element('label','Cor do texto',toolbar); colorLabel.className='editor-color';
  const color=element('input','',colorLabel); color.type='color'; color.value='#b91c1c'; color.setAttribute('aria-label','Escolher cor do texto');
  let savedStart=0,savedEnd=0;
  textarea.addEventListener('select',()=>{savedStart=textarea.selectionStart;savedEnd=textarea.selectionEnd;});
  color.addEventListener('change',()=>{textarea.setSelectionRange(savedStart,savedEnd);wrap('{'+color.value+'|','}','texto');});

  try {
    const saved=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
    if(saved && (saved.content||saved.title)) {
      const restoreBtn=element('button','Restaurar rascunho',toolbar); restoreBtn.type='button';
      restoreBtn.onclick=()=>{
        if(titleInput && saved.title) titleInput.value=saved.title;
        if(saved.content) textarea.value=saved.content;
        refresh(false);
        status.textContent='Rascunho restaurado.';
      };
    }
  } catch {}

  const aiBar=element('div','',box); aiBar.className='editor-ai-bar';
  element('strong','Assistente IA da Redação (grátis)',aiBar);
  const aiResult=element('div','',box); aiResult.className='editor-ai-result'; aiResult.hidden=true;
  const aiOut=element('pre','',aiResult); aiOut.className='editor-ai-out';
  const aiActions=element('div','',aiResult); aiActions.className='editor-ai-actions';
  let lastAiMode='melhorar';
  const applyReplace=element('button','Substituir texto',aiActions); applyReplace.type='button';
  applyReplace.onclick=()=>{ textarea.value=aiOut.textContent; refresh(true); aiResult.hidden=true; status.textContent='Texto atualizado pela sugestão.'; };
  const applyPrepend=element('button','Inserir no topo',aiActions); applyPrepend.type='button';
  applyPrepend.onclick=()=>{ textarea.value=aiOut.textContent.trim()+'\n\n'+textarea.value.trim(); refresh(true); aiResult.hidden=true; status.textContent='Bloco inserido no topo.'; };
  const closeAi=element('button','Fechar',aiActions); closeAi.type='button'; closeAi.onclick=()=>{ aiResult.hidden=true; };

  for(const [mode,label] of [['estudar_fontes','🔎 Estudar Fontes & Incoerências (NYT)'],['anti_assessoria','🧹 Secar Release (Anti-Assessoria)'],['perguntas_furo','🕵️ Perguntas Investigativas'],['melhorar','✨ Revisar Português'],['titulo','📰 3 Manchetes'],['resumo','📌 Resumo 3 Pontos'],['contraponto','⚖️ Contraponto Semafor']]) {
    const btn=element('button',label,aiBar); btn.type='button';
    btn.onclick=async()=>{
      btn.disabled=true; status.textContent='Consultando editor IA…'; lastAiMode=mode;
      try {
        const res=await api('/ai',{mode,title:titleInput?.value||'',content:textarea.value});
        aiOut.textContent=res.answer||'';
        applyReplace.hidden=(mode==='titulo');
        aiResult.hidden=false;
        status.textContent='Sugestão pronta ('+(res.model||'IA grátis')+').';
      } catch(err) { status.textContent=err.message; }
      finally { btn.disabled=false; }
    };
  }

  element('small','Atalho Ctrl+S salva o rascunho localmente. A prévia ao lado mostra exatamente como aparecerá no jornal.',box);
  refresh(false); return textarea;
}
function article(parent,a,chief=false) {
  const publicPage=new URLSearchParams(location.search).has('publicadas');
  const wrapper=publicPage?element('details','',parent):parent;
  if(publicPage){
    wrapper.open=new URLSearchParams(location.search).get('materia')===a.id;
    element('summary',a.title+' · '+levels[a.level],wrapper);
    wrapper.addEventListener('toggle',()=>{
      if(wrapper.open) api('/metrica',{id:a.id,event:'views'}).catch(()=>{});
    },{once:true});
  }
  const card=element('article','',wrapper);
  element('h2',a.title,card);
  element('small',a.author+' · '+a.status+' · '+levels[a.level],card);
  if(a.hasMedia) {
    const media=element(a.mediaType.startsWith('video/')?'video':'img','',card);
    if(publicPage){
      if(media.tagName==='IMG'){
        const link=element('a','',card);
        link.href='/api/editores/midia/'+a.id;
        link.append(media);
      }
      media.addEventListener(media.tagName==='VIDEO'?'play':'click',()=>api('/metrica',{id:a.id,event:'clicks'}).catch(()=>{}),{once:true});
    }
    media.src='/api/editores/midia/'+a.id;
    if(media.tagName==='VIDEO'){media.controls=true;media.preload='metadata';}
    else media.alt='Foto da matéria '+a.title;
  }
  formattedContent(card,a.content);
  if(!publicPage && a.status==='Publicada'){
    element('a','Ver na capa',card).href='/#redacao-'+a.id;
    element('a','Abrir matéria publicada',card).href='/noticia.html?slug=redacao-'+a.id;
  }
  if(chief && ['Publicada','Arquivada'].includes(a.status)){
    const manage=form('Gerenciar ou Editar Publicação',async data=>{
      await api('/gerenciar',{id:a.id,level:Number(data.level),active:data.visibility==='public'});
      if(data.editTitle && data.editContent) {
        await api('/editar',{id:a.id,title:data.editTitle,content:data.editContent,category:data.editCategory||a.category,level:Number(data.level)});
      }
      await render();
      status.textContent='Publicação atualizada.';
    },'Salvar alterações',card);
    field(manage.panel,'Editar Título','editTitle').value=a.title||'';
    const editCat=field(manage.panel,'Editoria','editCategory'); editCat.required=false; editCat.value=a.category||'Redação CZS';
    const editTxt=field(manage.panel,'Editar Texto da Matéria','editContent','textarea'); editTxt.rows=6; editTxt.value=a.content||'';
    field(manage.panel,'Posição editorial','level','select').value=a.level;
    const visibility=field(manage.panel,'Visibilidade','visibility','select');
    visibility.replaceChildren(new Option('Publicada','public'),new Option('Arquivada','archive'));
    visibility.value=a.status==='Publicada'?'public':'archive';
    manage.finish();
  }
  if(chief && a.status==='Em revisão') {
    const review=form('Revisão editorial',async data=>{
      await api('/revisar',{id:a.id,level:Number(data.level),approve:data.decision==='publish'});
      await render();
      status.textContent=data.decision==='publish'?'Matéria aprovada e publicada.':'Matéria recusada.';
      if(data.decision==='publish') {
        const confirmation=element('section','');
        element('p','Matéria aprovada e publicada.',confirmation);
        element('a','Abrir matéria publicada',confirmation).href='/editores?publicadas&materia='+encodeURIComponent(a.id);
        app.prepend(confirmation);
      }
    },'Confirmar decisão',card);
    field(review.panel,'Posição editorial','level','select').value=a.level;
    const choice=field(review.panel,'Decisão','decision','select');
    choice.replaceChildren(new Option('Selecione a decisão',''),new Option('Aprovar e publicar','publish'),new Option('Recusar','reject'));
    review.finish();
  }
}
async function render() {
  app.replaceChildren();
  if(new URLSearchParams(location.search).has('publicadas')) {
    document.querySelector('#heading').textContent='Matérias da redação';
    element('a','Voltar à redação').href='/editores';
    const rows=await api('/publicadas');
    if(!rows.length) element('p','Nenhuma matéria publicada.');
    const id=new URLSearchParams(location.search).get('materia');
    const visible=id?rows.filter(a=>a.id===id):rows;
    if(id&&!visible.length) element('p','Matéria indisponível.');
    visible.forEach(a=>article(app,a));
    return;
  }
  let user;
  try {user=await api();} catch(error) {
    if(error.status!==401) throw error;
    const login=form('Entrar na redação',async data=>{await api('/login',data);await render();},'Entrar');
    field(login.panel,'Usuário','name').autocomplete='username';
    const password=field(login.panel,'Senha','password','password');
    password.autocomplete='current-password';
    const show=element('button','Mostrar senha',login.panel);
    show.type='button';
    show.onclick=()=>{const visible=password.type==='password';password.type=visible?'text':'password';show.textContent=visible?'Ocultar senha':'Mostrar senha';};
    element('small','Use o nome de usuário e a senha fornecidos pelo editor-geral.',login.panel);
    login.finish();
    element('a','Ver matérias publicadas').href='/editores?publicadas';
    const docsBar=element('div','');
    docsBar.style.cssText='margin-top:16px;padding:12px;background:#faf7f0;border:1px solid #d5cfc1;border-radius:4px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;';
    const dl1=element('a','📘 Baixar Guia Prático do Editor (PDF)',docsBar); dl1.href='/GUIA_DO_EDITOR.pdf'; dl1.download='01_GUIA_PRATICO_DO_EDITOR.pdf';
    const dl2=element('a','💼 Baixar Plano de Negócios (PDF)',docsBar); dl2.href='/PLANO_DE_NEGOCIOS.pdf'; dl2.download='02_PLANO_DE_NEGOCIOS_E_PARCERIAS.pdf';
    const dl3=element('a','📦 Baixar Pacote Completo (.ZIP)',docsBar); dl3.href='/CATALOGO_CZS_ENTREGA_EDITORES_E_PARCEIROS.zip'; dl3.download='CATALOGO_CZS_ENTREGA_EDITORES_E_PARCEIROS.zip';
    return;
  }
  element('small',user.name+' · '+(user.chief?'Editor-geral':'Editor'));
  const logout=element('button','Sair');
  logout.onclick=async()=>{await api('/sair');await render();};
  const topDocs=element('div','');
  topDocs.style.cssText='margin:10px 0;padding:8px 12px;background:#faf7f0;border:1px solid #d5cfc1;border-radius:4px;display:flex;flex-wrap:wrap;gap:14px;font-size:13px;';
  const tdl1=element('a','📘 Guia do Editor (PDF)',topDocs); tdl1.href='/GUIA_DO_EDITOR.pdf'; tdl1.download='01_GUIA_PRATICO_DO_EDITOR.pdf';
  const tdl2=element('a','💼 Plano de Negócios (PDF)',topDocs); tdl2.href='/PLANO_DE_NEGOCIOS.pdf'; tdl2.download='02_PLANO_DE_NEGOCIOS_E_PARCERIAS.pdf';
  const tdl3=element('a','📦 Pacote Completo (.ZIP)',topDocs); tdl3.href='/CATALOGO_CZS_ENTREGA_EDITORES_E_PARCEIROS.zip'; tdl3.download='CATALOGO_CZS_ENTREGA_EDITORES_E_PARCEIROS.zip';
  if(user.temporary) {
    const change=form('Troque a senha temporária',async data=>{await api('/senha',data);await render();},'Salvar senha');
    const password=field(change.panel,'Nova senha','password','password');
    password.minLength=14;
    password.autocomplete='new-password';
    change.finish();
    return;
  }
  if(user.chief){
    const pending=user.articles.filter(a=>a.status==='Em revisão');
    const nav=element('nav','');
    for(const name of ['Para aprovar','Nova matéria','Radar do Dia','Matérias','Comentários Cidadãos','Equipe','Métricas']){
      const button=element('button',name==='Para aprovar'?name+' ('+pending.length+')':name==='Comentários Cidadãos'?name+' ('+(user.comments?.length||0)+')':name,nav);
      button.setAttribute('aria-pressed',String(tab===name));
      button.onclick=()=>{tab=name;render().catch(error=>{status.textContent=error.message;});};
    }
    if(tab==='Radar do Dia'){
      element('h2','Radar do Dia — Assumir Pauta como Original (Apagar Réplica)');
      element('p','Ao assumir uma pauta abaixo e publicá-la pela Redação CZS, o sistema destaca sua reportagem original e apaga automaticamente a réplica externa do feed público.');
      const radarBox=element('div','Carregando pautas do dia…');
      fetch('/api/news/archive?limit=25',{cache:'no-store'}).then(r=>r.json()).then(d=>{
        radarBox.replaceChildren();
        (d.items||[]).filter(x=>!x.isOriginal).slice(0,20).forEach(item=>{
          const row=element('section','',radarBox);
          element('h3',item.title,row);
          element('small',(item.sourceName||'Fonte externa')+' · '+(item.category||'Notícias')+' · '+(item.date||'Hoje'),row);
          element('p',item.summary||item.lede||'',row);
          const takeBtn=element('button','⚡ Assumir Pauta como Original (Apagar Réplica)',row);
          takeBtn.type='button';
          takeBtn.onclick=()=>{
            localStorage.setItem('czs_editor_draft_v1',JSON.stringify({
              title:item.title,
              content:'Insumo da fonte ('+(item.sourceName||'Veículo')+' - '+(item.sourceUrl||'')+'):\n'+(item.summary||item.lede||'')+'\n\n[Clique em "🔎 Estudar Fontes & Incoerências (NYT)" abaixo para gerar a reportagem autoral verificada]',
              savedAt:Date.now()
            }));
            tab='Nova matéria';
            render();
            status.textContent='Pauta carregada! Clique em "Restaurar rascunho" ou use o botão "Estudar Fontes & Incoerências (NYT)".';
          };
        });
      }).catch(()=>{radarBox.textContent='Não foi possível carregar o radar.';});
      return;
    }
    if(tab==='Comentários Cidadãos'){
      element('h2','Moderação de Comentários e Relatos dos Cidadãos');
      const list=user.comments||[];
      if(!list.length) element('p','Nenhum comentário registrado.');
      list.forEach(c=>{
        const card=element('section','');
        element('h3',(c.name||'Cidadão')+' — '+(c.badge||c.neighborhood||'Cruzeiro do Sul'),card);
        element('small','Matéria: '+(c.articleSlug||c.articleId||'geral')+' · '+(c.createdAt||''),card);
        element('p',c.message||c.text||'',card);
        const vBtn=element('button',c.verifiedByEditor?'Remover selo de verificado':'✓ Destacar como Relato Verificado',card);
        vBtn.onclick=async()=>{await api('/comentarios/moderar',{id:c.id,action:'verify'});await render();};
        const pBtn=element('button','📝 Transformar Relato em Pauta',card);
        pBtn.onclick=()=>{
          localStorage.setItem('czs_editor_draft_v1',JSON.stringify({
            title:'Moradores de '+(c.neighborhood||'Cruzeiro do Sul')+' relatam situação sobre '+(c.articleSlug||'demanda comunitária'),
            content:'Relato cidadão enviado por '+(c.name||'Morador')+' ('+(c.neighborhood||'Cruzeiro do Sul')+'):\n"'+(c.message||c.text||'')+'"\n\n[Clique em "🔎 Estudar Fontes & Incoerências (NYT)" para estruturar a reportagem]',
            savedAt:Date.now()
          }));
          tab='Nova matéria'; render();
        };
        const dBtn=element('button','🗑️ Excluir comentário',card);
        dBtn.onclick=async()=>{await api('/comentarios/moderar',{id:c.id,action:'delete'});await render();};
      });
      return;
    }
    if(tab==='Para aprovar' || tab==='Matérias'){
      const rows=tab==='Para aprovar'?pending:user.articles;
      element('h2',tab==='Para aprovar'?'Fila de aprovação':'Todas as matérias');
      if(tab==='Matérias'){
        const backupBtn=element('button','💾 Baixar Backup JSON da Redação');
        backupBtn.type='button';
        backupBtn.onclick=()=>{
          const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),articles:user.articles,comments:user.comments||[]},null,2)],{type:'application/json'});
          const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-redacao-czs.json';a.click();
        };
      }
      if(!rows.length) element('p','Nenhuma matéria nesta fila.');
      rows.slice().reverse().forEach(a=>article(app,a,true));
      return;
    }
    if(tab==='Métricas'){
      element('h2','Métricas da redação');
      element('p','Visualizações contam aberturas de matérias. Cliques contam abertura de fotos ou início de vídeos.');
      const rows=user.articles.filter(a=>['Publicada','Arquivada'].includes(a.status));
      const total=(key)=>rows.reduce((sum,a)=>sum+(a.metrics?.[key]||0),0);
      element('p',total('views')+' visualizações · '+total('clicks')+' cliques em mídia');
      rows.forEach(a=>element('p',a.title+' · '+(a.metrics?.views||0)+' visualizações · '+(a.metrics?.clicks||0)+' cliques'));
      return;
    }
  }
  if(!user.chief || tab==='Nova matéria'){
  const submission=form('Nova matéria',async data=>{
    const attachment=data.media;
    if(data.sourceName || data.sourceUrl) {
      const source=String(data.sourceName||'Fonte').replace(/[\[\]\n]/g,'').trim();
      if(data.sourceUrl) {
        let url;
        try { url=new URL(data.sourceUrl); } catch { throw new Error('Informe um endereço válido para a fonte.'); }
        if(!['http:','https:'].includes(url.protocol) || /[\s)]/.test(url.href)) throw new Error('Use um link de fonte iniciado por http ou https.');
        data.content+='\n\nFonte: ['+source+']('+url.href+')';
      } else data.content+='\n\nFonte: '+source;
    }
    delete data.sourceName; delete data.sourceUrl;
    data.level=Number(data.level);
    data.media=null;
    if(attachment.size) {
      if(attachment.size>(attachment.type==='video/mp4'?16:5)*1024*1024) throw new Error('Arquivo acima do limite.');
      const encoded=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result.split(',')[1]);
        reader.onerror=()=>reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsDataURL(attachment);
      });
      data.media={type:attachment.type,data:encoded};
    }
    const result=await api('/enviar',data);
    try { localStorage.removeItem('czs_editor_draft_v1'); } catch {}
    if(user.chief) tab='Matérias';
    await render();
    status.textContent=user.chief?'Matéria publicada.':'Matéria enviada para revisão.';
    const confirmation=element('section','');
    element('p',user.chief?'Matéria publicada com sucesso.':'Matéria enviada ao editor-geral para aprovação.',confirmation);
    if(user.chief) {
      element('a','Abrir matéria publicada',confirmation).href='/editores?publicadas&materia='+encodeURIComponent(result.id);
      element('a','Ver na capa do portal',confirmation).href='/#redacao-'+encodeURIComponent(result.id);
    }
    app.prepend(confirmation);
  },user.chief?'Publicar agora':'Enviar para revisão');
  const titleInput=field(submission.panel,'Título','title'); titleInput.maxLength=160;
  const catSelect=field(submission.panel,'Editoria / Categoria','category'); catSelect.required=false; catSelect.placeholder='Ex.: Cruzeiro do Sul, Polícia, Saúde, Educação, Economia'; catSelect.value='Cruzeiro do Sul';
  const munInput=field(submission.panel,'Município / Localidade','municipality'); munInput.required=false; munInput.value='Cruzeiro do Sul';
  const nutInput=field(submission.panel,'Por que importa (Nut Graph — opcional)','nutGraph'); nutInput.required=false; nutInput.maxLength=400; nutInput.placeholder='1 frase explicando o impacto direto para o morador de Cruzeiro do Sul / Juruá';
  const factInput=field(submission.panel,'Fato Verificado Principal (opcional — destaque no quadro de checagem)','customVerifiedFact'); factInput.required=false; factInput.maxLength=400;
  const incInput=field(submission.panel,'Apontar Incoerência / Divergência de outros jornais (opcional)','customInconsistency'); incInput.required=false; incInput.maxLength=500;
  const creditInput=field(submission.panel,'Crédito da Foto / Legenda (opcional)','imageCredit'); creditInput.required=false; creditInput.maxLength=160;
  const motifWrap=element('label','Tema da Ilustração Editorial NYT (usado quando sem foto)',submission.panel);
  const motifSelect=element('select','',motifWrap); motifSelect.name='illustrationMotif';
  [['Automático pelo tema',''],['Cidade & Infraestrutura','city'],['Justiça & Segurança','justice'],['Rio Juruá & Clima','river'],['Saúde Pública','health'],['Educação & Ciência','education'],['Economia & Trabalho','economy']].forEach(([l,v])=>motifSelect.add(new Option(l,v)));
  const importBar=element('div','',submission.panel); importBar.className='editor-ai-bar';
  const urlToImport=element('input','',importBar); urlToImport.type='url'; urlToImport.placeholder='Cole o link (https://...) de outro jornal para importar e checar fatos'; urlToImport.style.flex='1';
  const importBtn=element('button','🔗 Importar Fatos da URL',importBar); importBtn.type='button';
  const bodyEditor=textEditor(submission.panel, titleInput);
  importBtn.onclick=async()=>{
    if(!urlToImport.value.trim()) return;
    importBtn.disabled=true; status.textContent='Extraindo fatos da URL para estudo…';
    try {
      const r=await api('/importar-url',{url:urlToImport.value.trim()});
      if(r.title && !titleInput.value.trim()) titleInput.value=r.title;
      bodyEditor.value=(bodyEditor.value?bodyEditor.value+'\n\n---\n':'')+'Fonte consultada ('+r.host+' - '+r.sourceUrl+'):\n'+r.content;
      bodyEditor.dispatchEvent(new Event('input'));
      urlToImport.value='';
      status.textContent='Insumos importados! Agora clique em "🔎 Estudar Fontes & Incoerências (NYT)" para redigir a matéria autoral.';
    } catch(e){ status.textContent=e.message; }
    finally { importBtn.disabled=false; }
  };
  const sourceName=field(submission.panel,'Nome da fonte (opcional)','sourceName'); sourceName.required=false; sourceName.maxLength=160;
  const sourceUrl=field(submission.panel,'Link da fonte (opcional)','sourceUrl','url'); sourceUrl.required=false;
  field(submission.panel,user.chief?'Posição editorial':'Destaque sugerido','level','select');
  field(submission.panel,'Foto ou vídeo','media','file').accept='image/jpeg,image/png,image/webp,video/mp4';
  element('small','JPG, PNG ou WebP até 5 MB. MP4 até 16 MB.',submission.panel);
  submission.finish();
  }
  if(user.chief && tab==='Equipe') {
    const team=form('Nomear editor',async data=>{
      const created=await api('/equipe',data);
      await render();
      document.querySelector('#team-result').textContent='Usuário '+created.name+' · Senha temporária '+created.password;
      team.panel.reset();
    },'Gerar senha');
    field(team.panel,'Usuário do editor','name');
    team.finish();
    element('output','',team.panel).id='team-result';
    for(const account of user.team){
      const card=element('section','');
      element('h2',account.name,card);
      element('p',account.disabled?'Desativado':account.temporary?'Senha temporária':'Ativo',card);
      for(const [action,label] of [[account.disabled?'enable':'disable',account.disabled?'Reativar':'Desativar'],['reset','Gerar nova senha']]){
        const button=element('button',label,card);
        button.onclick=async()=>{
          button.disabled=true;
          try {
            const result=await api('/conta',{name:account.name,action});
            await render();
            if(result.password) document.querySelector('#team-result').textContent='Usuário '+account.name+' · Senha temporária '+result.password;
          } catch(error){status.textContent=error.message;button.disabled=false;}
        };
      }
    }
  }
  if(user.chief) return;
  element('h2','Minhas matérias');
  if(!user.articles.length) element('p','Nenhuma matéria enviada.');
  user.articles.slice().reverse().forEach(a=>article(app,a,user.chief));
}
render().catch(error=>{status.textContent=error.message;});
const themeButton = document.querySelector('#theme');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const dark = (localStorage.getItem('czs-editor-theme') || (systemTheme.matches ? 'dark' : 'light')) === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.textContent = dark ? 'Tema claro' : 'Tema escuro';
}
themeButton.onclick = () => {
  localStorage.setItem('czs-editor-theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  applyTheme();
};
systemTheme.addEventListener('change', applyTheme);
applyTheme();
