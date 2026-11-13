const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = function newsroom(directory) {
  const file = path.join(directory, 'newsroom-private.json');
  const digest = (secret, salt) => crypto.scryptSync(secret, salt, 64).toString('hex');
  const token = () => crypto.randomBytes(24).toString('base64url');
  const sessions = new Map();
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
      const sessionId = /(?:^|; )czs_editor=([\w-]+)/.exec(req.headers.cookie || '')?.[1];
      const now = Date.now();
      const session = sessions.get(sessionId);
      const user = session?.until > now && state.users.find(u=>u.name===session.name);
      const chief = user?.name === 'editor-geral';
      const send = (status,data)=>respond(res,status,data);
      if (req.method === 'POST' && route.endsWith('/login')) {
        if (now > windowEnd) { attempts=0; windowEnd=now+60000; }
        if (++attempts > 25) return send(429,{error:'Aguarde um minuto.'});
        const name = String(body.name || '').toLowerCase().trim();
        const password = String(body.password || '');
        if (password.length > 256) return send(400,{error:'Senha inválida.'});
        let account = state.users.find(u=>u.name===name);
        if (!account && name==='editor-geral' && process.env.CZS_EDITOR_INITIAL_HASH) {
          const [salt,hash] = process.env.CZS_EDITOR_INITIAL_HASH.split(':');
          account={name,salt,hash,temporary:true};
        }
        const actual = digest(password,account?.salt || 'invalid-account');
        if (!account || !/^[a-f0-9]{128}$/.test(account.hash) || !crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(account.hash,'hex'))) return send(401,{error:'Usuário ou senha inválidos.'});
        if (!state.users.includes(account)) {state.users.push(account);save(state);}
        for (const [id,value] of sessions) if (value.until <= now || id===sessionId) sessions.delete(id);
        const id=token();
        sessions.set(id,{name,until:now+8*3600000});
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
      if (!user) return send(401,{error:'Entre para continuar.'});
      if (req.method==='GET' && route==='/api/editores') return send(200,{name:user.name,chief,temporary:user.temporary,articles:user.temporary?[]:state.articles.filter(a=>chief||a.author===user.name).map(({media,...a})=>({...a,hasMedia:Boolean(media)}))});
      if (req.method!=='POST') return send(404,{error:'Página indisponível.'});
      if (route.endsWith('/sair')) {
        sessions.delete(sessionId);
        return send(200,{ok:true});
      }
      if (route.endsWith('/senha')) {
        if (typeof body.password!=='string' || body.password.length<14 || body.password.length>256 || digest(body.password,user.salt)===user.hash) return send(400,{error:'Escolha outra senha com pelo menos 14 caracteres.'});
        user.salt=token();
        user.hash=digest(body.password,user.salt);
        user.temporary=false;
        save(state);
        for (const [id,value] of sessions) if (value.name===user.name && id!==sessionId) sessions.delete(id);
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
        state.articles.push({id:crypto.randomUUID(),title,content,level,media,mediaType:media?.type,author:user.name,status:'Em revisão',created:new Date().toISOString()});
        save(state);
        return send(201,{ok:true});
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
