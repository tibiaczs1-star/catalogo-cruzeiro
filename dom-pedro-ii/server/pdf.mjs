/**
 * Gerador leve em Node puro (zero dependências externas) de PDF A4 em WinAnsi
 * para baixar roteiros de estudo e materiais aprovados, mais empacotador ZIP (PDF + áudio).
 */

const CP1252_EXTRA = new Map([
  [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02C6, 0x88], [0x2030, 0x89], [0x0160, 0x8A],
  [0x2039, 0x8B], [0x0152, 0x8C], [0x017D, 0x8E], [0x2018, 0x91], [0x2019, 0x92],
  [0x201C, 0x93], [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02DC, 0x98], [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B], [0x0153, 0x9C],
  [0x017E, 0x9E], [0x0178, 0x9F]
]);

function normalizeText(str) {
  return String(str || '')
    .replace(/\r\n?/g, '\n')
    .replace(/✓|✔/g, '[ok]')
    .replace(/✕|✖|✗/g, '[x]')
    .replace(/→|➜/g, '->')
    .replace(/←/g, '<-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/★|☆/g, '*')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
}

function encodeWinAnsiBytes(str) {
  const clean = normalizeText(str);
  const out = [];
  for (const ch of clean) {
    const code = ch.codePointAt(0);
    if (code >= 0x20 && code <= 0x7E) {
      out.push(code);
    } else if (code >= 0xA0 && code <= 0xFF) {
      out.push(code);
    } else if (CP1252_EXTRA.has(code)) {
      out.push(CP1252_EXTRA.get(code));
    } else {
      const folded = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      const fc = folded.codePointAt(0);
      out.push(fc && fc >= 0x20 && fc <= 0x7E ? fc : 0x3F);
    }
  }
  return Buffer.from(out);
}

function pdfStringHex(str) {
  return '<' + encodeWinAnsiBytes(str).toString('hex') + '>';
}

function approxCharWidth(ch, fontSize) {
  if ('ijlI.,:;\'!| '.includes(ch)) return fontSize * 0.28;
  if ('mwMW@%'.includes(ch)) return fontSize * 0.78;
  if (ch >= 'A' && ch <= 'Z') return fontSize * 0.64;
  return fontSize * 0.52;
}

function wrapText(text, maxWidth, fontSize) {
  const paras = normalizeText(text).split('\n');
  const lines = [];
  for (const p of paras) {
    const trimmed = p.trim();
    if (!trimmed) { lines.push(''); continue; }
    const words = trimmed.split(/\s+/);
    let line = '';
    let w = 0;
    for (const word of words) {
      let ww = 0;
      for (const ch of word) ww += approxCharWidth(ch, fontSize);
      const spaceW = line ? fontSize * 0.28 : 0;
      if (line && w + spaceW + ww > maxWidth) {
        lines.push(line);
        line = word;
        w = ww;
      } else {
        line = line ? line + ' ' + word : word;
        w += spaceW + ww;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

class PdfCanvas {
  constructor() {
    this.pages = [];
    this.marginL = 50;
    this.marginR = 50;
    this.pageW = 595.28;
    this.pageH = 841.89;
    this.contentW = this.pageW - this.marginL - this.marginR;
    this.topY = 782;
    this.bottomY = 60;
    this.newPage(true);
  }

  newPage(isFirst = false) {
    const cmds = [];
    this.pages.push(cmds);
    this.cur = cmds;
    if (isFirst) {
      cmds.push('0.545 0.118 0.176 rg 0 762 595.28 80 re f');
      cmds.push('0.961 0.710 0.106 rg 0 757 595.28 5 re f');
      cmds.push(`BT /F2 15 Tf 1 1 1 rg ${this.marginL} 808 Td ${pdfStringHex('COLÉGIO DOM PEDRO II - ELO ESTUDANTIL')} Tj ET`);
      cmds.push(`BT /F1 9.5 Tf 1 0.94 0.86 rg ${this.marginL} 790 Td ${pdfStringHex('Campus CZS Sul | Cruzeiro do Sul - AC | Roteiro de Estudo para Download (PDF + Áudio)')} Tj ET`);
      this.y = 735;
    } else {
      cmds.push('0.545 0.118 0.176 rg 0 822 595.28 20 re f');
      cmds.push('0.961 0.710 0.106 rg 0 820 595.28 2 re f');
      cmds.push(`BT /F2 9 Tf 1 1 1 rg ${this.marginL} 828 Td ${pdfStringHex('COLÉGIO DOM PEDRO II · MATERIAL DE ESTUDO')} Tj ET`);
      this.y = 795;
    }
  }

  ensureSpace(need) {
    if (this.y - need < this.bottomY) this.newPage(false);
  }

  drawInfoBox(items) {
    const wrappedPairs = items.map(([label, val]) => ({
      label,
      lines: wrapText(val || '-', this.contentW - 24, 10)
    }));
    const rowCount = wrappedPairs.reduce((acc, p) => acc + Math.max(1, p.lines.length), 0);
    const boxH = 18 + rowCount * 14.5 + wrappedPairs.length * 3;
    this.ensureSpace(boxH + 12);
    const top = this.y;
    const bottom = top - boxH;
    this.cur.push(`1 0.973 0.933 rg ${this.marginL} ${bottom.toFixed(2)} ${this.contentW.toFixed(2)} ${boxH.toFixed(2)} re f`);
    this.cur.push(`0.918 0.847 0.765 RG 1 w ${this.marginL} ${bottom.toFixed(2)} ${this.contentW.toFixed(2)} ${boxH.toFixed(2)} re S`);
    this.cur.push(`0.545 0.118 0.176 rg ${this.marginL} ${bottom.toFixed(2)} 4 ${boxH.toFixed(2)} re f`);
    let cy = top - 16;
    for (const pair of wrappedPairs) {
      const first = pair.lines[0] || '';
      const prefix = `${pair.label}: `;
      this.cur.push(`BT /F2 9.5 Tf 0.545 0.118 0.176 rg ${(this.marginL + 12).toFixed(2)} ${cy.toFixed(2)} Td ${pdfStringHex(prefix)} Tj ET`);
      const offsetX = Math.min(130, prefix.length * 5.2 + 6);
      this.cur.push(`BT /F1 9.5 Tf 0.176 0.129 0.118 rg ${(this.marginL + 12 + offsetX).toFixed(2)} ${cy.toFixed(2)} Td ${pdfStringHex(first)} Tj ET`);
      cy -= 14;
      for (let i = 1; i < pair.lines.length; i++) {
        this.cur.push(`BT /F1 9.5 Tf 0.176 0.129 0.118 rg ${(this.marginL + 12).toFixed(2)} ${cy.toFixed(2)} Td ${pdfStringHex(pair.lines[i])} Tj ET`);
        cy -= 14;
      }
      cy -= 3;
    }
    this.y = bottom - 14;
  }

  drawSectionHeader(title) {
    const lines = wrapText(title, this.contentW - 20, 12);
    const h = 14 + lines.length * 15;
    this.ensureSpace(h + 28);
    const bottom = this.y - h;
    this.cur.push(`0.953 0.914 0.878 rg ${this.marginL} ${bottom.toFixed(2)} ${this.contentW.toFixed(2)} ${h.toFixed(2)} re f`);
    this.cur.push(`0.545 0.118 0.176 rg ${this.marginL} ${bottom.toFixed(2)} 4 ${h.toFixed(2)} re f`);
    let cy = this.y - 16;
    for (const line of lines) {
      this.cur.push(`BT /F2 11.5 Tf 0.545 0.118 0.176 rg ${(this.marginL + 12).toFixed(2)} ${cy.toFixed(2)} Td ${pdfStringHex(line)} Tj ET`);
      cy -= 15;
    }
    this.y = bottom - 10;
  }

  drawParagraph(text, fontSize = 10.5, indent = 0) {
    const lines = wrapText(text, this.contentW - indent, fontSize);
    const lineH = fontSize * 1.45;
    for (const line of lines) {
      if (!line) {
        this.y -= lineH * 0.55;
        continue;
      }
      this.ensureSpace(lineH + 4);
      this.cur.push(`BT /F1 ${fontSize} Tf 0.176 0.129 0.118 rg ${(this.marginL + indent).toFixed(2)} ${this.y.toFixed(2)} Td ${pdfStringHex(line)} Tj ET`);
      this.y -= lineH;
    }
    this.y -= 6;
  }

  drawVisualList(kind, items) {
    if (!Array.isArray(items) || !items.length) return;
    this.ensureSpace(26);
    items.forEach((item, idx) => {
      const marker = kind === 'sequence' ? `${idx + 1}.` : '•';
      const lines = wrapText(item, this.contentW - 28, 10);
      const blockH = lines.length * 14 + 4;
      this.ensureSpace(blockH + 4);
      this.cur.push(`BT /F2 10 Tf 0.545 0.118 0.176 rg ${(this.marginL + 8).toFixed(2)} ${this.y.toFixed(2)} Td ${pdfStringHex(marker)} Tj ET`);
      lines.forEach((line) => {
        this.cur.push(`BT /F1 10 Tf 0.24 0.18 0.16 rg ${(this.marginL + 24).toFixed(2)} ${this.y.toFixed(2)} Td ${pdfStringHex(line)} Tj ET`);
        this.y -= 14;
      });
      this.y -= 2;
    });
    this.y -= 6;
  }

  build() {
    const total = this.pages.length;
    const contentStreams = this.pages.map((cmds, idx) => {
      const footer = `Colégio Dom Pedro II · Cruzeiro do Sul - AC   |   Saber, Honra e Disciplina   |   Página ${idx + 1} de ${total}`;
      const fullCmds = [
        ...cmds,
        '0.918 0.847 0.765 RG 0.8 w 50 42 m 545.28 42 l S',
        `BT /F1 8.5 Tf 0.43 0.33 0.30 rg 50 28 Td ${pdfStringHex(footer)} Tj ET`
      ];
      return fullCmds.join('\n');
    });

    const objects = [];
    const addObj = (body) => { objects.push(body); return objects.length; };
    const fontRegular = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBold = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pagesId = addObj(''); // placeholder
    const pageIds = [];

    for (const streamText of contentStreams) {
      const streamBuf = Buffer.from(streamText, 'latin1');
      const contentId = addObj(`<< /Length ${streamBuf.length} >>\nstream\n${streamText}\nendstream`);
      const pageId = addObj(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595.28 841.89] ` +
        `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`
      );
      pageIds.push(pageId);
    }

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')];
    const offsets = [0];
    let pos = chunks[0].length;
    for (let i = 0; i < objects.length; i++) {
      offsets.push(pos);
      const entry = Buffer.from(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`, 'latin1');
      chunks.push(entry);
      pos += entry.length;
    }
    const xrefStart = pos;
    const xrefLines = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
    for (let i = 1; i <= objects.length; i++) {
      xrefLines.push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    }
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    chunks.push(Buffer.from(xrefLines.join('') + trailer, 'latin1'));
    return Buffer.concat(chunks);
  }
}

export function doubtToPdfBuffer({ id, subject, question, answer, lesson, voiceLabel, studentName, grade, createdAt, rating, feedbackNote, redoCount, narration }) {
  const pdf = new PdfCanvas();
  const meta = [
    ['Disciplina', `${subject || 'Geral'} (Aula #${id || '-'})`],
    ['Estudante', `${studentName || 'Aluno(a) Cadete'}${grade ? ' · ' + grade : ''}`],
    ['Voz selecionada', voiceLabel || 'Lucas (Cinema Pixar)'],
    ['Pergunta original', question || 'Dúvida enviada por áudio ou texto']
  ];
  if (createdAt) meta.push(['Data', String(createdAt).slice(0, 16).replace('T', ' ')]);
  if (rating) meta.push(['Avaliação do aluno', `${rating}/5${redoCount ? ` (versão revisada #${redoCount + 1})` : ''}`]);
  if (feedbackNote) meta.push(['Pedido de ajuste', feedbackNote]);
  pdf.drawInfoBox(meta);

  const steps = lesson?.steps?.length
    ? lesson.steps
    : [{ title: 'Explicação Completa', text: String(answer || '').replace(/^\[(Prof\.|Profa\.)[^\]]+\]:\s*/, ''), visual: { kind: 'none', items: [] } }];

  steps.forEach((step, idx) => {
    pdf.drawSectionHeader(`Etapa ${idx + 1}: ${step.title}`);
    pdf.drawParagraph(step.text);
    if (step.visual && step.visual.kind !== 'none' && Array.isArray(step.visual.items) && step.visual.items.length) {
      pdf.drawVisualList(step.visual.kind, step.visual.items);
    }
  });

  // Texto integral da narração (o mesmo falado no áudio de ~5 a 10 minutos).
  if (narration && String(narration).trim()) {
    pdf.drawSectionHeader('Roteiro completo da aula (texto do áudio)');
    pdf.drawParagraph(String(narration).trim());
  }

  return pdf.build();
}

export function materialToPdfBuffer({ id, subject, title, description, kind, reviewedBy, createdAt, studentName }) {
  const pdf = new PdfCanvas();
  const cleanTitle = String(title || '').replace(/\s*\(reforço da turma\)$/i, '').replace(/\s*·\s*\d+º\s*ano.*$/i, '');
  pdf.drawInfoBox([
    ['Material de Estudo', `${cleanTitle} (#${id || '-'})`],
    ['Disciplina e Tipo', `${subject || 'Geral'} · ${kind || 'Roteiro ilustrado'}`],
    ['Estudante', studentName || 'Turma CMDPII'],
    ['Curadoria Escolar', reviewedBy ? `Revisado por ${reviewedBy}` : 'Acervo pedagógico CMDPII'],
    ['Registro', createdAt ? String(createdAt).slice(0, 16).replace('T', ' ') : 'Acervo local']
  ]);

  const sections = String(description || '')
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
  sections.forEach((sec, idx) => {
    const [head, ...rest] = sec.split('\n');
    if (rest.length) {
      pdf.drawSectionHeader(`${idx + 1}. ${head}`);
      pdf.drawParagraph(rest.join('\n'));
    } else {
      pdf.drawSectionHeader(`Parte ${idx + 1}`);
      pdf.drawParagraph(head);
    }
  });

  return pdf.build();
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

export function buildZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const sum = crc32(data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); // Store
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x5421, 12);
    local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x5421, 14);
    central.writeUInt32LE(sum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    localParts.push(local, data);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}
