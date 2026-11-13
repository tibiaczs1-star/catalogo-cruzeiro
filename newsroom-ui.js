const app=document.querySelector('#app');
const status=document.querySelector('#status');
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
  const card=element('article','',parent);
  element('h2',a.title,card);
  element('small',a.author+' · '+a.status+' · '+levels[a.level],card);
  if(a.hasMedia) {
    const media=element(a.mediaType.startsWith('video/')?'video':'img','',card);
    media.src='/api/editores/midia/'+a.id;
    if(media.tagName==='VIDEO'){media.controls=true;media.preload='metadata';}
    else media.alt='Foto da matéria '+a.title;
  }
  element('p',a.content,card);
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
    status.textContent='Matéria enviada para revisão.';
  },'Enviar para revisão');
  field(submission.panel,'Título','title').maxLength=160;
  field(submission.panel,'Texto da matéria','content','textarea').maxLength=40000;
  field(submission.panel,'Destaque sugerido','level','select');
  field(submission.panel,'Foto ou vídeo','media','file').accept='image/jpeg,image/png,image/webp,video/mp4';
  element('small','JPG, PNG ou WebP até 5 MB. MP4 até 16 MB.',submission.panel);
  submission.finish();
  if(user.chief) {
    const team=form('Nomear editor',async data=>{
      const created=await api('/equipe',data);
      result.textContent='Usuário '+created.name+' · Senha temporária '+created.password;
      team.panel.reset();
    },'Gerar senha');
    field(team.panel,'Usuário do editor','name');
    team.finish();
    const result=element('output','',team.panel);
  }
  element('h2',user.chief?'Fila editorial':'Minhas matérias');
  if(!user.articles.length) element('p','Nenhuma matéria enviada.');
  user.articles.slice().reverse().forEach(a=>article(app,a,user.chief));
}
render().catch(error=>{status.textContent=error.message;});
