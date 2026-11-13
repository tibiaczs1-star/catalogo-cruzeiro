const app=document.querySelector('#app');
const status=document.querySelector('#status');
let tab='Para aprovar';
const levels=['Comum','Destaque','Manchete'];
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
function article(parent,a,chief=false) {
  const publicPage=location.search==='?publicadas';
  const wrapper=publicPage?element('details','',parent):parent;
  if(publicPage){
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
  element('p',a.content,card);
  if(chief && ['Publicada','Arquivada'].includes(a.status)){
    const manage=form('Gerenciar publicação',async data=>{
      await api('/gerenciar',{id:a.id,level:Number(data.level),active:data.visibility==='public'});
      await render();
      status.textContent='Publicação atualizada.';
    },'Salvar',card);
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
      status.textContent='Revisão concluída.';
    },'Confirmar decisão',card);
    field(review.panel,'Posição editorial','level','select').value=a.level;
    const choice=field(review.panel,'Decisão','decision','select');
    choice.replaceChildren(new Option('Selecione a decisão',''),new Option('Aprovar e publicar','publish'),new Option('Recusar','reject'));
    review.finish();
  }
}
async function render() {
  app.replaceChildren();
  if(location.search==='?publicadas') {
    document.querySelector('#heading').textContent='Matérias da redação';
    const rows=await api('/publicadas');
    if(!rows.length) element('p','Nenhuma matéria publicada.');
    rows.forEach(a=>article(app,a));
    return;
  }
  let user;
  try {user=await api();} catch(error) {
    if(error.status!==401) throw error;
    const login=form('Entrar na redação',async data=>{await api('/login',data);await render();},'Entrar');
    field(login.panel,'Usuário','name').autocomplete='username';
    field(login.panel,'Senha','password','password').autocomplete='current-password';
    login.finish();
    element('a','Ver matérias publicadas').href='/editores?publicadas';
    return;
  }
  element('small',user.name+' · '+(user.chief?'Editor-geral':'Editor'));
  const logout=element('button','Sair');
  logout.onclick=async()=>{await api('/sair');await render();};
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
    for(const name of ['Para aprovar','Nova matéria','Matérias','Equipe','Métricas']){
      const button=element('button',name==='Para aprovar'?name+' ('+pending.length+')':name,nav);
      button.setAttribute('aria-pressed',String(tab===name));
      button.onclick=()=>{tab=name;render().catch(error=>{status.textContent=error.message;});};
    }
    if(tab==='Para aprovar' || tab==='Matérias'){
      const rows=tab==='Para aprovar'?pending:user.articles;
      element('h2',tab==='Para aprovar'?'Fila de aprovação':'Todas as matérias');
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
    await api('/enviar',data);
    await render();
    status.textContent=user.chief?'Matéria publicada.':'Matéria enviada para revisão.';
  },user.chief?'Publicar agora':'Enviar para revisão');
  field(submission.panel,'Título','title').maxLength=160;
  field(submission.panel,'Texto da matéria','content','textarea').maxLength=40000;
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
