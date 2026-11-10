"use strict";

// Quebra texto em frases sem estragar numeros.
//
// O padrao antigo (text.match(/[^.!?]+[.!?]?/g)) tratava todo ponto como fim
// de frase: "1.171 quilometros" virava "1." + "171 quilometros", e
// "US$ 399,4 mil" quebrava no ponto do milhar. Como o corpo da materia e
// montado a partir dessas frases, o texto publicado saia cortado no meio de
// um numero.
//
// Regra: um ponto final so encerra a frase se NAO estiver entre digitos e NAO
// separar milhar (ponto seguido de espaco e de digito).

const SENTENCE_END = /[.!?…]/;

function splitSentences(value = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [];

  const sentences = [];
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    if (!SENTENCE_END.test(text[i])) continue;

    const prev = text[i - 1] || "";
    const next = text[i + 1] || "";
    const next2 = text[i + 2] || "";

    // Decimal: 158,32 nao entra aqui, mas 1.171 e 3.5 entram.
    const betweenDigits = /\d/.test(prev) && /\d/.test(next);
    // Milhar: "1.171" com espaco depois nao e fim de frase.
    const thousandsBreak = /\d/.test(prev) && /\s/.test(next) && /\d/.test(next2);
    // Abreviacao curta conhecida (Sr., Dra., etc.) nao fecha frase.
    const tail = text.slice(start, i);
    const lastWord = (tail.match(/[A-Za-zÀ-ÿ.]+$/) || [""])[0];
    const abbreviation =
      /^(sr|sra|dr|dra|prof|profa|exmo|exma|av|cel|gen|cap|ten|min|p[aá]g|num|vol|art|fig|obs|etc)$/i.test(
        lastWord.replace(/\.$/, "")
      );

    if (betweenDigits || thousandsBreak || abbreviation) continue;

    // Consome o ponto final e os espacos seguintes.
    let end = i + 1;
    while (end < text.length && /\s/.test(text[end])) end += 1;

    const sentence = text.slice(start, end).trim();
    if (sentence) sentences.push(sentence);
    start = end;
    i = end - 1;
  }

  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);

  return sentences.filter(Boolean);
}

module.exports = { splitSentences };