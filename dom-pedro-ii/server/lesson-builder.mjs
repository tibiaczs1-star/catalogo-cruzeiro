// Respostas curtas, restritas ao enunciado atual.
export function conciseText(value, limit = 180) {
  if (limit <= 0 || !String(value || '').trim()) return '';
  const words = String(value || '').trim().split(/\s+/);
  if (words.length <= limit) return words.join(' ');
  const excerpt = words.slice(0, limit).join(' ');
  const end = Math.max(excerpt.lastIndexOf('. '), excerpt.lastIndexOf('? '), excerpt.lastIndexOf('! '));
  return end > excerpt.length / 2 ? excerpt.slice(0, end + 1) : excerpt.replace(/[,;:]?$/, '.') ;
}
function solveQuickMathHint(question) {
  const q = String(question || '').toLowerCase().replace(',', '.');
  const wordFrac = q.match(/(?:um\s+quarto|1\/4)\s+de\s+(\d+(?:\.\d+)?)/i);
  if (wordFrac) {
    const total = Number(wordFrac[1]);
    return `${total} dividido por 4 é igual a ${Number((total / 4).toFixed(2))}.`;
  }
  const genFrac = q.match(/(\d+)\s*\/\s*(\d+)\s+de\s+(\d+(?:\.\d+)?)/i);
  if (genFrac && Number(genFrac[2]) !== 0) {
    const num = Number(genFrac[1]), den = Number(genFrac[2]), tot = Number(genFrac[3]);
    const res = (tot / den) * num;
    return `Para calcular ${num}/${den} de ${tot}, divida ${tot} por ${den} (dá ${Number((tot / den).toFixed(2))}) e multiplique por ${num}, chegando a ${Number(res.toFixed(2))}.`;
  }
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*de\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const p = Number(pctMatch[1]), n = Number(pctMatch[2]);
    return `${p}% de ${n} significa dividir ${n} por 100 e multiplicar por ${p}, chegando a ${Number(((p * n) / 100).toFixed(2))}.`;
  }
  const eqMatch = q.match(/(-?\d*)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (eqMatch) {
    const rawA = eqMatch[1].replace(/\s+/g, '');
    const a = rawA === '' ? 1 : rawA === '-' ? -1 : Number(rawA);
    const b = eqMatch[2] ? Number(eqMatch[2].replace(/\s+/g, '')) : 0;
    const c = Number(eqMatch[3]);
    if (Number.isFinite(a) && a !== 0 && Number.isFinite(b) && Number.isFinite(c)) {
      const rhs = Number((c - b).toFixed(2));
      const x = Number((rhs / a).toFixed(2));
      return `Na equação proposta, passando ${b >= 0 ? b : '(' + b + ')'} para o outro lado com sinal invertido, você obtém ${a}x = ${rhs} e, dividindo por ${a}, encontra x = ${x}.`;
    }
  }
  const sqrtMatch = q.match(/raiz\s+(?:quadrada\s+)?de\s+(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const n = Number(sqrtMatch[1]);
    if (n >= 0) return `A raiz quadrada de ${n} é ${Number(Math.sqrt(n).toFixed(4))}, pois esse valor multiplicado por ele mesmo resulta em ${n}.`;
  }
  const arithMatch = q.match(/(?:^|\b(?:quanto\s+[eé]|calcule|resultado\s+de)\s+)(\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(\d+(?:\.\d+)?)(?:\s*\??|$)/i);
  if (arithMatch) {
    const a = Number(arithMatch[1]), op = arithMatch[2].toLowerCase(), b = Number(arithMatch[3]);
    if (op === '+') return `${a} mais ${b} é igual a ${Number((a + b).toFixed(4))}.`;
    if (op === '-') return `${a} menos ${b} é igual a ${Number((a - b).toFixed(4))}.`;
    if (op === '*' || op === 'x' || op === '×') return `${a} vezes ${b} é igual a ${Number((a * b).toFixed(4))}.`;
    if ((op === '/' || op === '÷') && b !== 0) return `${a} dividido por ${b} é igual a ${Number((a / b).toFixed(4))}.`;
  }
  return '';
}

export function buildLongLesson({ question, baseAnswer = '' }) {
  const cleanBase = String(baseAnswer).replace(/^\[[^\]]+\]:?\s*/, '').trim();
  // Nunca reutilizar roteiros longos do formato anterior como resposta revisada.
  const verified = cleanBase.split(/\s+/).length <= 180 ? cleanBase : '';
  const direct = solveQuickMathHint(question) || verified;
  const text = direct || 'Ainda não tenho uma resposta conferida para essa pergunta. Envie o enunciado completo e os dados do exercício para a equipe escolar analisar a dúvida.';
  const steps = [{ title: 'Resposta à sua dúvida', text: conciseText(text), visual: { kind: 'none', items: [] } }];
  return { lesson: { steps }, answer: steps[0].text, needsHumanReview: !direct };
}
// Narração completa da aula — pensada para cerca de 5 a 10 minutos.
// Usa somente conteúdo real disponível (matéria, título e texto das etapas) e
// orientações de estudo genéricas. Nunca inventa dados sobre a matéria.
export function lessonToFullNarration(lesson, fallbackAnswer = '', subject = '') {
  const steps = Array.isArray(lesson?.steps) ? lesson.steps : [];
  // Texto base SEM corte de 180 palavras: pega o conteúdo inteiro de cada etapa.
  const partes = [];
  if (steps.length) {
    steps.forEach((step, i) => {
      const titulo = String(step?.title || '').trim();
      const texto = String(step?.text || '').trim();
      const visa = Array.isArray(step?.visual?.items) ? step.visual.items.filter(Boolean).map(String) : [];
      partes.push(titulo ? `Etapa ${i + 1}: ${titulo}.` : `Etapa ${i + 1}.`);
      if (texto) partes.push(texto);
      if (visa.length) partes.push('Para acompanhar, observe também: ' + visa.join('; ') + '.');
    });
  } else if (fallbackAnswer) {
    partes.push(String(fallbackAnswer).trim());
  }

  const nucleo = partes.join(' ').replace(/\s+/g, ' ').trim();
  const materia = String(subject || '').trim();

  const semResposta = !nucleo || /Ainda não tenho uma resposta conferida/i.test(nucleo);
  const materiaTxt = materia ? ` de ${materia}` : '';

  // Roteiro de estudo com pausas naturais (alvo: 5 a 10 min em ritmo calmo).
  const abertura = [
    `${materia ? `Aula de ${materia}` : 'Aula de reforço'}. Vou acompanhar você nesta explicação, passo a passo, com calma.`,
    `Antes de começar, acomode-se, respire fundo e tenha papel e lápis por perto. Anote as ideias principais; isso ajuda a fixar o conteúdo.`,
    `Não precisa ter pressa. Se precisar, pause o áudio, releia o texto e continue de onde parou. O importante é entender, não terminar rápido.`
  ];
  const corpo = semResposta ? [
    `Sobre ${materia || 'esta matéria'}: ainda não recebi uma resposta conferida pelo professor para esta pergunta. ` +
    `Isso significa que o conteúdo deste áudio é apenas uma orientação de estudo, não uma explicação da matéria.`,
    `Envie o enunciado completo e os dados do exercício para a equipe escolar analisar. Com o enunciado completo, a escola consegue preparar uma orientação correta e específica para você.`,
    `Enquanto isso, você pode procurar o assunto no material da biblioteca e no site oficial da escola. Volte em alguns minutos: assim que a orientação chegar, ela aparecerá aqui em texto e em áudio.`
  ] : [
    nucleo,
    `Agora vamos revisar juntos. ${materia ? `O ponto central desta aula de ${materia}` : 'O ponto central desta aula'} é o que acabamos de ver. Se alguma parte ficou confusa, volte uma etapa: use o botão Anterior e ouça novamente.`,
    `Repita em voz alta, com as suas próprias palavras, cada ideia importante. Explicar o conteúdo para alguém — ou mesmo para si mesmo — é uma das melhores formas de perceber o que ficou claro e o que ainda precisa de atenção.`,
    `Se algum termo parece estranho, anote-o. Procure o significado no material da biblioteca ou pergunte ao professor na próxima aula. Dúvida identificada é meio caminho andado.`
  ];
  const estudo = [
    `Vamos organizar o estudo em três momentos. Primeiro: leia o roteiro em texto acompanhando o áudio. Segundo: feche a tela e tente reconstruir a explicação de memória. Terceiro: compare o que você lembrou com o roteiro e note o que faltou.`,
    `Esses três momentos funcionam porque o cérebro fixa melhor quando precisa relembrar. Ouvir passivamente ajuda, mas lembrar ativamente ajuda muito mais.`,
    `Agora, tente aplicar o que você estudou. Se a explicação trouxer um exemplo, refaça esse exemplo por conta própria, sem olhar. Se trouxer um passo a passo, execute cada passo no seu caderno.`,
    `Quando errar — e você pode errar, isso é normal — volte ao ponto exato onde se perdeu. Ouça aquela etapa outra vez e tente de novo. O erro não é falha: é o sinal que mostra o que merece mais atenção.`,
    `Se boa parte ficou difícil, peça uma explicação mais simples: use o botão Refazer explicação. A escola também pode revisar o material se você registrar sua nota e escrever o que não entendeu.`,
    `Vamos fazer uma pausa para respirar e organizar o que já vimos. Respire fundo, olhe para o seu caderno e confira se as anotações fazem sentido para você. Se alguma frase ficou solta, escreva uma pergunta ao lado para lembrar de investigar depois.`,
    `Agora pense em como você poderia usar esse conhecimento em uma situação diferente da que vimos aqui. Trocar o contexto é um ótimo teste: se a ideia continuar funcionando, você realmente a entendeu.`,
    `Se você estiver estudando para uma prova, transforme o roteiro em perguntas. Em vez de reler, tente responder: o que é, por que funciona e como se aplica. Responder sem olhar é muito mais eficiente do que reler várias vezes.`,
    `Você pode baixar o roteiro em PDF, o áudio completo e até um pacote com os dois para estudar depois, inclusive sem internet, pelo aplicativo. Aproveite esses recursos.`,
    `Vamos fazer uma revisão espaçada. O ideal é voltar a este conteúdo depois de alguns minutos, no dia seguinte e, depois, alguns dias mais tarde. Cada revisão amplia o que você consegue lembrar.`,
    `Quando voltar, não comece pelo começo: tente lembrar primeiro. Pergunte a si mesmo qual era a ideia principal, quais eram os passos e onde você costuma se confundir. Depois confira o roteiro.`,
    `Se você compartilhou esta explicação com a turma, ela passa por revisão da escola antes de virar material de apoio. Isso ajuda a manter o acervo confiável para todo mundo.`,
    `Avalie esta explicação quando terminar: sua nota ajuda a escola a melhorar o material. Se algo não ficou claro, escreva no campo de comentários e use Refazer explicação para receber uma versão mais simples.`,
    `Lembre-se: estudar${materiaTxt.toLowerCase()} um pouco todos os dias rende mais do que uma longa sessão só antes da prova. Volte em alguns minutos para revisar e ouvir outra vez.`,
    `Antes de encerrar, reserve um minuto para anotar três frases curtas: o que você aprendeu, o que ainda é difícil e o que vai fazer na próxima sessão de estudo. Esse pequeno registro guia seus próximos passos.`,
    `Mantenha seu caderno organizado e separe um espaço para as dúvidas que surgirem. Levar essas perguntas para a escola é uma forma de cuidar do seu aprendizado.`,
    `Se quiser, ouça esta explicação uma segunda vez agora, em outro momento do dia. Muitas vezes entendemos melhor na segunda escuta, quando já conhecemos o caminho. Volte em alguns minutos e veja o que mudou na sua compreensão.`,
    `É isso por enquanto. Bons estudos, e até a próxima aula.`
  ];
  return [...abertura, ...corpo, ...estudo].join(' ').replace(/\s+/g, ' ').trim();
}

export function lessonToDynamicNarration(lesson, fallbackAnswer = '', subject = '') {
  const steps = Array.isArray(lesson?.steps) ? lesson.steps : [];
  const partes = [];
  if (steps.length) {
    steps.forEach((step, i) => {
      const titulo = String(step?.title || '').trim();
      const texto = String(step?.text || '').trim();
      partes.push(titulo ? `Etapa ${i + 1}: ${titulo}.` : `Etapa ${i + 1}.`);
      if (texto) partes.push(texto);
    });
  } else if (fallbackAnswer) {
    partes.push(String(fallbackAnswer).trim());
  }
  const nucleo = partes.join(' ').replace(/\s+/g, ' ').trim();
  const materia = String(subject || '').trim();
  const intro = materia
    ? `Aula de ${materia}. Vamos direto à explicação da sua dúvida, com calma e atenção.`
    : `Vamos direto à explicação da sua dúvida, com calma e atenção.`;
  const semResposta = !nucleo || /Ainda não tenho uma resposta conferida/i.test(nucleo);
  const body = semResposta
    ? `Sobre ${materia || 'esta matéria'}: ainda não recebemos uma resposta conferida do professor. Envie o enunciado completo para a equipe analisar.`
    : nucleo;
  return `${intro} ${body}`.replace(/\s+/g, ' ').trim();
}
