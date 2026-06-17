const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT = path.join(ROOT, ".codex-temp", "czs-video-news-pilot-20260615");
const DEFAULT_BATCH_OUTPUT = path.join(ROOT, ".codex-temp", "czs-video-news-batch-20260615");
const LOGO_PATH = path.join(ROOT, "assets", "brand", "catalogo-czs-logo-transparent-png-20260603", "02-logo-horizontal-sem-fundo.png");
const ACRE_TIME_ZONE = "America/Rio_Branco";

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildEditorialLabel(item) {
  const category = normalize(item.category);
  if (category.includes("policia") || category.includes("seguranca")) {
    return { eyebrow: "SEGURANCA", status: "CONTEXTO DA FONTE", color: "C62828" };
  }
  if (category.includes("cultura") || normalize(item.title).includes("tradicao")) {
    return { eyebrow: "CULTURA LOCAL", status: "VIDEO DA FONTE", color: "F2B705" };
  }
  return { eyebrow: "ACRE AGORA", status: "VIDEO DA FONTE", color: "1479D1" };
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

function regionalScore(item) {
  const text = normalize(`${item.title} ${item.summary} ${item.category}`);
  const terms = [
    ["cruzeiro do sul", 10],
    ["vale do jurua", 9],
    ["jurua", 8],
    ["mancio lima", 8],
    ["porto walter", 8],
    ["marechal thaumaturgo", 8],
    ["rodrigues alves", 8],
    ["acre", 5],
    ["rio branco", 2],
  ];
  return terms.reduce((score, [term, points]) => score + (text.includes(term) ? points : 0), 0);
}

function selectVideoNews(items, { limit = 3, now = new Date() } = {}) {
  return items
    .filter((item) => item.title && isRealVideoUrl(item.videoUrl))
    .filter((item) => isSameLocalDay(item.publishedAt || item.date, now))
    .map((item) => {
      const ageHours = Math.max(0, (now - new Date(item.publishedAt || item.date || 0)) / 36e5);
      return { ...item, editorialScore: regionalScore(item) + Math.max(0, 12 - ageHours) };
    })
    .filter((item) => item.editorialScore >= 5)
    .sort((a, b) => b.editorialScore - a.editorialScore)
    .slice(0, limit);
}

function selectVideoBatch(items, { limit = 100, now = new Date() } = {}) {
  return items
    .filter((item) => item.title && isRealVideoUrl(item.videoUrl))
    .filter((item) => isSameLocalDay(item.publishedAt || item.date, now))
    .map((item) => {
      const ageHours = Math.max(0, (now - new Date(item.publishedAt || item.date || 0)) / 36e5);
      return {
        ...item,
        renderMode: "source-video",
        editorialScore: 1000 + regionalScore(item) + Math.max(0, 12 - ageHours),
      };
    })
    .filter((item) => item.editorialScore >= 4)
    .sort((a, b) => b.editorialScore - a.editorialScore)
    .slice(0, limit);
}

function slugify(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

function assEscape(value) {
  return String(value).replace(/[{}]/g, "").replace(/\n/g, "\\N");
}

function wrapTitle(value, width = 26) {
  const words = String(value).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5).join("\\N");
}

function buildAss(item) {
  const label = buildEditorialLabel(item);
  const source = item.sourceName || item.source || "Fonte identificada";
  const summary = item.videoCaptionText || item.summary || item.lede || "Acompanhe a atualização completa no Catálogo CZS.";
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Header,Arial,38,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,2,0,7,62,62,45,1
Style: Title,Arial,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,0,7,62,62,1450,1
Style: Summary,Arial,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,7,62,62,1658,1
Style: Footer,Arial,30,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,7,62,62,1810,1
Style: Brand,Arial,32,&H00000000,&H00000000,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,9,62,62,45,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
Dialogue: 0,0:00:00.00,0:10:00.00,Header,,0,0,0,,${assEscape(label.eyebrow)}  |  ${assEscape(label.status)}
Dialogue: 0,0:00:00.00,0:10:00.00,Brand,,0,0,0,,CATALOGO CZS
Dialogue: 0,0:00:00.00,0:10:00.00,Title,,0,0,0,,${assEscape(wrapTitle(item.title))}
Dialogue: 0,0:00:00.00,0:10:00.00,Summary,,0,0,0,,${assEscape(wrapTitle(summary, 36))}
Dialogue: 0,0:00:00.00,0:10:00.00,Footer,,0,0,0,,Fonte: ${assEscape(source)}  |  Leia mais no Catálogo CZS
`;
}

function buildStoryCaption(item) {
  const source = item.sourceName || item.source || "Fonte identificada";
  const summary = item.summary || item.lede || "Acompanhe a atualização no Catálogo CZS.";
  return `${item.title}

${summary}

Fonte: ${source}
Matéria original: ${item.sourceUrl || item.url || ""}

Catálogo CZS | Informação do Vale do Juruá
#CatalogoCZS #ValeDoJurua #CruzeiroDoSul #Acre #VideoNoticia`;
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} falhou:\n${result.stderr || result.stdout}`);
  }
}

async function renderItem(item, index, outputRoot) {
  const slug = `${String(index + 1).padStart(2, "0")}-${slugify(item.title)}`;
  const itemDir = path.join(outputRoot, slug);
  fs.mkdirSync(itemDir, { recursive: true });
  const sourceFile = path.join(itemDir, "source.mp4");
  const reelFile = path.join(itemDir, "reel-czs.mp4");
  const coverFile = path.join(itemDir, "cover.jpg");
  const assFile = path.join(itemDir, "overlay.ass");
  const captionFile = path.join(itemDir, "caption.txt");
  await download(item.videoUrl, sourceFile);
  fs.writeFileSync(assFile, buildAss(item), "utf8");

  const label = buildEditorialLabel(item);
  const filter = [
    "[0:v]split=2[bg][fg]",
    "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:12[blur]",
    "[fg]scale=1080:1180:force_original_aspect_ratio=decrease[main]",
    `[blur]drawbox=x=0:y=0:w=1080:h=245:color=0x${label.color}@0.96:t=fill,drawbox=x=0:y=1390:w=1080:h=530:color=0x071A33@0.94:t=fill[base]`,
    "[base][main]overlay=(W-w)/2:250+(1180-h)/2[withmain]",
    "[1:v]scale=175:-1[logo]",
    "[withmain][logo]overlay=858:54,ass=overlay.ass[outv]",
  ].join(";");
  run("ffmpeg", [
    "-y", "-i", "source.mp4", "-i", LOGO_PATH, "-t", "30",
    "-filter_complex", filter,
    "-map", "[outv]", "-map", "0:a?",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
    "reel-czs.mp4",
  ], itemDir);
  run("ffmpeg", ["-y", "-ss", "00:00:02", "-i", "reel-czs.mp4", "-frames:v", "1", "cover.jpg"], itemDir);

  fs.writeFileSync(captionFile, buildStoryCaption(item), "utf8");
  return { ...item, slug, reelFile, coverFile, captionFile, label };
}

async function renderBatchItem(item, index, outputRoot) {
  if (item.renderMode !== "source-video" || !isRealVideoUrl(item.videoUrl)) {
    throw new Error("Reel bloqueado: apenas video real da fonte entra na fila");
  }
  const slug = `${String(index + 1).padStart(3, "0")}-${slugify(item.title)}`;
  const itemDir = path.join(outputRoot, slug);
  fs.mkdirSync(itemDir, { recursive: true });
  const mediaFile = path.join(itemDir, "source.mp4");
  const reelFile = path.join(itemDir, "reel-czs.mp4");
  const storyFile = path.join(itemDir, "story-czs.mp4");
  const coverFile = path.join(itemDir, "cover.jpg");
  const assFile = path.join(itemDir, "overlay.ass");
  const captionFile = path.join(itemDir, "caption.txt");
  await download(item.videoUrl, mediaFile);
  fs.writeFileSync(assFile, buildAss(item), "utf8");
  fs.writeFileSync(captionFile, buildStoryCaption(item), "utf8");

  const label = buildEditorialLabel(item);
  const commonOverlay = [
    `[base]drawbox=x=0:y=0:w=1080:h=245:color=0x${label.color}@0.96:t=fill,drawbox=x=0:y=1390:w=1080:h=530:color=0x071A33@0.94:t=fill[frame]`,
    "[1:v]scale=175:-1[logo]",
    "[frame][logo]overlay=858:54,ass=overlay.ass[outv]",
  ].join(";");
  const sourceVideoFilter = [
    "[0:v]split=2[bg][fg]",
    "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:12[blur]",
    "[fg]scale=1080:1180:force_original_aspect_ratio=decrease[main]",
    "[blur][main]overlay=(W-w)/2:250+(1180-h)/2[base]",
    commonOverlay,
  ].join(";");
  run("ffmpeg", ["-y", "-i", "source.mp4", "-i", LOGO_PATH, "-t", "12", "-filter_complex", sourceVideoFilter, "-map", "[outv]", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "reel-czs.mp4"], itemDir);
  fs.copyFileSync(reelFile, storyFile);
  run("ffmpeg", ["-y", "-ss", "00:00:02", "-i", "reel-czs.mp4", "-frames:v", "1", "cover.jpg"], itemDir);
  return {
    id: item.id || item.slug || slug,
    slug,
    title: item.title,
    renderMode: item.renderMode,
    sourceName: item.sourceName || item.source,
    sourceUrl: item.sourceUrl || item.url,
    reelFile,
    storyFile,
    coverFile,
    captionFile,
    label: buildEditorialLabel(item),
  };
}

function writePreview(items, outputRoot) {
  const cards = items.map((item) => `<article>
    <video controls poster="${path.relative(outputRoot, item.coverFile).replaceAll("\\", "/")}"><source src="${path.relative(outputRoot, item.reelFile).replaceAll("\\", "/")}" type="video/mp4"></video>
    <div><span>${item.label.eyebrow}</span><h2>${item.title}</h2><p>${item.summary || ""}</p><small>Fonte: ${item.sourceName || item.source}</small></div>
  </article>`).join("\n");
  fs.writeFileSync(path.join(outputRoot, "index.html"), `<!doctype html><meta charset="utf-8"><title>CZS Vídeo Notícia - Piloto</title>
  <style>body{margin:0;background:#071a33;color:#fff;font:16px Arial;padding:32px}h1{color:#f2b705}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}article{background:#fff;color:#071a33;border-radius:18px;overflow:hidden}video{width:100%;aspect-ratio:9/16;background:#000;max-height:70vh}article div{padding:18px}span{font-weight:800;color:#1479d1}h2{font-size:20px}</style>
  <h1>CZS Vídeo Notícia | Piloto</h1><p>Somente vídeo real da fonte, do dia local, com legenda/overlay CZS. Nada publicado.</p><main>${cards}</main>`, "utf8");
}

async function main() {
  const archive = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "news-archive.json"), "utf8"));
  const isBatch = process.argv.includes("--batch");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : (isBatch ? 100 : 3);
  const outputRoot = isBatch ? DEFAULT_BATCH_OUTPUT : DEFAULT_OUTPUT;
  const selected = isBatch ? selectVideoBatch(archive, { limit }) : selectVideoNews(archive, { limit });
  fs.mkdirSync(outputRoot, { recursive: true });
  const rendered = [];
  const skipped = [];
  for (const [index, item] of selected.entries()) {
    try {
      rendered.push(isBatch ? await renderBatchItem(item, index, outputRoot) : await renderItem(item, index, outputRoot));
    } catch (error) {
      skipped.push({ title: item.title, reason: error.message });
    }
  }
  fs.writeFileSync(path.join(outputRoot, "publication-queue.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    status: "prepared-awaiting-explicit-publish-approval",
    concept: "CZS Video Noticia",
    items: rendered,
    skipped,
  }, null, 2), "utf8");
  writePreview(rendered, outputRoot);
  console.log(JSON.stringify({ ok: true, output: outputRoot, count: rendered.length, skipped: skipped.length }, null, 2));
}

module.exports = { selectVideoNews, selectVideoBatch, buildEditorialLabel, buildAss };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
