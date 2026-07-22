const stills = [
  '6ffa85aa-813c-4136-b2e8-0ff248324533.JPG.jpeg','IMG_0406.jpeg','IMG_0407.jpeg','IMG_0449.jpeg','5f9195c0-957a-44e8-ba89-f8e0291b8a32.JPG.jpeg','IMG_0602.jpeg','IMG_0605.jpeg','IMG_0657.jpeg','259b0ccb-9b2a-4b97-b0e2-fc2d09eee812.JPG.jpeg','bc0cea41-9f73-4f8a-a754-04290a741733.JPG.jpeg','1c69e6fc-05f9-4ad6-9d4f-5e595f645762.JPG.jpeg','21496ee4-5f41-4ea0-850e-85ffb099a475.JPG.jpeg','5200325f-1857-4517-8fbc-c4fcabd0ab73.JPG.jpeg','1999e35b-ef92-41c8-b717-9df2e47bd880.JPG.jpeg','6a2f159a-5513-4df7-8214-a58ea0caca22.JPG.jpeg','5b61d66c-39e7-4868-a193-230185470d4d.JPG.jpeg','IMG_0767.jpeg','IMG_0812.jpeg','IMG_0816.jpeg','IMG_0817.jpeg','IMG_0818.jpeg','IMG_0830.jpeg','IMG_0903.jpeg','87189062-434a-437b-aea5-2b0afaaadfe2.JPG.jpeg','304aa290-f2bc-43fc-b953-0b427eba0cc3.JPG.jpeg','3b0d5937-0611-43cc-8b7e-81dd4cb1b44f.JPG.jpeg','96cd42f8-7399-42a1-a6cf-26aceb41ecc2.JPG.jpeg','IMG_1127.jpeg','IMG_1128.jpeg','IMG_1129.jpeg','IMG_1130.jpeg','IMG_1154.jpeg','IMG_1200.jpeg','IMG_1201.jpeg'
];

const scenes = [
  { type: 'studio', title: 'Casting Studio', kicker: '01 / SCREEN TEST', files: stills.slice(0, 7) },
  { type: 'devices', title: 'Pocket Editorial', kicker: '02 / DIGITAL COVER', files: stills.slice(7, 14) },
  { type: 'broadcast', title: 'On Air', kicker: '03 / FASHION SIGNAL', files: stills.slice(14, 21) },
  { type: 'lightbox', title: 'Contact Sheet', kicker: '04 / THE SELECTION', files: stills.slice(21, 28) },
  { type: 'cinema', title: 'Final Look', kicker: '05 / AFTER DARK', files: stills.slice(28) }
];

const img = (file, index, className = '') => `<img class="${className}" src="assets/${file}" alt="Raiane Leoncio — fotografia editorial ${index + 1}" loading="lazy">`;
const page = (file, index, kind = '') => `<figure class="mag-page ${kind}">${img(file, index)}<figcaption><span>${String(index + 1).padStart(2, '0')}</span><span>RAIANE LEONCIO</span></figcaption></figure>`;

function renderScene(scene, sceneIndex) {
  const start = scenes.slice(0, sceneIndex).reduce((total, item) => total + item.files.length, 0);
  const [a, b, c, d, e, f, g] = scene.files;
  const globalIndex = offset => start + offset;
  let composition = '';
  if (scene.type === 'studio') composition = `
    <div class="photo-atmosphere parallax" data-speed="0.08">${img(a, globalIndex(0))}</div>
    <div class="mag-layout layout-studio">
      <div class="open-spread">${page(a,globalIndex(0),'page-left')}${page(b,globalIndex(1),'page-right')}</div>
      ${page(c,globalIndex(2),'cover cover-a')}${page(d,globalIndex(3),'cover cover-b')}
      <div class="page-ribbon">${[e,f,g].map((file,i)=>page(file,globalIndex(i+4))).join('')}</div>
    </div>`;
  else if (scene.type === 'devices') composition = `
    <div class="editorial-word" aria-hidden="true">RAIANE</div>
    <div class="mag-layout layout-orbit">
      ${page(a,globalIndex(0),'hero-cover parallax')}
      <div class="open-spread spread-left">${page(b,globalIndex(1),'page-left')}${page(c,globalIndex(2),'page-right')}</div>
      ${page(d,globalIndex(3),'cover side-cover')}
      <div class="page-ribbon">${[e,f,g].map((file,i)=>page(file,globalIndex(i+4))).join('')}</div>
    </div>`;
  else if (scene.type === 'broadcast') composition = `
    <div class="photo-atmosphere parallax" data-speed="0.07">${img(a,globalIndex(0))}</div>
    <div class="mag-layout layout-signal">
      <div class="open-spread signal-spread">${page(a,globalIndex(0),'page-left')}${page(b,globalIndex(1),'page-right')}</div>
      ${page(c,globalIndex(2),'cover signal-cover')}
      <div class="contact-ribbon">${[d,e,f,g].map((file,i)=>page(file,globalIndex(i+3))).join('')}</div>
    </div>`;
  else if (scene.type === 'lightbox') composition = `
    <div class="mag-layout contact-sheet">${scene.files.map((file,i)=>page(file,globalIndex(i),`contact-${i+1}`)).join('')}</div>`;
  else composition = `
    <div class="photo-atmosphere parallax" data-speed="0.08">${img(a,globalIndex(0))}</div>
    <div class="mag-layout layout-final">
      <div class="open-spread final-spread">${page(a,globalIndex(0),'page-left')}${page(b,globalIndex(1),'page-right')}</div>
      ${page(c,globalIndex(2),'cover final-cover')}
      <div class="page-ribbon">${[d,e,f].filter(Boolean).map((file,i)=>page(file,globalIndex(i+3))).join('')}</div>
    </div>`;

  return `<section class="gallery-scene scene-${scene.type} reveal" aria-label="${scene.title}">
    <header class="scene-heading"><span>${scene.kicker}</span><h3>${scene.title}</h3></header>
    <div class="scene-composition">${composition}</div>
    <footer class="scene-footer"><span>RAIANE LEONCIO</span><span>${String(start + 1).padStart(2, '0')} — ${String(start + scene.files.length).padStart(2, '0')}</span></footer>
  </section>`;
}

document.querySelector('#gallery').innerHTML = scenes.map(renderScene).join('');

const motion = [
  { file: 'IMG_0224.GIF', type: 'image', label: 'MOTION PORTRAIT' },
  { file: 'runway-film.mp4', type: 'video', label: 'RUNWAY FILM' }
];

const motionGrid = document.querySelector('#motion-grid');
motion.forEach((item, i) => {
  const el = document.createElement('article');
  el.className = 'motion-item reveal';
  const media = item.type === 'video'
    ? `<video src="assets/${item.file}" muted loop playsinline controls preload="metadata"></video>`
    : `<img src="assets/${item.file}" alt="Raiane Leoncio em movimento" loading="lazy">`;
  el.innerHTML = `${media}<div class="motion-caption"><span>${item.label}</span><span>0${i + 1} / 0${motion.length}</span></div>`;
  motionGrid.appendChild(el);
});

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add('is-visible');
    const video = entry.target.querySelector('video');
    if (video) video.play().catch(() => {});
  } else {
    const video = entry.target.querySelector('video');
    if (video) video.pause();
  }
}), { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const progress = document.querySelector('.progress');
const parallaxLayers = [...document.querySelectorAll('.parallax')];
let ticking = false;

function updateMotion() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max ? scrollY / max * 100 : 0}%`;
  parallaxLayers.forEach(layer => {
    const rect = layer.closest('.gallery-scene').getBoundingClientRect();
    const speed = Number(layer.dataset.speed || (layer.classList.contains('hero-phone') ? -0.05 : 0.06));
    const travel = (innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
    layer.style.setProperty('--parallax-y', `${travel.toFixed(1)}px`);
  });
  ticking = false;
}

addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateMotion);
    ticking = true;
  }
}, { passive: true });
updateMotion();
