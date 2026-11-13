const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const newsroom = require('../newsroom');

test('sessions survive restart and are revoked when an editor password is reset', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'czs-newsroom-'));
  const oldInitial = process.env.CZS_EDITOR_INITIAL_HASH;
  const oldRotation = process.env.CZS_EDITOR_ROTATION_HASH;
  const password = 'senha-de-teste-segura';
  const salt = 'isolated-test';
  process.env.CZS_EDITOR_INITIAL_HASH = salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
  delete process.env.CZS_EDITOR_ROTATION_HASH;
  let handler = newsroom(dir);
  const server = http.createServer((req,res)=>handler(req,res,new URL(req.url,'http://localhost')));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(route, body, cookie) {
    const response = await fetch(base+'/api/editores'+route,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {response,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  try {
    const login=await request('/login',{name:'editor-geral',password});
    assert.equal(login.response.status,200);
    const chief=login.cookie;
    assert.equal((await request('/senha',{password:'nova-senha-de-teste-segura'},chief)).response.status,200);
    const created=await request('/equipe',{name:'editor-teste'},chief);
    const editorLogin=await request('/login',{name:'editor-teste',password:created.data.password});
    const editor=editorLogin.cookie;
    assert.equal(editorLogin.response.status,200);
    await request('/senha',{password:'senha-editor-de-teste'},editor);
    const submitted=await request('/enviar',{title:'Teste isolado',content:'Conteúdo de teste.',level:1},editor);
    assert.equal(submitted.response.status,201);
    assert.ok(submitted.data.id);
    assert.equal((await request('',null,chief)).data.articles[0].status,'Em revisão');
    await request('/revisar',{id:submitted.data.id,level:1,approve:true},chief);
    assert.equal((await request('/publicadas')).data[0].id,submitted.data.id);
    handler=newsroom(dir);
    assert.equal((await request('',null,editor)).response.status,200);
    const stored=fs.readFileSync(path.join(dir,'newsroom-private.json'),'utf8');
    assert.ok(!stored.includes(editor.split('=')[1]));
    await request('/conta',{name:'editor-teste',action:'reset'},chief);
    assert.equal((await request('',null,editor)).response.status,401);
    await request('/sair',{},chief);
    assert.equal((await request('',null,chief)).response.status,401);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    if(oldInitial===undefined) delete process.env.CZS_EDITOR_INITIAL_HASH; else process.env.CZS_EDITOR_INITIAL_HASH=oldInitial;
    if(oldRotation===undefined) delete process.env.CZS_EDITOR_ROTATION_HASH; else process.env.CZS_EDITOR_ROTATION_HASH=oldRotation;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
