from PIL import Image, ImageEnhance, ImageDraw
import os, json, math, time

SRC_DIR = 'C:/Users/junio/projeto codex/assets/pubpaid/sprite-candidates/hyperreal-main-options-v1'
OUT = 'C:/Users/junio/projeto codex/assets/pubpaid/sprite-candidates/hyperreal-main-options-anim-v1'
os.makedirs(OUT, exist_ok=True)
W, H = 96, 144
ROWS = ['down','down-right','right','up-right','up','up-left','left','down-left']
ANIMS = ['idle_breathe','walk','idle_phone','wave','receive_item','win_pose']
CHARS = {
    'caio_pix': {
        'name': 'Caio Pix',
        'role': 'protagonista masculino / carteira digital / rua-bar',
        'front': os.path.join(SRC_DIR, 'caio_pix_master_front_96x144_alpha.png'),
        'accent': (16, 245, 122, 255),
        'skin': (198, 135, 92, 255),
        'gold': (230, 184, 74, 255),
    },
    'rafa_dealer': {
        'name': 'Rafa Dealer',
        'role': 'protagonista feminina premium / dealer estrategista',
        'front': os.path.join(SRC_DIR, 'rafa_dealer_master_front_96x144_alpha.png'),
        'accent': (26, 255, 150, 255),
        'skin': (178, 118, 82, 255),
        'gold': (238, 188, 82, 255),
    },
}

def paste_center(dst, src, dx=0, dy=0):
    x = (W - src.width) // 2 + dx
    y = dy
    dst.alpha_composite(src, (x, y))

def darken(im, factor=0.72):
    r, g, b, a = im.split()
    rgb = Image.merge('RGB', (r, g, b))
    rgb = ImageEnhance.Brightness(rgb).enhance(factor)
    return Image.merge('RGBA', (*rgb.split(), a))

def tint(im, color=(10, 12, 14), amount=0.35):
    mask = im.getchannel('A')
    solid = Image.new('RGBA', im.size, color + (int(255 * amount),))
    out = im.copy()
    out.alpha_composite(solid)
    out.putalpha(mask)
    return out

def make_dir(front, dir_idx):
    # Direction proxies from a true front concept. Review draft, not final directional art.
    if dir_idx == 0:
        return front.copy()
    if dir_idx == 1:
        im = front.resize((88, H), Image.Resampling.LANCZOS)
        d = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        paste_center(d, im, dx=3)
        overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rectangle([0, 0, 40, H], fill=(0, 0, 0, 25))
        d.alpha_composite(overlay)
        return d
    if dir_idx == 2:
        im = front.resize((72, H), Image.Resampling.LANCZOS)
        d = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        paste_center(d, im, dx=8)
        return darken(d, 0.92)
    if dir_idx == 3:
        im = make_dir(front, 2)
        return tint(darken(im, 0.74), (9, 12, 18), 0.28)
    if dir_idx == 4:
        im = darken(front.copy(), 0.58)
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        d.rounded_rectangle([34, 40, 62, 88], radius=5, fill=(12, 18, 24, 96))
        d.ellipse([32, 14, 64, 43], fill=(18, 14, 12, 90))
        im.alpha_composite(ov)
        return im
    if dir_idx == 5:
        return make_dir(front, 3).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if dir_idx == 6:
        return make_dir(front, 2).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if dir_idx == 7:
        return make_dir(front, 1).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return front.copy()

def add_shadow(frame):
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    d.ellipse([30, 131, 66, 140], fill=(0, 0, 0, 72))
    sh.alpha_composite(frame)
    return sh

def compose_anim_frame(master, anim, frame_idx, meta, dir_idx):
    f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    im = master.copy()
    if anim == 'idle_breathe':
        dy = [0, -1, 0, 1][frame_idx]
        if frame_idx == 1:
            im = im.resize((W, 145), Image.Resampling.LANCZOS).crop((0, 0, W, H))
        f.alpha_composite(im, (0, dy))
    elif anim == 'walk':
        upper = im.crop((0, 0, W, 88))
        lower = im.crop((0, 88, W, H))
        xoff = [-2, 1, 2, -1][frame_idx]
        yoff = [0, -2, 0, -1][frame_idx]
        f.alpha_composite(upper, (0, yoff))
        legx = [2, -2, -1, 1][frame_idx]
        if dir_idx in (2, 3, 5, 6):
            legx *= 2
        f.alpha_composite(lower, (legx + xoff // 2, 88 - yoff // 2))
    elif anim == 'idle_phone':
        f.alpha_composite(im, (0, [0, 0, -1, 0][frame_idx]))
        d = ImageDraw.Draw(f)
        px = 60 if dir_idx not in (5, 6, 7) else 31
        py = [74, 68, 62, 68][frame_idx]
        d.rounded_rectangle([px, py, px + 8, py + 14], radius=2, fill=(8, 12, 18, 255), outline=meta['accent'])
        d.rectangle([px + 2, py + 3, px + 6, py + 10], fill=(0, 230, 160, 210))
    elif anim == 'wave':
        # Subtle review gesture: avoid fake cartoon limbs over hyper-real art.
        # Final production should redraw the arm/hand per direction.
        f.alpha_composite(im, (0, [0, -1, 0, 0][frame_idx]))
        d = ImageDraw.Draw(f)
        accent = meta['accent']
        side_right = dir_idx not in (5, 6, 7)
        px = 66 if side_right else 25
        py = [59, 55, 51, 55][frame_idx]
        d.ellipse([px - 2, py - 2, px + 4, py + 4], fill=(255, 205, 142, 210), outline=(45, 32, 25, 180))
        if frame_idx in (1, 2):
            d.arc([px - 8, py - 8, px + 10, py + 10], 210, 320, fill=accent, width=1)
    elif anim == 'receive_item':
        # Small object/hand-highlight only. Avoid large procedural hands.
        f.alpha_composite(im, (0, [0, -1, 0, 0][frame_idx]))
        d = ImageDraw.Draw(f)
        gold = meta['gold']
        y = [76, 73, 70, 73][frame_idx]
        d.ellipse([39, y, 44, y + 5], fill=(255, 205, 142, 160))
        d.ellipse([52, y, 57, y + 5], fill=(255, 205, 142, 160))
        if frame_idx >= 1:
            d.rounded_rectangle([44, y - 8, 53, y], radius=2, fill=gold, outline=(90, 60, 20, 235))
            d.line([46, y - 5, 51, y - 5], fill=(255, 240, 150, 255), width=1)
    elif anim == 'win_pose':
        # Celebration draft: body bounce + coin/token glow. No fake raised arms.
        f.alpha_composite(im, (0, [-1, -2, -1, 0][frame_idx]))
        d = ImageDraw.Draw(f)
        gold = meta['gold']
        accent = meta['accent']
        cx, cy = 49, 48 - frame_idx
        d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=gold, outline=(90, 60, 20, 255))
        for a in range(0, 360, 90):
            d.line([cx, cy, cx + int(math.cos(math.radians(a)) * 9), cy + int(math.sin(math.radians(a)) * 9)], fill=accent, width=1)
    return add_shadow(f)

manifest = {
    'created_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
    'status': 'review draft; generated from hyperreal front concepts; not applied to runtime; side/back and gesture overlays need manual art pass before production',
    'frame_size': [W, H],
    'sheet_size': [W * 4, H * 8],
    'columns': 4,
    'rows': ROWS,
    'animations': ANIMS,
    'anchor': [48, 138],
    'hitbox': {'x': 34, 'y': 96, 'w': 30, 'h': 39},
    'hurtbox': {'x': 25, 'y': 18, 'w': 46, 'h': 118},
    'interaction_box': {'front': {'x': 28, 'y': 92, 'w': 40, 'h': 42}},
    'characters': {},
}

for cid, meta in CHARS.items():
    front = Image.open(meta['front']).convert('RGBA')
    dirs = [make_dir(front, i) for i in range(8)]
    cdir = os.path.join(OUT, cid)
    os.makedirs(cdir, exist_ok=True)
    charrec = {'name': meta['name'], 'role': meta['role'], 'sheets': {}, 'quality_notes': []}
    for anim in ANIMS:
        sheet = Image.new('RGBA', (W * 4, H * 8), (0, 0, 0, 0))
        for row, master in enumerate(dirs):
            for col in range(4):
                frame = compose_anim_frame(master, anim, col, meta, row)
                sheet.alpha_composite(frame, (col * W, row * H))
        path = os.path.join(cdir, f'{cid}_{anim}_8dir_4f.png')
        sheet.save(path)
        charrec['sheets'][anim] = os.path.relpath(path, OUT).replace('\\', '/')
    board = Image.new('RGB', (4 * 160, len(ANIMS) * 210), (8, 8, 10))
    d = ImageDraw.Draw(board)
    y = 0
    for anim in ANIMS:
        sheet = Image.open(os.path.join(cdir, f'{cid}_{anim}_8dir_4f.png')).convert('RGBA')
        for col, row in enumerate([0, 2, 4, 6]):
            fr = sheet.crop((0, row * H, W, row * H + H)).resize((96, 144), Image.Resampling.NEAREST)
            bg = Image.new('RGBA', (150, 176), (18, 18, 22, 255))
            bg.alpha_composite(fr, ((150 - 96) // 2, 8))
            board.paste(bg.convert('RGB'), (col * 160 + 5, y + 24))
            d.text((col * 160 + 8, y + 2), ROWS[row], fill=(0, 255, 120))
        d.text((8, y + 184), anim, fill=(255, 220, 90))
        y += 210
    board_path = os.path.join(cdir, f'{cid}_animation_contact_board.png')
    board.save(board_path)
    charrec['contact_board'] = os.path.relpath(board_path, OUT).replace('\\', '/')
    manifest['characters'][cid] = charrec

boards = []
for cid in CHARS:
    p = os.path.join(OUT, cid, f'{cid}_animation_contact_board.png')
    im = Image.open(p).convert('RGB')
    boards.append((cid, im))
combined = Image.new('RGB', (boards[0][1].width * 2 + 30, boards[0][1].height + 50), (5, 5, 7))
d = ImageDraw.Draw(combined)
for i, (cid, im) in enumerate(boards):
    x = i * (im.width + 30)
    combined.paste(im, (x, 40))
    d.text((x + 10, 10), CHARS[cid]['name'], fill=(0, 255, 120))
combined_path = os.path.join(OUT, 'combined_animation_contact_board.png')
combined.save(combined_path)
manifest['combined_contact_board'] = 'combined_animation_contact_board.png'

html_data = {'rows': ROWS, 'animations': ANIMS, 'characters': {}}
for cid, rec in manifest['characters'].items():
    html_data['characters'][cid] = {'name': rec['name'], 'role': rec['role'], 'sheets': rec['sheets']}

html_template = r'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>PubPaid - Hyperreal Main Character Animation Review v1</title>
<style>
:root{--bg:#050705;--panel:#0b120e;--green:#00ff7a;--gold:#e6b84a;--red:#ff355d;--muted:#8fbf9f;}
*{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at top,#102018,#050705 50%);color:#dfffe9;font-family:Arial,Helvetica,sans-serif;}
header{padding:18px 22px;border-bottom:1px solid #0f3;color:var(--green);background:#020402;position:sticky;top:0;z-index:2} h1{font-size:20px;margin:0 0 6px} p{margin:4px 0;color:#b8d8c0}.wrap{display:grid;grid-template-columns:360px 1fr;gap:18px;padding:18px}.panel{background:rgba(5,12,9,.92);border:1px solid rgba(0,255,122,.25);border-radius:14px;padding:14px;box-shadow:0 0 22px rgba(0,255,122,.08)}label{display:block;margin-top:12px;color:var(--green);font-size:12px;text-transform:uppercase;letter-spacing:.08em}select,button{width:100%;background:#07110b;color:#dfffe9;border:1px solid rgba(0,255,122,.45);border-radius:10px;padding:10px;margin-top:6px}button{cursor:pointer}button:hover{background:#0d1f14}.stage{min-height:520px;display:grid;grid-template-columns:1fr 330px;gap:14px}.scene{position:relative;min-height:520px;border-radius:14px;overflow:hidden;background:linear-gradient(#15100b,#20140c 62%,#0c0c0c 63%);border:1px solid rgba(230,184,74,.25)}.floor{position:absolute;left:0;right:0;bottom:0;height:38%;background:repeating-linear-gradient(90deg,#2b160b 0 70px,#241006 70px 140px);border-top:4px solid #5b3516}.neon{position:absolute;left:24px;top:24px;color:#00ff7a;text-shadow:0 0 10px #00ff7a;font-weight:bold}.bar{position:absolute;right:36px;top:130px;width:220px;height:90px;border-radius:14px;background:#4b210d;border:2px solid #b87826;box-shadow:0 10px 0 #1e0c04}.spriteWrap{position:absolute;left:50%;bottom:92px;width:96px;height:144px;transform:translateX(-50%) scale(3);transform-origin:bottom center;image-rendering:auto}.sprite{width:96px;height:144px;background-repeat:no-repeat;background-size:384px 1152px;image-rendering:auto;filter:drop-shadow(0 8px 3px rgba(0,0,0,.65))}.pixelated .sprite{image-rendering:pixelated}.box{position:absolute;pointer-events:none;display:none}.showBoxes .hitbox{display:block;left:34px;top:96px;width:30px;height:39px;border:1px solid #ff355d;background:rgba(255,53,93,.16)}.showBoxes .hurtbox{display:block;left:25px;top:18px;width:46px;height:118px;border:1px solid #00d1ff;background:rgba(0,209,255,.08)}.info code{color:#fff;background:#07110b;border:1px solid rgba(0,255,122,.18);padding:2px 4px;border-radius:4px}.sheets{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:14px}.sheet{width:100%;background:#111;border:1px solid rgba(0,255,122,.25);border-radius:10px;image-rendering:pixelated}.badge{display:inline-block;padding:3px 8px;border:1px solid rgba(0,255,122,.4);border-radius:999px;color:#00ff7a;margin-right:6px}.warn{color:#ffd36a;border-left:3px solid #e6b84a;padding-left:10px}.small{font-size:12px;color:#9db7a5}@media(max-width:900px){.wrap{grid-template-columns:1fr}.stage{grid-template-columns:1fr}.spriteWrap{transform:translateX(-50%) scale(2.4)}}
</style>
</head>
<body>
<header><h1>PubPaid - revisão de animações dos novos protagonistas v1</h1><p>Visualização local antes de aprovação geral. Não aplicado no runtime.</p></header>
<div class="wrap">
<section class="panel">
  <div class="warn"><b>Status honesto:</b> animações draft feitas a partir dos conceitos hiper-realistas frontais. Idle/walk/gestos estão testáveis; lados/costas ainda precisam passe manual para produção final.</div>
  <label>Personagem</label><select id="character"></select>
  <label>Animação</label><select id="animation"></select>
  <label>Direção</label><select id="direction"></select>
  <label>Velocidade</label><select id="speed"><option value="260">lento</option><option value="180" selected>normal</option><option value="110">rápido</option></select>
  <button id="toggleBoxes">Alternar hitbox/hurtbox</button>
  <button id="togglePixels">Alternar pixelated/suave</button>
  <button id="pause">Pausar/rodar</button>
  <hr style="border-color:rgba(0,255,122,.18)">
  <p><span class="badge">96x144</span><span class="badge">8 direções</span><span class="badge">4 frames</span></p>
  <p class="small">Controles mudam background-position do PNG sheet real. Caminhos relativos são testados por JS.</p>
</section>
<section class="stage">
  <div class="scene" id="scene"><div class="neon">PUBPAID BAR</div><div class="bar"></div><div class="floor"></div><div class="spriteWrap" id="spriteWrap"><div class="sprite" id="sprite"><div class="box hitbox"></div><div class="box hurtbox"></div></div></div></div>
  <div class="panel info"><h2 id="charName"></h2><p id="charRole"></p><p><b>Animações:</b> idle_breathe, walk, idle_phone, wave, receive_item, win_pose.</p><p><b>Anchor:</b> <code>48,138</code></p><p><b>Hitbox:</b> <code>x34 y96 w30 h39</code></p><p><b>Próximo passe:</b> redesenhar direções laterais/costas e limpar braço/mão dos gestos.</p></div>
</section>
<section class="panel" style="grid-column:1/-1"><h2>Sprite sheets gerados</h2><div id="sheetList" class="sheets"></div></section>
</div>
<script>
const DATA = __DATA__;
const FW=96, FH=144;
let frame=0, timer=null, paused=false;
const $=id=>document.getElementById(id);
function fill(){
  for(const [id,c] of Object.entries(DATA.characters)){ $('character').insertAdjacentHTML('beforeend',`<option value="${id}">${c.name}</option>`); }
  DATA.animations.forEach(a=>$('animation').insertAdjacentHTML('beforeend',`<option value="${a}">${a}</option>`));
  DATA.rows.forEach((d,i)=>$('direction').insertAdjacentHTML('beforeend',`<option value="${i}">${d}</option>`));
}
function current(){ const cid=$('character').value, anim=$('animation').value, dir=Number($('direction').value); return {cid, anim, dir, c:DATA.characters[cid]}; }
function render(){
  const {anim,dir,c}=current();
  const path=c.sheets[anim];
  const spr=$('sprite');
  spr.style.backgroundImage=`url('${path}')`;
  spr.style.backgroundPosition=`-${frame*FW}px -${dir*FH}px`;
  $('charName').textContent=c.name;
  $('charRole').textContent=c.role;
}
function rebuildSheets(){
 const {c}=current(); const box=$('sheetList'); box.innerHTML='';
 for(const [anim,path] of Object.entries(c.sheets)){
   const card=document.createElement('div'); card.innerHTML=`<p><b>${anim}</b><br><span class="small">${path}</span></p><img class="sheet" src="${path}" alt="${anim}">`; box.appendChild(card);
 }
}
function tick(){ if(!paused){ frame=(frame+1)%4; render(); } }
function restart(){ clearInterval(timer); timer=setInterval(tick, Number($('speed').value)); render(); rebuildSheets(); }
fill(); restart();
['character','animation','direction','speed'].forEach(id=>$(id).addEventListener('change',restart));
$('toggleBoxes').onclick=()=>$('spriteWrap').classList.toggle('showBoxes');
$('togglePixels').onclick=()=>document.body.classList.toggle('pixelated');
$('pause').onclick=()=>{paused=!paused;};
</script>
</body></html>'''
html = html_template.replace('__DATA__', json.dumps(html_data, ensure_ascii=False))
html_path = os.path.join(OUT, 'index.html')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
manifest['html'] = 'index.html'
manifest_path = os.path.join(OUT, 'manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print('OUT', OUT)
print('HTML', html_path)
print('MANIFEST', manifest_path)
print('BOARD', combined_path)
for cid in CHARS:
    print(cid, len(os.listdir(os.path.join(OUT, cid))), 'files')
