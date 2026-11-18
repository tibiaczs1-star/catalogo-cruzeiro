const normalize = text => String(text || '')
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const EXACT = new Map([
  ['quanto e um quarto de 20', 'Um quarto de vinte é cinco. Divida vinte em quatro partes iguais. Em cada parte ficam cinco.'],
  ['quanto e um quarto de 20 explique com uma conta', 'Um quarto de vinte é cinco. Vinte dividido por quatro é igual a cinco.'],
  ['qual e a metade de dez', 'A metade de dez é cinco. Divida dez em dois grupos iguais. Cada grupo fica com cinco.'],
  ['qual e a metade de 10', 'A metade de dez é cinco. Divida dez em dois grupos iguais. Cada grupo fica com cinco.'],
  ['quanto e a metade de dez', 'A metade de dez é cinco. Divida dez em dois grupos iguais. Cada grupo fica com cinco.'],
]);

const TOPICS = [
  // Português & Redação
  {
    subjects: ['portugues', 'redacao', 'literatura'],
    keys: [['mas', 'mais'], ['mas e mais'], ['mas ou mais']],
    answer: 'Use "mas" (sem i) quando puder trocar por "porém" ou "contudo", indicando oposição: "Estudei bastante, mas ainda tenho uma dúvida." Use "mais" (com i) para indicar quantidade ou intensidade, o contrário de "menos": "Quero aprender mais sobre esse assunto."'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['porque', 'por que', 'porques'], ['por que', 'junto', 'separado'], ['uso dos porques']],
    answer: 'Os quatro porquês seguem uma regra simples: "por que" (separado e sem acento) vai em perguntas ou equivale a "pelo qual"; "por quê" (separado e com acento) aparece no fim da frase; "porque" (junto e sem acento) serve para explicar ou responder; e "porquê" (junto e com acento) funciona como substantivo, significando "o motivo", geralmente acompanhado de "o".'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['opiniao', 'argumento'], ['argumentar'], ['tese'], ['redacao', 'dissertativa']],
    answer: 'Uma opinião mostra o que você pensa ou prefere, enquanto o argumento explica o motivo dessa escolha. A palavra "porque" ajuda a ligar a opinião ao argumento, mas não basta dizer "porque sim": para convencer quem lê ou ouve, apresente uma razão clara, um fato ou um exemplo concreto que sustente a sua ideia.'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['crase'], ['a craseado']],
    answer: 'A crase (`à`) é a união da preposição "a" com o artigo feminino "a". Dica prática: troque a palavra feminina seguinte por uma masculina equivalente. Se aparecer "ao" no masculino, use crase no feminino! Exemplo: "Vou à escola" -> "Vou ao colégio" (tem crase!). Antes de verbos, palavras masculinas e maioria dos pronomes, não vai crase.'
  },
  {
    subjects: ['portugues'],
    keys: [['sujeito', 'predicado'], ['sujeito'], ['predicado']],
    answer: 'Na oração, primeiro encontre o verbo e pergunte "quem?" ou "o quê?" pratica ou sofre a ação: a resposta é o sujeito. Tudo o que sobra na frase declarando algo sobre esse sujeito é o predicado. Exemplo: em "Os alunos estudaram cedo", "Os alunos" é o sujeito e "estudaram cedo" é o predicado.'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['mal', 'mau'], ['mal ou mau']],
    answer: 'Para nunca errar entre "mal" e "mau", use o teste dos opostos: "mal" (com L) é o contrário de "bem" (ex.: "ele se saiu mal"); "mau" (com U) é o contrário de "bom" (ex.: "um mau hábito"). Substitua na frase: se couber "bom", escreva "mau"; se couber "bem", escreva "mal".'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['onde', 'aonde']],
    answer: 'Use "onde" com verbos que indicam lugar fixo, sem movimento, podendo trocar por "em que lugar" (ex.: "Onde você estuda?"). Use "aonde" com verbos de movimento que pedem a preposição "a", como ir, chegar ou levar (ex.: "Aonde você vai?").'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['ha', 'a', 'tempo'], ['ha ou a']],
    answer: 'Use "há" (do verbo haver) para indicar tempo passado ou existência (pode trocar por "faz" ou "existe", ex.: "Há dois anos"). Use "a" para indicar tempo futuro ou distância (ex.: "Daqui a dez minutos começamos a revisão").'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['virgula'], ['pontuacao']],
    answer: 'A vírgula separa elementos de uma lista, isola vocativos (chamamentos como "Turma, prestem atenção") e destaca explicações intercaladas. Regra de ouro: nunca separe com uma única vírgula o sujeito do seu verbo nem o verbo do seu complemento direto.'
  },
  {
    subjects: ['portugues', 'literatura'],
    keys: [['figura', 'linguagem'], ['metafora'], ['ironia'], ['hiperbole']],
    answer: 'Figuras de linguagem criam expressividade no texto. A metáfora faz uma comparação implícita ("meu pensamento é um rio"); a hipérbole exagera uma ideia ("chorei rios de lágrimas"); a ironia diz o oposto do que se quer afirmar com tom crítico; e a personificação dá ações humanas a seres inanimados.'
  },
  {
    subjects: ['portugues', 'redacao'],
    keys: [['interpretacao', 'texto'], ['interpretar']],
    answer: 'Para interpretar bem um texto: primeiro faça uma leitura completa buscando a ideia central; depois releia sublinhando palavras-chave, conectivos ("mas", "portanto", "porque") e o objetivo do autor; por fim, confira nas alternativas apenas o que o texto realmente afirma ou permite concluir, sem extrapolar.'
  },
  {
    subjects: ['portugues'],
    keys: [['substantivo'], ['verbo'], ['adjetivo'], ['classe', 'gramatical']],
    answer: 'Nas classes de palavras: o substantivo dá nome a seres, lugares e ideias (ex.: escola, livro); o adjetivo caracteriza ou qualifica o substantivo (ex.: escola acolhedora); e o verbo indica ação, estado ou fenômeno da natureza, variando em tempo e pessoa (ex.: estudar, somos).'
  },

  // Matemática
  {
    subjects: ['matematica'],
    keys: [['fracao'], ['fracoes'], ['numerador'], ['denominador']],
    answer: 'Na fração, o número de cima (numerador) mostra quantas partes pegamos e o de baixo (denominador) em quantas partes iguais o inteiro foi dividido. Para somar frações com denominadores iguais, some só os numeradores. Se forem diferentes, encontre o MMC dos denominadores antes de somar.'
  },
  {
    subjects: ['matematica'],
    keys: [['porcentagem'], ['cento']],
    answer: 'Porcentagem significa dividir por cem. Para calcular X% de um valor, multiplique o valor por X e divida por 100. Exemplo: 20% de 150 é igual a (20 × 150) ÷ 100 = 30. Outra dica rápida: ache 10% dividindo por 10 e multiplique pelo número de dezenas.'
  },
  {
    subjects: ['matematica'],
    keys: [['equacao', '1'], ['primeiro grau'], ['isolar'], ['trocar o sinal']],
    answer: 'Na equação do 1º grau, o objetivo é isolar a letra (x) de um lado do sinal de igual. Quando um termo muda de lado, ele faz a operação inversa: quem estava somando passa subtraindo; quem estava multiplicando passa dividindo. Sempre confira substituindo o valor encontrado na equação original.'
  },
  {
    subjects: ['matematica'],
    keys: [['bhaskara'], ['segundo grau'], ['equacao', '2']],
    answer: 'Para resolver uma equação do 2º grau (ax² + bx + c = 0), identifique os coeficientes a, b e c. Primeiro calcule o delta: Δ = b² - 4·a·c. Depois aplique Bhaskara: x = (-b ± √Δ) / (2·a). Se Δ > 0 há duas raízes reais; se Δ = 0 há uma raiz; se Δ < 0 não há raiz real.'
  },
  {
    subjects: ['matematica'],
    keys: [['regra de tres']],
    answer: 'Na regra de três simples, monte duas colunas com grandezas da mesma espécie. Verifique se são diretamente proporcionais (quando uma aumenta e a outra também aumenta -> multiplique cruzado) ou inversamente proporcionais (quando uma aumenta e a outra diminui -> inverta uma fração antes de multiplicar).'
  },
  {
    subjects: ['matematica'],
    keys: [['pitagoras'], ['hipotenusa'], ['triangulo retangulo']],
    answer: 'O Teorema de Pitágoras vale para todo triângulo retângulo (com ângulo de 90°): o quadrado da hipotenusa (maior lado, oposto ao ângulo reto) é igual à soma dos quadrados dos catetos, ou seja, a² = b² + c².'
  },
  {
    subjects: ['matematica'],
    keys: [['area'], ['perimetro']],
    answer: 'Perímetro é a soma das medidas de todos os lados ao redor da figura (contorno). Área é a medida da superfície interna: no retângulo é base × altura; no triângulo é (base × altura) ÷ 2; e no círculo é π × raio².'
  },

  // Ciências / Biologia
  {
    subjects: ['ciencias', 'biologia'],
    keys: [['fotossintese']],
    answer: 'A fotossintese é o processo pelo qual plantas, algas e algumas bactérias produzem o próprio alimento usando luz solar, água absorvida pelas raízes e gás carbônico do ar. Como resultado, a planta fabrica glicose (energia) e libera gás oxigênio na atmosfera.'
  },
  {
    subjects: ['ciencias', 'biologia'],
    keys: [['respiratorio'], ['pulmao'], ['respiracao']],
    answer: 'No sistema respiratório, o ar entra pelas fossas nasais, passa por faringe, laringe, traqueia e brônquios até chegar aos alvéolos pulmonares. Nos alvéolos ocorre a hematose: o oxigênio passa para o sangue e o gás carbônico sai para ser expirado.'
  },
  {
    subjects: ['ciencias', 'biologia'],
    keys: [['celula'], ['procarionte'], ['eucarionte'], ['organela']],
    answer: 'A célula é a menor unidade viva dos organismos. As células procariontes (como bactérias) não possuem núcleo organizado, enquanto as eucariontes (animais, plantas, fungos) têm núcleo definido por membrana nuclear além de organelas como mitocôndrias (que geram energia).'
  },
  {
    subjects: ['ciencias', 'biologia'],
    keys: [['cadeia alimentar'], ['ecossistema'], ['amazonia']],
    answer: 'Na cadeia alimentar, a energia flui dos produtores (plantas que fazem fotossíntese) para os consumidores (herbívoros e carnívoros) até os decompositores (fungos e bactérias), que reciclam os nutrientes de volta ao solo.'
  },
  {
    subjects: ['ciencias'],
    keys: [['agua'], ['estados fisicos'], ['evaporacao']],
    answer: 'A água muda entre sólido, líquido e gasoso conforme ganha ou perde calor: fusão (sólido para líquido), vaporização (líquido para gasoso), condensação (vapor para líquido, formando nuvens) e solidificação (líquido para sólido).'
  },

  // História
  {
    subjects: ['historia'],
    keys: [['acre'], ['revolucao acreana'], ['placido de castro'], ['petropolis']],
    answer: 'A Revolução Acreana (1899–1903) foi liderada por seringueiros e por Plácido de Castro para garantir que o território do Acre permanecesse brasileiro diante das disputas com a Bolívia e o Bolivian Syndicate. O conflito encerrou-se diplomaticamente com o Tratado de Petrópolis (1903), pelo qual o Brasil incorporou o Acre.'
  },
  {
    subjects: ['historia'],
    keys: [['dom pedro'], ['segundo reinado'], ['imperio']],
    answer: 'O Segundo Reinado (1840–1889), governado por Dom Pedro II, marcou a consolidação do Estado brasileiro, a expansão cafeeira no Sudeste, o crescimento das ferrovias e pressões abolicionistas que levaram à Lei Áurea (1888) e à Proclamação da República em 1889.'
  },
  {
    subjects: ['historia'],
    keys: [['republica'], ['independencia'], ['vargas']],
    answer: 'Para analisar momentos decisivos da História do Brasil — como a Independência (1822), a Proclamação da República (1889) ou a Era Vargas (1930–1945) — observe três eixos: quem detinha o poder político, quais grupos econômicos apoiaram a mudança e o que mudou nos direitos da população trabalhadora.'
  },

  // Geografia
  {
    subjects: ['geografia'],
    keys: [['jurua'], ['cruzeiro do sul'], ['acre'], ['amazonia'], ['mercado regional']],
    answer: 'O Vale do Juruá, com polo em Cruzeiro do Sul (AC), destaca-se pelo Rio Juruá — eixo histórico de transporte, pesca e economia extrativista e agrícola (como a famosa farinha de mandioca de Cruzeiro do Sul) — inserido no clima equatorial quente e úmido da Amazônia Ocidental.'
  },
  {
    subjects: ['geografia'],
    keys: [['fuso horario']],
    answer: 'O Brasil possui quatro fusos horários a oeste de Greenwich. O Acre está no fuso -5 horas em relação a Londres (2 horas a menos em relação ao horário oficial de Brasília, que fica no fuso -3).'
  },
  {
    subjects: ['geografia'],
    keys: [['bioma'], ['clima']],
    answer: 'Os principais biomas brasileiros refletem o clima e o relevo: Amazônia (clima equatorial úmido), Cerrado (tropical típico), Caatinga (semiárido), Mata Atlântica (tropical litorâneo), Pampa (subtropical) e Pantanal (planície alagável).'
  },

  // Física / Química / Inglês
  {
    subjects: ['fisica'],
    keys: [['newton'], ['inercia'], ['forca'], ['velocidade']],
    answer: 'As três Leis de Newton explicam o movimento: 1ª (Inércia: um corpo mantém repouso ou velocidade constante sem força resultante); 2ª (F = m · a: força é massa vezes aceleração); 3ª (Ação e Reação: forças surgem sempre aos pares em corpos distintos). Já a velocidade média é ΔS ÷ Δt.'
  },
  {
    subjects: ['quimica'],
    keys: [['mistura'], ['homogenea'], ['heterogenea'], ['tabela periodica'], ['atomo']],
    answer: 'Misturas homogêneas têm apenas uma fase visível (ex.: água com sal dissolvido); heterogêneas exibem duas ou mais fases (ex.: água e óleo). Na tabela periódica, as colunas (famílias) reúnem elementos com propriedades químicas semelhantes e as linhas (períodos) indicam camadas eletrônicas.'
  },
  {
    subjects: ['ingles'],
    keys: [['to be'], ['simple present'], ['verbo'], ['do', 'does']],
    answer: 'No verbo "to be" (ser/estar), use "am" para I, "is" para he/she/it e "are" para you/we/they. No Simple Present (rotina e fatos), o verbo fica normal, mas ganha "-s" ou "-es" quando o sujeito é he, she ou it; nas perguntas e negativas, use "do" ou "does".'
  }
];

export function demoAnswer(subject, question) {
  const normQ = normalize(question);
  if (!normQ) return null;
  const exact = EXACT.get(normQ);
  if (exact) return exact;

  const normS = normalize(subject);
  let best = null;
  let bestScore = 0;

  for (const item of TOPICS) {
    const subjectBonus = item.subjects.some(s => normS.includes(s)) ? 1 : 0;
    for (const kwGroup of item.keys) {
      const matched = kwGroup.every(kw => normQ.includes(kw));
      if (matched) {
        const score = kwGroup.length * 10 + subjectBonus;
        if (score > bestScore) {
          bestScore = score;
          best = item.answer;
        }
      }
    }
  }
  return best;
}
