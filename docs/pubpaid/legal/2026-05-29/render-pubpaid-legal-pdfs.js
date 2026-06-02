const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const root = __dirname;
const files = [
  "01_RELATORIO_ANALISE_JURIDICA_PUBPAID.md",
  "02_DOCUMENTO_OPERACIONAL_CONFORMIDADE_PUBPAID.md",
  "03_DOCUMENTO_FUNCIONAMENTO_PRODUTO_PUBPAID.md",
  "04_MATRIZ_GO_NO_GO_PUBPAID.md"
];

function cleanInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

function drawParagraph(doc, text, options = {}) {
  const font = options.bold ? "Helvetica-Bold" : "Helvetica";
  doc.font(font).fontSize(options.size || 10).fillColor(options.color || "#111827");
  doc.text(cleanInline(text), {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    align: options.align || "left",
    continued: false
  });
  doc.moveDown(options.after ?? 0.45);
}

function drawRule(doc) {
  const y = doc.y + 2;
  doc.moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor("#d1d5db")
    .lineWidth(0.7)
    .stroke();
  doc.moveDown(0.8);
}

function drawTable(doc, line) {
  drawParagraph(doc, cleanInline(line), { size: 8.5, color: "#374151", after: 0.25 });
}

function renderMarkdown(inputFile) {
  const md = fs.readFileSync(path.join(root, inputFile), "utf8");
  const outputFile = path.join(root, inputFile.replace(/\.md$/i, ".pdf"));
  const doc = new PDFDocument({
    size: "LETTER",
    bufferPages: true,
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    info: {
      Title: inputFile.replace(/_/g, " ").replace(/\.md$/i, ""),
      Author: "Projeto Codex / PubPaid"
    }
  });

  doc.pipe(fs.createWriteStream(outputFile));

  const lines = md.split(/\r?\n/);
  let inTable = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      if (inTable) {
        doc.moveDown(0.4);
        inTable = false;
      } else {
        doc.moveDown(0.2);
      }
      continue;
    }

    if (line.startsWith("# ")) {
      drawParagraph(doc, line.slice(2), { bold: true, size: 20, color: "#0f172a", after: 0.2 });
      drawRule(doc);
      continue;
    }

    if (line.startsWith("## ")) {
      doc.moveDown(0.25);
      drawParagraph(doc, line.slice(3), { bold: true, size: 14, color: "#1f2937", after: 0.2 });
      continue;
    }

    if (line.startsWith("### ")) {
      drawParagraph(doc, line.slice(4), { bold: true, size: 11.5, color: "#374151", after: 0.15 });
      continue;
    }

    if (line.startsWith("|")) {
      if (!line.includes("---")) {
        drawTable(doc, line);
      }
      inTable = true;
      continue;
    }

    if (/^- /.test(line)) {
      drawParagraph(doc, `• ${line.slice(2)}`, { size: 10, after: 0.18 });
      continue;
    }

    if (/^\d+\. /.test(line)) {
      drawParagraph(doc, line, { size: 10, after: 0.18 });
      continue;
    }

    drawParagraph(doc, line, { size: 10, after: 0.35 });
  }

  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i += 1) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(8).fillColor("#6b7280");
    doc.text(`PubPaid legal-operacional | ${new Date().toISOString().slice(0, 10)} | pagina ${i + 1}`, 54, doc.page.height - 38, {
      width: doc.page.width - 108,
      align: "center"
    });
  }

  doc.end();
  return outputFile;
}

for (const file of files) {
  const out = renderMarkdown(file);
  console.log(out);
}
