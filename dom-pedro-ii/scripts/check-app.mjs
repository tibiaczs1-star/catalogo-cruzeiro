import fs from 'node:fs';
const html = fs.readFileSync('prototipo.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const required = ['inicio', 'reforco', 'atividades', 'materiais', 'conversas', 'apoio', 'campanhas', 'noticias', 'manual', 'escola', 'emergencyModal', 'loginModal'];
for (const id of required) if (!html.includes('id="' + id + '"')) throw new Error('Módulo ausente: ' + id);
if (manifest.display !== 'standalone') throw new Error('Manifesto não configurado como aplicativo');
if (!html.includes('assets/app.css')) throw new Error('Folha de estilo do app não referenciada');
for (const file of [
  'sw.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon.png',
  'assets/app.css',
  'assets/brand/campus.jpg',
  'assets/brand/hero.jpg',
  'assets/brand/crest-128.png',
  'assets/brand/crest-256.png',
  'assets/brand/desfile-sm.jpg',
  'assets/brand/podium-sm.jpg',
  'assets/brand/site-preview.jpg'
]) if (!fs.existsSync(file)) throw new Error('Arquivo ausente: ' + file);
if (!html.includes('Dom Pedro II<br>Voice') && !html.includes('Dom Pedro II Voice')) throw new Error('Nome Dom Pedro II Voice ausente em prototipo.html');
if (html.includes('Donpedro') || html.includes('<h1>Voz do<br>Professor</h1>')) throw new Error('Título antigo ainda presente em prototipo.html');
const official = 'https://colegiodompedro2czs.com.br/site-cmdpii/';
if (!html.includes(official)) throw new Error('Link para o site oficial ausente');
console.log('OK: app do aluno Dom Pedro II Voice com identidade do colégio, site oficial vinculado e todos os módulos presentes.');