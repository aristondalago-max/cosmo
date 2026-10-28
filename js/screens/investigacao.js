// Módulo Investigação OVNI: Investigador científico, Árvore de Explicações, Modo Professor.
import { h } from '../util.js';
import { screen, card, section, note, muted, chips, button, field, stat, statRow, pill, levelBadge, spacer } from '../ui.js';
import { go, onLeave, toast } from '../router.js';
import { MODULES, featureById } from '../catalog.js';
import * as S from '../store.js';
import * as D from '../data.js';
import * as P from '../physics.js';
import { dateText, placeOf } from './comunidade.js';

// ---------------------------------------------------------------- Investigador
const EVIDENCES = [
  ['Hora exata e duração', 'Permite cruzar com passagens de satélites, voos e posição de planetas naquele minuto.'],
  ['Direção e altura no céu', 'Em graus ou "punhos acima do horizonte". Sem isso, não dá para saber o que estava naquela parte do céu.'],
  ['Vídeo com referência fixa', 'Poste, prédio ou árvore no quadro: permite medir movimento angular e descartar tremor da mão.'],
  ['Tráfego aéreo (ADS-B)', 'Sites como FlightRadar mostram todo avião com transponder no horário e na direção.'],
  ['Satélites e ISS previstos', 'Passagens são calculáveis com precisão de segundos (Heavens-Above, Stellarium).'],
  ['Condições atmosféricas', 'Nuvens, vento, inversão térmica e umidade explicam halos, reflexos e balões à deriva.'],
  ['Outra testemunha independente', 'Em outro ponto da cidade: se as duas viram na mesma direção, estava longe; se em direções diferentes, estava perto (paralaxe).'],
  ['Radar ou registro oficial', 'Raro, mas decisivo: dá distância e velocidade reais em vez de estimadas.'],
];
const HYPS = [
  ['A', 'Aeronave', 'Luzes piscando em ritmo regular (vermelha/verde/branca), som que pode chegar segundos depois, trajetória reta.'],
  ['B', 'Satélite / ISS', 'Ponto constante, sem piscar, cruza o céu em 1 a 5 minutos e pode sumir de repente ao entrar na sombra da Terra.'],
  ['C', 'Meteoro', 'Dura menos de 10 segundos, muito rápido, com rastro; às vezes verde ou com fragmentação.'],
  ['D', 'Balão / lanterna', 'Sobe devagar, oscila com o vento, cor laranja ou branca, apaga ou some ao longe.'],
  ['E', 'Astro ou fenômeno atmosférico', 'Parado por muito tempo, baixa lentamente, cintila e muda de cor perto do horizonte (Vênus, Júpiter, Sirius).'],
  ['F', 'Percepção / ilusão', 'Ponto parado que "se move" (autocinese), reflexo em vidro, tamanho e distância impossíveis de estimar à noite.'],
  ['G', 'Dados insuficientes', 'O relato não tem hora, direção, duração ou registro que permita testar qualquer hipótese.'],
];
const DISTINGUISH = {
  AB: 'Piscar: aeronaves têm luzes anticolisão intermitentes; satélites brilham de forma contínua. E o som.',
  AC: 'Duração: meteoro acaba em segundos; avião leva minutos para cruzar o céu.',
  AD: 'Trajetória: avião segue reta e rápido; balão deriva devagar e oscila com o vento.',
  AE: 'Movimento em relação às estrelas: um astro acompanha o céu (lentíssimo); um avião cruza o campo de estrelas.',
  AF: 'Referência fixa no vídeo: luz que se move contra um poste é real; sem referência, o olho inventa movimento.',
  AG: 'Com hora e direção, o tráfego aéreo confirma ou descarta em minutos. Sem isso, fica G.',
  BC: 'Velocidade angular: satélite leva minutos para cruzar o céu; meteoro cruza em segundos.',
  BD: 'Altura e direção: satélites aparecem alto e seguem reta; balões ficam baixos e vagam.',
  BE: 'Deslocamento em 1 minuto: satélite muda visivelmente de posição; planeta parece parado.',
  BF: 'Testemunha em outro bairro vendo a mesma trajetória descarta ilusão individual.',
  BG: 'Hora com precisão de minuto e direção aproximada bastam para checar passagens previstas.',
  CD: 'Duração: segundos (meteoro) versus minutos (balão).',
  CE: 'Rastro e velocidade: astro não deixa rastro nem se move em segundos.',
  CF: 'Meteoro é breve demais para autocinese; se durou segundos e teve rastro, não é ilusão.',
  CG: 'Duração e rastro já distinguem; sem hora, não dá para cruzar com redes de meteoros.',
  DE: 'Baixa ou sobe? Astro desce devagar para o horizonte; balão sobe e deriva.',
  DF: 'Balão filmado com referência fixa mostra deslocamento real; ilusão não.',
  DG: 'Vento no horário e eventos próximos são fáceis de obter se houver hora e local.',
  EF: 'Astro cintila perto do horizonte e, se você fixar uma referência (poste), ele não "anda".',
  EG: 'Direção e altura no céu resolvem: um app de planetário mostra o que estava ali.',
  FG: 'Sem referência, vídeo ou segunda testemunha, percepção e falta de dados se confundem: peça os dois.',
};
const BASE_CASE = { id: 'caso-base', city: 'Caso de aula', state: '', sightingAt: 0, durationText: '30 segundos', description: 'Luz parada no céu por uns 30 segundos e depois sumiu rápido.' };

export function investigador() {
  const cases = [BASE_CASE, ...S.allReports().slice(0, 8)];
  let step = 0, ci = 0, level = null, noteText = '';
  const asked = new Set(), chosen = new Set();
  const body = h('div', { class: 'stack' }), head = h('div');
  const el = screen({ title: 'Investigador científico', subtitle: '' }, head, body);
  const reset = () => { asked.clear(); chosen.clear(); level = null; noteText = ''; };
  const check = (on, ...kids) => h('div', { class: 'checkrow' + (on ? ' on' : '') }, h('div', { class: 'box' }, on ? '✓' : ''), h('div', null, ...kids));

  function render() {
    el.querySelector('.subtitle').textContent = `Etapa ${step + 1} de 5`;
    head.replaceChildren(chips(['Relato', 'Dados', 'Hipóteses', 'Distinguir', 'Rótulo'], step, (i) => { if (i <= step) { step = i; render(); } }));
    body.replaceChildren();
    const c = cases[ci];
    if (step === 0) {
      body.append(section('Você recebeu este relato'),
        chips(cases.map((x) => (x.id === 'caso-base' ? 'Caso de aula' : x.city)), ci, (i) => { ci = i; reset(); render(); }),
        card({ hl: true }, h('div', { style: { fontWeight: 600, fontSize: '16.5px' } }, `"${c.description}"`),
          h('div', { class: 'muted' }, `${c.id === 'caso-base' ? 'Caso de aula' : placeOf(c)} · ${c.sightingAt ? dateText(c.sightingAt) : 'sem data'} · ${c.durationText}`)),
        note('Um investigador não pergunta "o que era?". Pergunta "o que eu precisaria saber para descartar as explicações comuns?".'),
        button('Pedir dados →', () => { step = 1; render(); }));
    } else if (step === 1) {
      body.append(section('Que dados você pede à testemunha?'),
        ...EVIDENCES.map(([name, why], i) => card({ hl: asked.has(i), onClick: () => { asked.has(i) ? asked.delete(i) : asked.add(i); render(); } },
          check(asked.has(i), h('div', { class: 'ft' }, name), asked.has(i) ? h('div', { class: 'fs' }, why) : null))),
        asked.size < 3 ? h('div', { style: { color: 'var(--yellow)', fontSize: '13.5px' } }, 'Escolha pelo menos 3 tipos de dado.') : null,
        button('Formular hipóteses →', () => { if (asked.size >= 3) { step = 2; render(); } }));
    } else if (step === 2) {
      body.append(section('Quais explicações ainda não dá para descartar?'),
        ...HYPS.map(([k, name, signs]) => card({ hl: chosen.has(k), onClick: () => { chosen.has(k) ? chosen.delete(k) : chosen.add(k); render(); } },
          h('div', { class: 'ft' }, `${k}) ${name}`), h('div', { class: 'fs' }, signs))),
        chosen.size < 2 ? h('div', { style: { color: 'var(--yellow)', fontSize: '13.5px' } }, 'Marque pelo menos 2: investigar é comparar alternativas.') : null,
        button('O que precisamos medir? →', () => { if (chosen.size >= 2) { step = 3; render(); } }));
    } else if (step === 3) {
      const sel = [...chosen].sort();
      body.append(section('O que precisamos medir para distinguir?'));
      sel.forEach((a, i) => sel.slice(i + 1).forEach((b) => {
        const ha = HYPS.find((x) => x[0] === a), hb = HYPS.find((x) => x[0] === b);
        body.append(card(null, h('div', { class: 'accent', style: { fontWeight: 600 } }, `${ha[1]}  ×  ${hb[1]}`), h('div', { style: { marginTop: '4px' } }, DISTINGUISH[a + b] || 'Compare os sinais típicos de cada uma.')));
      }));
      const have = [...asked].map((i) => EVIDENCES[i][0]);
      body.append(note(`Você pediu: ${have.join(', ') || 'nada'}. Confira se isso cobre as medidas acima; se não, volte e peça mais.`), button('Classificar →', () => { step = 4; render(); }));
    } else {
      const nf = field({ label: 'Justificativa: o que foi medido e o que falta', multiline: true, value: noteText, onInput: (v) => (noteText = v) });
      const summary = h('div');
      const paintSummary = () => {
        summary.replaceChildren();
        if (!level) return;
        summary.append(card({ hl: true }, h('div', { style: { fontWeight: 600 } }, 'Resumo da investigação'),
          h('div', { class: 'muted' }, `Dados pedidos: ${asked.size} · Hipóteses em aberto: ${[...chosen].sort().join('')} · Rótulo: ${P.EMOJI[level]} ${P.EXPL_LEVELS[level].label}`),
          level === 'Red' ? h('div', { style: { color: 'var(--yellow)', fontSize: '13.5px', marginTop: '6px' } }, 'Vermelho exige medida, não impressão: velocidade ou aceleração calculadas a partir de distância conhecida. Se a distância foi estimada "a olho", o rótulo honesto é amarelo.') : null));
        if (c.id !== 'caso-base') summary.append(spacer(12), button(`Salvar no relato de ${c.city}`, async () => {
          await S.updateReport({ ...c, classification: level, classificationNote: noteText }); toast('Classificação salva'); step = 0; render();
        }));
      };
      const levelCards = h('div', { class: 'stack' });
      const paintLevels = () => levelCards.replaceChildren(...P.LEVEL_KEYS.map((k) => card({ hl: level === k, onClick: () => { level = k; paintLevels(); paintSummary(); } }, levelBadge(k, P.EXPL_LEVELS))));
      paintLevels(); paintSummary();
      body.append(section('Seu rótulo (nunca "alienígena")'), levelCards, nf, summary, button('Recomeçar', () => { step = 0; reset(); render(); }, 'ghost'));
    }
  }
  render();
  return el;
}

// ---------------------------------------------------------------- Árvore de Explicações
const Q = (id, question, hint, yes, no) => [id, { q: true, question, hint, yes, no }];
const L = (id, level, title, text) => [id, { q: false, level, title, text }];
const TREE = Object.fromEntries([
  Q('start', 'O objeto se moveu em relação às estrelas ou a algo fixo (poste, prédio)?', 'Olhe para uma referência. Sem referência, o olho inventa movimento (autocinese).', 'moved', 'still'),
  Q('still', 'Ficou no mesmo lugar por vários minutos e, se mudou, foi descendo devagar para o horizonte?', 'Astros fazem isso: acompanham o giro do céu, 15° por hora.', 'astro', 'stillb'),
  Q('stillb', 'Cintilava ou mudava de cor (vermelho, azul, branco), perto do horizonte?', 'Turbulência do ar faz estrelas brilhantes piscarem em cores.', 'scint', 'insuf1'),
  Q('moved', 'Durou menos de 10 segundos e deixou rastro?', 'Meteoros cruzam o céu em 1 a 5 segundos.', 'meteor', 'longer'),
  Q('longer', 'Tinha luzes piscando em ritmo regular (vermelha, verde, branca) ou veio som?', 'Toda aeronave tem luz anticolisão intermitente; o som chega atrasado.', 'aircraft', 'nolights'),
  Q('nolights', 'Era um ponto de brilho constante cruzando o céu em 1 a 5 minutos, sem piscar?', 'Satélites e a ISS: brilho contínuo, trajetória reta, podem sumir de repente ao entrar na sombra da Terra.', 'satq', 'slow'),
  Q('satq', 'Eram vários pontos em fila, na mesma linha e velocidade?', '"Trem" de satélites Starlink, comum nos dias após um lançamento.', 'starlink', 'satellite'),
  Q('slow', 'Subia devagar, oscilando, com cor laranja ou branca, e apagou ou sumiu ao longe?', 'Balões de festa com chama e lanternas chinesas se comportam assim com o vento.', 'balloon', 'evidence'),
  Q('evidence', 'Existe vídeo com referência fixa no quadro, ou uma segunda testemunha em outro ponto da cidade?', 'Sem isso, não dá para estimar distância, e sem distância não dá para estimar velocidade nem aceleração.', 'measured', 'insuf2'),
  Q('measured', 'A distância foi medida (radar, duas testemunhas, objeto conhecido ao lado) e não apenas estimada a olho?', 'Um ponto de luz à noite não tem tamanho nem distância reconhecíveis.', 'accel', 'insuf3'),
  Q('accel', 'Com a distância medida, a velocidade e as curvas calculadas exigem mais de 100 g ou superam a velocidade do som sem estrondo?', 'Use o Detector de Impossibilidades: a = v²/r.', 'ftl', 'compat'),
  Q('ftl', 'O relato implica velocidade acima da luz, ou aparecer e desaparecer sem deslocamento, com a distância medida?', 'Se sim, o mais provável é erro na medida, e a primeira ação é refazê-la.', 'red', 'orange'),
  L('astro', 'Green', 'Astro (planeta ou estrela brilhante)', 'Vênus, Júpiter ou Sirius são os "OVNIs" mais relatados do mundo. Um app de planetário no horário e direção confirma.'),
  L('scint', 'Green', 'Cintilação atmosférica', 'Estrela brilhante baixa no horizonte vista através de camadas de ar com temperaturas diferentes.'),
  L('meteor', 'Green', 'Meteoro', 'Pedra do tamanho de um grão de areia a uma uva queimando a 70 km de altura. Verde = níquel/magnésio.'),
  L('aircraft', 'Green', 'Aeronave', 'Avião, helicóptero ou drone. Tráfego aéreo no horário (ADS-B) normalmente identifica em minutos.'),
  L('satellite', 'Green', 'Satélite ou ISS', 'Passagens são previsíveis com precisão de segundos para qualquer cidade.'),
  L('starlink', 'Green', 'Trem de satélites', 'Dezenas de satélites recém-lançados ainda próximos uns dos outros.'),
  L('balloon', 'Green', 'Balão ou lanterna', 'Sobe com ar quente, deriva com o vento, apaga quando a chama acaba.'),
  L('insuf1', 'Yellow', 'Dados insuficientes', 'Sem movimento claro nem cintilação, falta hora, direção e duração para testar qualquer hipótese. Anote isso para o próximo relato.'),
  L('insuf2', 'Yellow', 'Dados insuficientes', 'Sem vídeo com referência ou segunda testemunha, distância e velocidade não existem como medida. O relato é válido; a conclusão, ainda não.'),
  L('insuf3', 'Yellow', 'Dados insuficientes (distância estimada)', 'Estimativas de distância à noite erram por 10× ou mais. Toda velocidade derivada delas herda o erro.'),
  L('compat', 'Green', 'Compatível com física conhecida', 'Velocidade e manobras dentro do que aeronaves, drones e objetos à deriva fazem. Resta identificar qual.'),
  L('orange', 'Orange', 'Exige tecnologia extraordinária', 'Acelerações acima do que qualquer veículo conhecido suporta, com distância medida. Hipótese especulativa: o próximo passo é repetir a medida com outro método, não concluir.'),
  L('red', 'Red', 'Contradiz princípios físicos conhecidos', 'Nada com massa supera c nem muda de lugar sem percorrer o caminho. Antes de qualquer conclusão: a medida está errada em algum ponto, e vale descobrir onde.'),
]);

export function arvore() {
  const path = [];
  const box = h('div', { class: 'stack' });
  const render = () => {
    const cur = TREE[path.length ? (path.at(-1)[1] ? TREE[path.at(-1)[0]].yes : TREE[path.at(-1)[0]].no) : 'start'];
    box.replaceChildren();
    if (path.length) {
      box.append(section('Seu caminho'), ...path.map(([id, yes], i) => card({ onClick: () => { path.length = i; render(); } },
        h('div', { class: 'muted', style: { margin: 0 } }, `${i + 1}. ${TREE[id].question}`), h('div', { class: 'accent', style: { fontWeight: 600 } }, yes ? 'Sim' : 'Não'))));
    }
    if (cur.q) {
      const id = Object.keys(TREE).find((k) => TREE[k] === cur);
      box.append(card({ hl: true }, h('div', { class: 'q-title' }, cur.question), h('div', { class: 'muted' }, cur.hint)),
        h('div', { class: 'btnrow' }, button('Não', () => { path.push([id, false]); render(); }, 'ghost'), button('Sim', () => { path.push([id, true]); render(); })));
    } else {
      box.append(card({ hl: true }, levelBadge(cur.level, P.EXPL_LEVELS), spacer(10), h('div', { class: 'q-title' }, cur.title), h('div', { style: { marginTop: '6px' } }, cur.text)),
        button('Recomeçar', () => { path.length = 0; render(); }), button('Voltar uma pergunta', () => { path.pop(); render(); }, 'ghost'));
    }
    box.append(note('A árvore nunca termina em "alienígena" porque isso não é uma explicação testável: é a ausência de uma. Os quatro rótulos dizem o que sabemos e o que falta medir.'));
  };
  render();
  return screen({ title: 'Árvore de Explicações', subtitle: 'Perguntas, não respostas prontas' }, box);
}

// ---------------------------------------------------------------- Modo Professor
const STAGES = [
  [5, 'Abertura: o relato', 'Despertar curiosidade sem dar resposta.', 'Ler em voz alta um relato real da Comunidade (ou o caso de aula). Perguntar: "o que vocês acham que era?" e anotar as respostas no quadro sem comentar.', 'comunidade', 'relatos'],
  [8, 'O que sabemos, de fato?', 'Separar observação de interpretação.', 'Em duplas, listar só o que foi observado (cor, duração, movimento) e riscar tudo que é interpretação ("nave", "veloz demais"). Pedir os dados que faltam.', 'investigacao', 'investigador'],
  [12, 'Física na mão: a = v²/r', 'Transformar "rápido demais" em número.', 'Com o Detector, estimar velocidade a partir de distância e tempo e calcular os g de uma curva. Comparar com 9 g (piloto) e 45 g (colisão). Discutir: e se a distância estiver errada 10×?', 'fisica', 'detector'],
  [10, 'Hipóteses em competição', 'Comparar alternativas em vez de defender uma.', 'Percorrer a Árvore de Explicações com o relato da abertura. Cada grupo anota em que pergunta a resposta era "não sei".', 'investigacao', 'arvore'],
  [10, 'Classificar sem concluir', 'Usar os quatro rótulos com justificativa.', 'Cada grupo escolhe o rótulo e escreve uma frase: "o que foi medido" e "o que falta". Comparar as escolhas: por que grupos diferentes chegaram a rótulos diferentes?', 'comunidade', 'relatos'],
  [5, 'Fechamento: a próxima vez', 'Sair com um método, não com uma resposta.', 'Montar coletivamente o cartão "se eu vir algo no céu": hora exata, direção, referência fixa, duração, vídeo com poste no quadro, segunda testemunha.', null, null],
];

export function professor() {
  let open = 0, running = false, elapsed = 0, timer = null;
  const total = STAGES.reduce((s, x) => s + x[0], 0) * 60;
  const sClock = stat('Cronômetro', '', ''), sStage = stat('Etapa agora', '', '');
  const startBtn = button('Começar a aula', () => { running = !running; paintTimer(); });
  const list = h('div');
  const current = () => { let acc = 0; for (let i = 0; i < STAGES.length; i++) { acc += STAGES[i][0] * 60; if (elapsed < acc) return i; } return STAGES.length - 1; };
  function paintTimer() {
    const cs = current();
    sClock.set(`${two(Math.floor(elapsed / 60))}:${two(elapsed % 60)}`, `de ${total / 60} min`);
    sStage.set(`${cs + 1} de 6`, STAGES[cs][1].split(':')[0]);
    startBtn.textContent = running ? 'Pausar' : elapsed === 0 ? 'Começar a aula' : 'Continuar';
    clearInterval(timer);
    if (running) timer = setInterval(() => { elapsed++; paintTimer(); paintList(); }, 1000);
  }
  const two = (n) => String(n).padStart(2, '0');
  function paintList() {
    const cs = current();
    list.replaceChildren(...STAGES.map(([min, title, goal, activity, mod, feat], i) => {
      const on = i === open;
      return h('div', { style: { marginBottom: '8px' } }, card({ hl: running && i === cs, onClick: () => { open = on ? -1 : i; paintList(); } },
        h('div', { class: 'row', style: { alignItems: 'center', gap: '8px' } }, h('div', { style: { flex: 1 } }, h('div', { class: 'ft' }, `${i + 1}. ${title}`), h('div', { class: 'fs' }, goal)), h('div', { style: { flex: 'none' } }, pill(`${min} min`))),
        on ? h('div', { style: { marginTop: '10px' } }, h('div', null, activity),
          mod ? h('button', { class: 'linkbtn', type: 'button', onClick: (e) => { e.stopPropagation(); go(`#/f/${mod}/${feat}`); } }, `Abrir: ${featureById(mod, feat).title} →`) : null) : null));
    }));
  }
  onLeave(() => clearInterval(timer));
  paintTimer(); paintList();
  return screen({ title: 'Modo Professor', subtitle: 'Aula de 50 minutos em 6 etapas' },
    statRow(sClock, sStage),
    h('div', { class: 'btnrow' }, startBtn, button('Zerar', () => { running = false; elapsed = 0; paintTimer(); paintList(); }, 'ghost')),
    section('Roteiro'), list,
    note('Roteiro provisório, montado a partir dos módulos do app. Será substituído pelas 6 etapas oficiais do projeto quando chegarem. A fórmula a = v²/r está na etapa 3.'));
}
