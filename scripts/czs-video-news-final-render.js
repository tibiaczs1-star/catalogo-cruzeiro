const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = process.env.CZS_VIDEO_OUT || path.join(ROOT, ".codex-temp", "czs-video-news-final-20260616");
const LOGO = process.env.CZS_BRAND_LOGO || path.join(ROOT, "assets", "brand", "catalogo-czs-logo-transparent-png-20260603", "02-logo-horizontal-sem-fundo.png");
const ACRE_TIME_ZONE = "America/Rio_Branco";

function clean(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value = "") {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function slugify(value = "") {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 76);
}

function isRealVideoUrl(value = "") {
  return /^https?:\/\/.+\.(?:mp4|m4v|mov|webm)(?:[?#].*)?$/i.test(String(value));
}

function localDayKey(value, timeZone = ACRE_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function isSameLocalDay(value, now = new Date()) {
  const publishedDay = localDayKey(value);
  return Boolean(publishedDay) && publishedDay === localDayKey(now);
}

function assEscape(value = "") {
  return clean(value).replace(/[{}]/g, "").replace(/\n/g, "\\N");
}

function wrap(value, width = 25, maxLines = 5) {
  const words = clean(value).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = `${line} ${word}`.trim();
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines).join("\\N");
}

function labelFor(item) {
  const text = normalize(`${item.title} ${item.category} ${item.summary}`);
  if (/mailza|governadora|br-364|ponte|oab|politica|governo/.test(text)) {
    return { eyebrow: "ACRE AGORA", status: "VIDEO DA FONTE", color: "1479D1" };
  }
  if (/briga|capota|acidente|policia|preso|trafico/.test(text)) {
    return { eyebrow: "ALERTA", status: "VIDEO DA FONTE", color: "C62828" };
  }
  if (/jurua|cruzeiro do sul|interior|tarauaca|purus/.test(text)) {
    return { eyebrow: "INTERIOR", status: "VIDEO DA FONTE", color: "F2B705" };
  }
  return { eyebrow: "GIRO DO DIA", status: "VIDEO DA FONTE", color: "1479D1" };
}

function buildAss(item) {
  const label = labelFor(item);
  const source = item.source || "Fonte identificada";
  const summary = item.videoCaptionText || item.summary || item.lede || "Acompanhe a atualização completa no Catálogo CZS.";
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Header,Arial,38,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,2,0,7,62,62,45,1
Style: Title,Arial,61,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,0,7,62,62,1445,1
Style: Summary,Arial,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,7,62,62,1658,1
Style: Footer,Arial,29,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,7,62,62,1810,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
Dialogue: 0,0:00:00.00,0:10:00.00,Header,,0,0,0,,${assEscape(label.eyebrow)}  |  ${assEscape(label.status)}
Dialogue: 0,0:00:00.00,0:10:00.00,Title,,0,0,0,,${assEscape(wrap(item.title))}
Dialogue: 0,0:00:00.00,0:10:00.00,Summary,,0,0,0,,${assEscape(wrap(summary, 36, 3))}
Dialogue: 0,0:00:00.00,0:10:00.00,Footer,,Fonte: ${assEscape(source)}  |  Leia mais no Catálogo CZS
`;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} falhou:\n${result.stderr || result.stdout}`);
  }
}

async function download(url, destination) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 Catálogo CZS" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar ${url}`);
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function render(item, index) {
  if (!isRealVideoUrl(item.videoUrl)) {
    throw new Error("Reel bloqueado: apenas video real da fonte entra na fila");
  }
  const dir = path.join(OUT, `${String(index + 1).padStart(2, "0")}-${slugify(item.title)}`);
  fs.mkdirSync(dir, { recursive: true });
  const sourceName = "source.mp4";
  await download(item.videoUrl, path.join(dir, sourceName));
  fs.writeFileSync(path.join(dir, "overlay.ass"), buildAss(item), "utf8");
  const label = labelFor(item);
  const common = [
    `[base]drawbox=x=0:y=0:w=1080:h=245:color=0x${label.color}@0.96:t=fill,drawbox=x=0:y=1390:w=1080:h=530:color=0x071A33@0.94:t=fill[frame]`,
    "[1:v]scale=340:-1[logo]",
    "[frame][logo]overlay=690:46,ass=overlay.ass[outv]",
  ].join(";");
  const videoFilter = [
    "[0:v]split=2[bg][fg]",
    "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:10[blur]",
    "[fg]scale=1080:1180:force_original_aspect_ratio=decrease[main]",
    "[blur][main]overlay=(W-w)/2:250+(1180-h)/2[base]",
    common,
  ].join(";");
  run("ffmpeg", ["-y", "-i", sourceName, "-i", LOGO, "-t", "30", "-filter_complex", videoFilter, "-map", "[outv]", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "reel-czs.mp4"], dir);
  run("ffmpeg", ["-y", "-ss", "00:00:02", "-i", "reel-czs.mp4", "-frames:v", "1", "cover.jpg"], dir);
  return {
    title: item.title,
    source: item.source,
    kind: item.kind,
    media: path.join(dir, "reel-czs.mp4"),
    cover: path.join(dir, "cover.jpg"),
    caption: `${item.title}\n\nFonte: ${item.source}\nCatálogo CZS | Informação do Vale do Juruá\n#CatalogoCZS #Acre #ValeDoJurua #VideoNoticia`,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const source = JSON.parse(fs.readFileSync(path.join(OUT, "source-selection.json"), "utf8"));
  const picked = Array.isArray(source.items)
    ? source.items
    : [
      ...(source.media || []).filter((item) => /anime|Raphinha|Kinho|Torneio|Trump|Lula/i.test(item.title)).slice(0, 2),
      ...(source.videos || []),
      ...(source.media || []).filter((item) => /BR-364|Fechô|mulheres brigando|Mailza|Juruá|Cruzeiro do Sul/i.test(item.title)).slice(0, 5),
    ];
  const unique = [];
  const seen = new Set();
  const skipped = [];
  const now = new Date();
  for (const item of picked) {
    const key = normalize(item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isRealVideoUrl(item.videoUrl)) {
      skipped.push({ title: item.title, reason: "bloqueado: reels exigem video real da fonte" });
      continue;
    }
    if (!isSameLocalDay(item.publishedAt || item.date, now)) {
      skipped.push({ title: item.title, reason: "bloqueado: noticia fora do dia local do Acre" });
      continue;
    }
    unique.push({ ...item, kind: "video" });
    if (unique.length >= (source.limit || 20)) break;
  }
  const posts = [];
  for (const [index, item] of unique.entries()) {
    try {
      posts.push(await render(item, index));
    } catch (error) {
      skipped.push({ title: item.title, reason: error.message });
    }
  }
  fs.writeFileSync(path.join(OUT, "post-queue.json"), JSON.stringify({ generatedAt: new Date().toISOString(), posts, skipped }, null, 2), "utf8");
  console.log(JSON.stringify({ output: OUT, posts: posts.length, skipped: skipped.length, titles: posts.map((post) => post.title) }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
