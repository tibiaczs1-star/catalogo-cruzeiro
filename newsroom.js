const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = function newsroom(directory) {
  const file = path.join(directory, 'newsroom-private.json');
  const digest = (secret, salt) => crypto.scryptSync(secret, salt, 64).toString('hex');
  const token = () => crypto.randomBytes(24).toString('base64url');
  const sessionHash = (id) => crypto.createHash('sha256').update(id).digest('hex');
  let attempts = 0;
  let windowEnd = 0;
  const levels = ['Comum', 'Destaque', 'Manchete'];
  const respond = (res, status, data) => {
    res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'});
    res.end(JSON.stringify(data));
  };
  const save = (state) => {
    fs.mkdirSync(directory, {recursive:true});
    fs.writeFileSync(file + '.tmp', JSON.stringify(state), {mode:0o600});
    fs.renameSync(file + '.tmp', file);
  };
  return async function handle(req,res,url) {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    const route = url.pathname;
    try {
      if (req.method === 'GET' && route === '/editores') {
        res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' blob:; media-src 'self' blob:; frame-ancestors 'none'; form-action 'self'");
        res.setHeader('Content-Type','text/html; charset=utf-8');
        return res.end(fs.readFileSync(path.join(__dirname,'newsroom.html')));
      }
      if (req.method === 'GET' && ['/editores.js','/editores.css'].includes(route)) {
        const script = route.endsWith('.js');
        res.setHeader('Content-Type',script?'text/javascript; charset=utf-8':'text/css; charset=utf-8');
        return res.end(fs.readFileSync(path.join(__dirname, script?'newsroom-ui.js':'newsroom.css')));
      }
      let body = {};
      if (req.method === 'POST') {
        if (req.headers['sec-fetch-site'] === 'cross-site' || req.headers['content-type'] !== 'application/json') return respond(res,403,{error:'Solicitação inválida.'});
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 24 * 1024 * 1024) {
            respond(res,413,{error:'Arquivo muito grande.'});
            return;
          }
          chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString());
      }
      const state = fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{users:[],articles:[]};
      state.sessions ||= [];
      const sessionId = /(?:^|; )czs_editor=([\w-]+)/.exec(req.headers.cookie || '')?.[1];
      const now = Date.now();
      const currentHash = sessionId ? sessionHash(sessionId) : '';
      const session = state.sessions.find(item=>item.idHash===currentHash);
      const user = session?.until > now && state.users.find(u=>u.name===session.name && !u.disabled);
      const chief = user?.name === 'editor-geral';
      const send = (status,data)=>respond(res,status,data);
      if (req.method === 'POST' && route.endsWith('/login')) {
        if (now > windowEnd) { attempts=0; windowEnd=now+60000; }
        if (++attempts > 25) return send(429,{error:'Aguarde um minuto.'});
        const login = String(body.name || '').toLowerCase().trim();
        const name = login === 'clebson santos' ? 'editor-geral' : login;
        const password = String(body.password || '');
        if (password.length > 256) return send(400,{error:'Senha inválida.'});
        let account = state.users.find(u=>u.name===name);
        const rotation = name === 'editor-geral' ? process.env.CZS_EDITOR_ROTATION_HASH : '';
        if (rotation && account?.rotation !== rotation) {
          const [salt,hash] = rotation.split(':');
          account = {...account,name,salt,hash,rotation,temporary:false};
        } else if (!account && name==='editor-geral' && process.env.CZS_EDITOR_INITIAL_HASH) {
          const [salt,hash] = process.env.CZS_EDITOR_INITIAL_HASH.split(':');
          account={name,salt,hash,temporary:true};
        }
        const actual = digest(password,account?.salt || 'invalid-account');
        if (!account || account.disabled || !/^[a-f0-9]{128}$/.test(account.hash) || !crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(account.hash,'hex'))) return send(401,{error:'Usuário ou senha inválidos.'});
        if (!state.users.includes(account)) {
          state.users = state.users.filter(user => user.name !== name);
          state.users.push(account);
          state.sessions = state.sessions.filter(item=>item.name!==name);
        }
        state.sessions = state.sessions.filter(item=>item.until>now && item.idHash!==currentHash);
        const id=token();
        state.sessions.push({idHash:sessionHash(id),name,until:now+8*3600000});
        save(state);
        res.setHeader('Set-Cookie','czs_editor='+id+'; Path=/api/editores; HttpOnly; SameSite=Strict; Max-Age=28800'+(process.env.RENDER || req.socket.encrypted?'; Secure':''));
        return send(200,{ok:true});
      }
      if (req.method==='GET' && route.endsWith('/publicadas')) {
        return send(200,state.articles.filter(a=>a.status==='Publicada').sort((a,b)=>b.level-a.level || b.published.localeCompare(a.published)).map(({media,...a})=>({...a,hasMedia:Boolean(media)})));
      }
      if (req.method==='GET' && route.startsWith('/api/editores/midia/')) {
        const a=state.articles.find(item=>item.id===route.split('/').pop());
        if (!a?.media || !(a.status==='Publicada' || (user && !user.temporary && (chief || a.author===user.name)))) return send(404,{error:'Mídia indisponível.'});
        res.setHeader('Content-Type',a.media.type);
        return res.end(Buffer.from(a.media.data,'base64'));
      }
      if (req.method==='POST' && route==='/api/editores/metrica') {
        const article=state.articles.find(a=>a.id===body.id && a.status==='Publicada');
        if (!article || !['views','clicks'].includes(body.event)) return send(404,{error:'Matéria indisponível.'});
        article.metrics ||= {views:0,clicks:0};
        article.metrics[body.event]++;
        save(state);
        return send(200,{ok:true});
      }
      if (!user) return send(401,{error:'Entre para continuar.'});
      if (req.method==='GET' && route==='/api/editores') return send(200,{name:user.name,chief,temporary:user.temporary,team:chief&&!user.temporary?state.users.filter(u=>u.name!=='editor-geral').map(({name,disabled,temporary})=>({name,disabled,temporary})):[],articles:user.temporary?[]:state.articles.filter(a=>chief||a.author===user.name).map(({media,...a})=>({...a,hasMedia:Boolean(media)}))});
      if (req.method!=='POST') return send(404,{error:'Página indisponível.'});
      if (route.endsWith('/sair')) {
        state.sessions = state.sessions.filter(item=>item.idHash!==currentHash);
        save(state);
        res.setHeader('Set-Cookie','czs_editor=; Path=/api/editores; HttpOnly; SameSite=Strict; Max-Age=0'+(process.env.RENDER || req.socket.encrypted?'; Secure':''));
        return send(200,{ok:true});
      }
      if (route.endsWith('/senha')) {
        if (typeof body.password!=='string' || body.password.length<14 || body.password.length>256 || digest(body.password,user.salt)===user.hash) return send(400,{error:'Escolha outra senha com pelo menos 14 caracteres.'});
        user.salt=token();
        user.hash=digest(body.password,user.salt);
        user.temporary=false;
        state.sessions = state.sessions.filter(item=>item.name!==user.name || item.idHash===currentHash);
        save(state);
        return send(200,{ok:true});
      }
      if (user.temporary) return send(403,{error:'Troque a senha temporária.'});
      if (route.endsWith('/equipe') && chief) {
        const name=String(body.name||'').toLowerCase().trim();
        if (!/^[a-z0-9][a-z0-9.-]{2,39}$/.test(name) || name==='editor-geral' || state.users.some(u=>u.name===name)) return send(400,{error:'Escolha um usuário novo com 3 a 40 caracteres.'});
        const password=token(),salt=token();
        state.users.push({name,salt,hash:digest(password,salt),temporary:true});
        save(state);
        return send(201,{name,password});
      }
      if (route==='/api/editores/conta' && chief) {
        const account=state.users.find(u=>u.name===body.name && u.name!=='editor-geral');
        if (!account || !['disable','enable','reset'].includes(body.action)) return send(400,{error:'Ação inválida.'});
        let password;
        if (body.action==='reset') {
          password=token();
          account.salt=token();
          account.hash=digest(password,account.salt);
          account.temporary=true;
        } else {
          account.disabled=body.action==='disable';
        }
        state.sessions = state.sessions.filter(item=>item.name!==account.name);
        save(state);
        return send(200,{password});
      }
      if (route==='/api/editores/gerenciar' && chief) {
        const article=state.articles.find(a=>a.id===body.id && ['Publicada','Arquivada'].includes(a.status));
        if (!article || ![0,1,2].includes(body.level) || typeof body.active!=='boolean') return send(400,{error:'Alteração inválida.'});
        article.level=body.level;
        article.status=body.active?'Publicada':'Arquivada';
        save(state);
        return send(200,{ok:true});
      }
      if (route.endsWith('/enviar')) {
        const title=String(body.title||'').trim(), content=String(body.content||'').trim(), level=body.level;
        if (!title || title.length>160 || !content || content.length>40000 || !levels[level] || !Number.isInteger(level)) return send(400,{error:'Confira o título, o texto e o destaque.'});
        let media=null;
        if (body.media) {
          const {type,data}=body.media;
          if (typeof data!=='string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return send(400,{error:'Arquivo inválido.'});
          const bytes=Buffer.from(data,'base64');
          const signature=bytes.subarray(0,12);
          const valid=(type==='image/jpeg' && signature.subarray(0,3).toString('hex')==='ffd8ff') ||
            (type==='image/png' && signature.subarray(0,8).toString('hex')==='89504e470d0a1a0a') ||
            (type==='image/webp' && signature.toString('ascii',0,4)==='RIFF' && signature.toString('ascii',8)==='WEBP') ||
            (type==='video/mp4' && signature.toString('ascii',4,8)==='ftyp');
          if (!valid || bytes.length>(type==='video/mp4'?16:5)*1024*1024) return send(400,{error:'Use JPG, PNG ou WebP até 5 MB ou MP4 até 16 MB.'});
          media={type,data};
        }
        const id=crypto.randomUUID();
        state.articles.push({id,title,content,level,media,mediaType:media?.type,author:user.name,status:chief?'Publicada':'Em revisão',created:new Date().toISOString(),published:chief?new Date().toISOString():undefined});
        save(state);
        return send(201,{ok:true,id});
      }
      if (route.endsWith('/revisar') && chief) {
        const article=state.articles.find(a=>a.id===body.id && a.status==='Em revisão');
        if (!article || ![0,1,2].includes(body.level) || typeof body.approve!=='boolean') return send(400,{error:'Revisão inválida.'});
        article.status=body.approve?'Publicada':'Recusada';
        article.level=body.level;
        article.published=new Date().toISOString();
        save(state);
        return send(200,{ok:true});
      }
      return send(403,{error:'Acesso restrito ao editor-geral.'});
    } catch (error) {
      if (!res.headersSent) respond(res,error instanceof SyntaxError?400:500,{error:'Não foi possível concluir a solicitação.'});
    }
  };
};
