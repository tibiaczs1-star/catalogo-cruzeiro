import {randomUUID} from 'node:crypto';
export function registerPedagogy(app, {db,auth,cleanText,metrics,passwordHashAsync,voiceMetrics,tutorMetrics}) {
  db.exec(`CREATE TABLE IF NOT EXISTS teaching_assignments(teacher_id INTEGER NOT NULL REFERENCES users(id),student_id INTEGER NOT NULL REFERENCES users(id),PRIMARY KEY(teacher_id,student_id));
  CREATE TABLE IF NOT EXISTS assessments(id INTEGER PRIMARY KEY,student_id INTEGER NOT NULL REFERENCES users(id),teacher_id INTEGER NOT NULL REFERENCES users(id),subject TEXT NOT NULL,skill TEXT NOT NULL,score REAL NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS wellbeing(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),feeling TEXT NOT NULL,recipient TEXT NOT NULL,note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE INDEX IF NOT EXISTS doubts_user ON doubts(user_id,subject);
  CREATE INDEX IF NOT EXISTS tasks_user ON tasks(user_id,completed);
  CREATE INDEX IF NOT EXISTS support_school ON support_messages(school_id,recipient);
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS assessments_student ON assessments(student_id,subject);`);
  const direction=u=>['admin','direction'].includes(u.role);
  const team=(req,res,next)=>['teacher','pedagogy','direction','admin'].includes(req.user.role)?next():res.status(403).json({error:'Acesso restrito à equipe escolar.'});
  const canTeach=(u,id)=>u.role==='teacher' && !!db.prepare(`SELECT 1 FROM teaching_assignments a JOIN users s ON s.id=a.student_id WHERE a.teacher_id=? AND a.student_id=? AND s.school_id=? AND s.role='student'`).get(u.id,id,u.school_id);
  const scopedStudents=u=> db.prepare(`SELECT id,name,grade FROM users WHERE school_id=? AND role='student' AND active=1 ${u.role==='teacher'?'AND id IN (SELECT student_id FROM teaching_assignments WHERE teacher_id=?)':''} ORDER BY name`).all(...(u.role==='teacher'?[u.school_id,u.id]:[u.school_id]));
  app.get('/api/team/dashboard',auth,team,(req,res)=>{
    const u=req.user;
    if(u.role==='pedagogy') return res.json({role:u.role,students:[],subjects:[],doubts:[],wellbeing:[],support:db.prepare(`SELECT s.id,s.body,s.risk_flag,s.status,s.created_at,u.anonymous_alias alias FROM support_messages s JOIN users u ON u.id=s.user_id WHERE s.school_id=? AND s.recipient IN ('Coordenação pedagógica','Pedagogo(a)','pedagogia') ORDER BY s.risk_flag DESC,s.id DESC LIMIT 100`).all(u.school_id)});
    const students=scopedStudents(u);
    const ids=students.map(s=>s.id);
    const marks=ids.map(()=>'?').join(',') || 'NULL';
    // Counts indicate demand, never a diagnosis of learning deficit.
    const subjects=db.prepare(`SELECT subject,COUNT(*) requests,COUNT(DISTINCT user_id) students FROM doubts WHERE user_id IN (${marks}) GROUP BY subject ORDER BY requests DESC`).all(...ids).map(s=>({...s,...db.prepare(`SELECT ROUND(AVG(score),1) average,COUNT(*) assessments FROM assessments WHERE subject=? AND student_id IN (${marks})`).get(s.subject,...ids)}));
    const measured=db.prepare(`SELECT subject,ROUND(AVG(score),1) average,COUNT(*) assessments FROM assessments WHERE student_id IN (${marks}) GROUP BY subject`).all(...ids);
    for(const m of measured) if(!subjects.some(s=>s.subject===m.subject)) subjects.push({...m,requests:0,students:0});
    const doubts=u.role==='teacher'?db.prepare(`SELECT d.id,d.user_id,d.subject,d.text,d.answer,d.status,d.created_at,d.audio_path IS NOT NULL has_audio,u.name FROM doubts d JOIN users u ON u.id=d.user_id WHERE d.user_id IN (${marks}) ORDER BY d.id DESC LIMIT 100`).all(...ids):[];
    const wellbeing=u.role==='teacher'?db.prepare(`SELECT w.id,w.user_id,w.feeling,w.note,w.created_at,u.name FROM wellbeing w JOIN users u ON u.id=w.user_id WHERE w.user_id IN (${marks}) AND w.recipient='teacher' ORDER BY w.id DESC LIMIT 100`).all(...ids):db.prepare(`SELECT w.id,w.feeling,w.note,w.created_at,u.anonymous_alias alias FROM wellbeing w JOIN users u ON u.id=w.user_id WHERE u.school_id=? AND w.recipient='direction' ORDER BY w.id DESC LIMIT 100`).all(u.school_id);
    const support=direction(u)?db.prepare(`SELECT s.id,s.body,s.risk_flag,s.status,s.created_at,u.anonymous_alias alias FROM support_messages s JOIN users u ON u.id=s.user_id WHERE s.school_id=? AND s.recipient IN ('Direção','direcao') ORDER BY s.risk_flag DESC,s.id DESC LIMIT 100`).all(u.school_id):[];
    const crosses=u.role==='teacher'?students.map(s=>{
      const demand=db.prepare('SELECT subject,COUNT(*) requests FROM doubts WHERE user_id=? GROUP BY subject ORDER BY requests DESC').all(s.id);
      const learning=db.prepare('SELECT subject,ROUND(AVG(score),1) average,COUNT(*) assessments FROM assessments WHERE student_id=? GROUP BY subject').all(s.id);
      const overdue=db.prepare("SELECT COUNT(*) n FROM tasks WHERE user_id=? AND completed=0 AND julianday(due_at)<julianday('now')").get(s.id).n;
      const report=wellbeing.find(w=>w.user_id===s.id);
      const reasons=[];
      if(demand.some(d=>d.requests>=3)) reasons.push('Pedidos repetidos: oferecer reforço');
      if(learning.some(a=>a.average<6)) reasons.push('Avaliação abaixo de 6: revisar habilidade');
      if(overdue) reasons.push(`${overdue} atividade(s) atrasada(s): conversar sobre organização`);
      if(report) reasons.push('Relato voluntário: acolher e confirmar contexto');
      return {...s,demand,learning,overdue,report:report||null,reasons};
    }):[];
    res.json({role:u.role,students:u.role==='teacher'?students:[],studentCount:students.length,subjects,doubts,wellbeing,support,crosses,notice:'Pedidos indicam demanda. Defasagem exige avaliação. Sentimentos são autorrelatos voluntários; nenhuma emoção é inferida da voz.'});
  });
  app.post('/api/wellbeing',auth,(req,res)=>{
    if(req.user.role!=='student')return res.sendStatus(403);
    const feeling=cleanText(req.body.feeling,40),recipient=cleanText(req.body.recipient,20),note=cleanText(req.body.note,500);
    if(!['Bem','Triste','Preocupado(a)','Animado(a)','Quero conversar'].includes(feeling)||!['teacher','direction'].includes(recipient)||req.body.consent!==true)return res.status(400).json({error:'Escolha como está, destinatário e confirme o compartilhamento.'});
    const r=db.prepare('INSERT INTO wellbeing(user_id,feeling,recipient,note) VALUES(?,?,?,?)').run(req.user.id,feeling,recipient,note);
    res.status(201).json({id:Number(r.lastInsertRowid),status:'shared'});
  });
  app.post('/api/team/answer/:id',auth,team,(req,res)=>{
    const d=db.prepare('SELECT user_id FROM doubts WHERE id=?').get(Number(req.params.id));
    if(!d||!canTeach(req.user,d.user_id))return res.sendStatus(404);
    const answer=cleanText(req.body.answer,4000);
    if(!answer)return res.status(400).json({error:'Escreva a orientação.'});
    db.prepare("UPDATE doubts SET answer=?,status='answered' WHERE id=?").run(answer,Number(req.params.id));res.json({ok:true});
  });
  app.get('/api/team/audio/:id',auth,team,(req,res)=>{
    const d=db.prepare('SELECT user_id,audio_path,audio_mime FROM doubts WHERE id=?').get(Number(req.params.id));
    if(!d?.audio_path||!canTeach(req.user,d.user_id))return res.sendStatus(404);
    res.type(d.audio_mime).sendFile(d.audio_path);
  });
  app.post('/api/team/assessment',auth,team,(req,res)=>{
    const id=Number(req.body.studentId),score=Number(req.body.score),subject=cleanText(req.body.subject,80),skill=cleanText(req.body.skill,200);
    if(!canTeach(req.user,id))return res.sendStatus(404);
    if(!subject||!skill||req.body.score==null||req.body.score===''||!Number.isFinite(score)||score<0||score>10)return res.status(400).json({error:'Informe matéria, habilidade e nota de 0 a 10.'});
    db.prepare('INSERT INTO assessments(student_id,teacher_id,subject,skill,score) VALUES(?,?,?,?,?)').run(id,req.user.id,subject,skill,score);res.status(201).json({ok:true});
  });
  app.post('/api/team/task',auth,team,(req,res)=>{
    const id=Number(req.body.studentId),title=cleanText(req.body.title,200),subject=cleanText(req.body.subject,80),due=req.body.dueAt?new Date(req.body.dueAt):null;
    if(!canTeach(req.user,id))return res.sendStatus(404);
    if(!title||!subject||(due&&isNaN(due)))return res.status(400).json({error:'Preencha atividade, matéria e data válida.'});
    db.prepare('INSERT INTO tasks(user_id,title,subject,due_at) VALUES(?,?,?,?)').run(id,title,subject,due?.toISOString()||null);res.status(201).json({ok:true});
  });
  app.patch('/api/team/support/:id',auth,team,(req,res)=>{
    const row=db.prepare('SELECT recipient FROM support_messages WHERE id=? AND school_id=?').get(Number(req.params.id),req.user.school_id);
    const allowed=req.user.role==='pedagogy'?['Coordenação pedagógica','Pedagogo(a)','pedagogia']:direction(req.user)?['Direção','direcao']:[];
    if(!row||!allowed.includes(row.recipient))return res.sendStatus(404);
    if(!['received','in_progress','resolved'].includes(req.body.status))return res.sendStatus(400);
    db.prepare('UPDATE support_messages SET status=? WHERE id=?').run(req.body.status,Number(req.params.id));res.json({ok:true});
  });
  app.post('/api/team/account',auth,team,async(req,res)=>{
    if(!direction(req.user))return res.sendStatus(403);
    const role=cleanText(req.body.role,20),registration=cleanText(req.body.registration,50),name=cleanText(req.body.name,160),password=String(req.body.password||'');
    if(!['teacher','pedagogy','student'].includes(role)||!registration||!name||password.length<10||password.length>200)return res.status(400).json({error:'Informe nome, matrícula, perfil e senha com 10 caracteres.'});
    if(role==='student' && (name.split(/\s+/).length<2 || !cleanText(req.body.grade,80))) return res.status(400).json({error:'Informe pelo menos dois nomes e a série do aluno.'});
    try {
      const r=db.prepare('INSERT INTO users(school_id,registration,name,password_hash,role,grade,anonymous_alias) VALUES(?,?,?,?,?,?,?)').run(req.user.school_id,registration,name,await passwordHashAsync(password),role,cleanText(req.body.grade,80)||null,'Estudante '+randomUUID().slice(0,8));
      if(role==='teacher' && !db.prepare('SELECT 1 FROM teachers WHERE school_id=? AND LOWER(name)=LOWER(?)').get(req.user.school_id,name)){
        const disciplines=cleanText(req.body.disciplines||req.body.grade||'Geral',120);
        db.prepare('INSERT INTO teachers(school_id,name,disciplines,turmas,shift,contract,role,voice_preset,voice_name,voice_rate) VALUES(?,?,?,?,?,?,?,?,?,0)').run(req.user.school_id,name,disciplines,'Turmas vinculadas','Campus CZS','Efetivo','Docente','prof_fallback','Voz Padrão',0);
      }
      res.status(201).json({id:Number(r.lastInsertRowid)});
    }catch(e){if(String(e).includes('UNIQUE'))return res.status(409).json({error:'Matrícula já cadastrada.'});throw e;}
  });
  app.post('/api/team/materials',auth,team,(req,res)=>{
    if(!['teacher','direction','admin'].includes(req.user.role))return res.sendStatus(403);
    const subject=cleanText(req.body.subject,80),title=cleanText(req.body.title,160),description=cleanText(req.body.description,2000),kind=cleanText(req.body.kind||'material',40);
    if(!subject||!title||!description)return res.status(400).json({error:'Informe matéria, título e descrição do material.'});
    const r=db.prepare('INSERT INTO materials(school_id,subject,title,description,kind,published,reviewed_by,reviewed_at) VALUES(?,?,?,?,?,1,?,CURRENT_TIMESTAMP)').run(req.user.school_id,subject,title,description,kind,req.user.name);
    res.status(201).json({id:Number(r.lastInsertRowid)});
  });
  app.get('/api/team/accounts',auth,team,(req,res)=>{
    if(!direction(req.user))return res.sendStatus(403);
    res.json({accounts:db.prepare("SELECT id,name,registration,role,grade FROM users WHERE school_id=? AND role IN ('teacher','student','pedagogy') ORDER BY role,name").all(req.user.school_id),assignments:db.prepare('SELECT a.* FROM teaching_assignments a JOIN users t ON t.id=a.teacher_id WHERE t.school_id=?').all(req.user.school_id)});
  });
  app.post('/api/team/account/:id/reset-password',auth,team,async(req,res)=>{
    if(!direction(req.user))return res.sendStatus(403);
    const id=Number(req.params.id),password=String(req.body.password||'');
    if(!Number.isSafeInteger(id)||id<1||password.length<10||password.length>200)return res.status(400).json({error:'Informe uma senha de 10 a 200 caracteres.'});
    const account=db.prepare("SELECT id FROM users WHERE id=? AND school_id=? AND role IN ('teacher','pedagogy') AND active=1").get(id,req.user.school_id);
    if(!account)return res.sendStatus(404);
    const hash=await passwordHashAsync(password);
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
      db.exec('COMMIT');
    } catch(e) {db.exec('ROLLBACK');throw e;}
    res.json({ok:true});
  });
  app.post('/api/team/assign',auth,team,(req,res)=>{
    if(!direction(req.user))return res.sendStatus(403);
    const t=Number(req.body.teacherId),s=Number(req.body.studentId);
    if(!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='teacher'").get(t,req.user.school_id)||!db.prepare("SELECT 1 FROM users WHERE id=? AND school_id=? AND role='student'").get(s,req.user.school_id))return res.sendStatus(400);
    if(req.body.remove===true)db.prepare('DELETE FROM teaching_assignments WHERE teacher_id=? AND student_id=?').run(t,s);
    else db.prepare('INSERT OR IGNORE INTO teaching_assignments VALUES(?,?)').run(t,s);
    res.json({ok:true});
  });
  app.get('/api/developer/metrics',auth,(req,res)=>{
    if(req.user.role!=='developer')return res.sendStatus(403);
    const a=[...metrics.latency].sort((a,b)=>a-b);
    const prov = String(process.env.TUTOR_PROVIDER || '').trim().toLowerCase();
    const hasGoogle = Boolean(process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY_FALLBACK?.trim());
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());
    const tutorConfigured = prov === 'google' ? hasGoogle : prov === 'openrouter' ? hasOpenRouter : (!prov && (hasGoogle || hasOpenRouter));
    res.json({uptimeSeconds:Math.round((Date.now()-metrics.startedAt)/1000),requests:metrics.requests,errors:metrics.errors,p95Ms:Math.round(a[Math.min(a.length-1,Math.floor(a.length*.95))]||0),memoryMB:Math.round(process.memoryUsage().rss/1048576),googleConfigured:process.env.VOICE_PROVIDER==='google' && !!process.env.GOOGLE_API_KEY,tutor:{configured:tutorConfigured,answered:tutorMetrics?.answered||0,forwarded:tutorMetrics?.forwarded||0,unavailable:tutorMetrics?.unavailable||0},voice:{...voiceMetrics},voiceEmotionAnalysis:false});
  });
}
