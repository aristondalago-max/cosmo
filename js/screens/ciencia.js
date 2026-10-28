// Módulo Ciência: Equação de Drake, Paradoxo de Fermi, Método de Trânsito.
import { h } from '../util.js';
import { screen, card, section, note, chips, slider, stat, statRow, resultRow, spacer, muted } from '../ui.js';
import { lineChart } from '../charts.js';
import * as F from '../fmt.js';
import * as P from '../physics.js';

// ---------------------------------------------------------------- Drake
const VARS = [
  ['N', 'Civilizações detectáveis', 'Número de civilizações na Via Láctea com as quais a comunicação seria possível hoje. É o resultado da equação.'],
  ['R*', 'Formação de estrelas', 'Quantas estrelas nascem por ano na nossa galáxia. Observações atuais: entre 1 e 3 por ano.'],
  ['fp', 'Com planetas', 'Fração dessas estrelas que têm planetas. Depois das missões Kepler e TESS, sabemos que é próxima de 1.'],
  ['ne', 'Planetas habitáveis por estrela', 'Quantos planetas por sistema poderiam sustentar vida (zona habitável, rochosos). Estimativas: de 0,1 a alguns.'],
  ['fl', 'Em que a vida surge', 'Fração desses planetas onde a vida de fato aparece. Só temos um exemplo: a Terra.'],
  ['fi', 'Com vida inteligente', 'Fração dos planetas com vida em que surge inteligência. Totalmente desconhecida.'],
  ['fc', 'Que se comunicam', 'Fração das civilizações que desenvolvem tecnologia detectável a distância, como rádio.'],
  ['L', 'Tempo de vida (anos)', 'Por quantos anos uma civilização continua emitindo sinais detectáveis. Pode ser de décadas a milhões de anos.'],
];

export function drake() {
  let p = { ...P.DRAKE_PRESETS['Drake (1961)'] };
  let sel = 0;
  const eq = h('div', { class: 'eq' });
  const varTitle = h('div', { style: { fontWeight: 600, marginTop: '12px' } });
  const varText = h('div', { class: 'muted', style: { marginTop: '4px' } });
  const renderEq = () => {
    eq.replaceChildren();
    VARS.forEach(([sym], i) => {
      eq.append(h('button', { class: 'sym' + (i === sel ? ' on' : ''), type: 'button', onClick: () => { sel = i; renderEq(); } }, sym));
      if (i === 0) eq.append(h('span', { class: 'eqs' }, '='));
      else if (i < VARS.length - 1) eq.append(h('span', { class: 'eqs dim' }, '·'));
    });
    varTitle.textContent = `${VARS[sel][0]} — ${VARS[sel][1]}`;
    varText.textContent = VARS[sel][2];
  };
  const nBig = h('div', { class: 'nbig' });
  const nMsg = h('div', { class: 'center accent', style: { fontSize: '13.5px' } });
  const showN = () => {
    const n = P.drakeN(p);
    nBig.textContent = n < 0.01 ? F.sci(n, 1) : n < 10 ? F.num(n, 2) : n < 1e6 ? F.int(n) : F.sci(n, 1);
    nMsg.textContent = n < 1 ? 'Provavelmente estamos sozinhos na galáxia neste momento.'
      : n < 100 ? 'Pouquíssimas civilizações, espalhadas por 100 mil anos-luz: encontrar uma seria raro.'
        : 'Muitas civilizações. Então, onde estão? (Paradoxo de Fermi)';
  };
  const sliders = {};
  const mk = (key, label, min, max, log, fmt) => (sliders[key] = slider({
    label, value: p[key], min, max, log, fmt, onInput: (v) => { p[key] = v; presets.set(-1); showN(); },
  }));
  const names = Object.keys(P.DRAKE_PRESETS);
  const presets = chips(names, 0, (i) => {
    p = { ...P.DRAKE_PRESETS[names[i]] };
    Object.entries(sliders).forEach(([k, s]) => s.set(p[k]));
    showN();
  });
  renderEq(); showN();
  return screen({ title: 'Equação de Drake', subtitle: 'Quantas civilizações poderiam existir na Via Láctea?' },
    card(null, eq, varTitle, varText),
    card({ hl: true }, h('div', { class: 'sl', style: { color: 'var(--muted)', fontSize: '12px' } }, 'N ≈'), nBig, nMsg),
    section('Cenários'), presets,
    section('Ajuste cada variável'),
    card(null,
      mk('rStar', 'R* — estrelas novas por ano', 0.1, 100, true, (v) => F.num(v, 1)),
      mk('fp', 'fp — fração com planetas', 0, 1, false, (v) => F.num(v, 2)),
      mk('ne', 'ne — planetas habitáveis por estrela', 0.01, 5, true, (v) => F.num(v, 2)),
      mk('fl', 'fl — em que a vida surge', 0.0001, 1, true, (v) => F.num(v, 4)),
      mk('fi', 'fi — com vida inteligente', 0.0001, 1, true, (v) => F.num(v, 4)),
      mk('fc', 'fc — que se comunicam', 0.0001, 1, true, (v) => F.num(v, 4)),
      mk('lYears', 'L — anos emitindo sinais', 10, 1e7, true, (v) => F.int(v))),
    note('A equação não dá uma resposta: organiza a ignorância. As três primeiras variáveis são medidas pela astronomia; as quatro últimas são palpites. Mude fl, fi e fc e veja N variar de "zero" a "milhões" sem sair do que é possível.'));
}

// ---------------------------------------------------------------- Fermi
const HYP = [
  ['🌍', 'Terra Rara', 'A vida complexa exige condições tão específicas que a Terra pode ser quase única.',
    'Lua grande que estabiliza o eixo, Júpiter que desvia cometas, placas tectônicas, campo magnético, órbita estável por bilhões de anos. Micróbios podem ser comuns; animais e civilizações, raríssimos.',
    'Quais dessas condições já encontramos em exoplanetas? Quais ainda não conseguimos medir?'],
  ['🧱', 'Grande Filtro', 'Existe uma barreira quase intransponível em algum ponto entre matéria inerte e civilização interestelar.',
    'Se o filtro está no passado (origem da vida, célula complexa), já passamos por ele e o silêncio é bom sinal. Se está no futuro (autodestruição, colapso ambiental), o silêncio é um aviso.',
    'Se descobríssemos micróbios em Marte, isso seria boa ou má notícia para nós?'],
  ['🌲', 'Floresta Negra', 'Civilizações avançadas ficam em silêncio por medo: anunciar-se é arriscar ser destruído.',
    'Ideia popularizada pelo escritor Liu Cixin. Sem como confiar num desconhecido a anos-luz de distância, a estratégia mais segura seria esconder-se — e nós mesmos transmitimos sinais há um século.',
    'Vale a pena enviar mensagens deliberadas ao espaço? Quem deveria decidir isso?'],
  ['🦁', 'Zoológico', 'Estamos sendo observados sem interferência, como uma reserva protegida.',
    'Supõe civilizações capazes de nos encontrar e um acordo coletivo de não contato. É a hipótese mais difícil de testar: por construção, não deixa evidências.',
    'Uma hipótese que não pode ser testada ainda é científica? O que a distinguiria de uma crença?'],
  ['⏳', 'Janela Breve', 'Civilizações existem, mas por pouco tempo, e raramente coincidem no tempo e no espaço.',
    'A galáxia tem 13 bilhões de anos; nossa janela de rádio tem 100. Mesmo com milhares de civilizações ao longo da história, a chance de duas estarem ativas ao mesmo tempo e perto o bastante é pequena. É o papel de L na Equação de Drake.',
    'Quanto tempo você acha que uma civilização tecnológica dura, em média? O que sustenta esse palpite?'],
];

export function fermi() {
  let open = 1;
  const list = h('div');
  const render = () => {
    list.replaceChildren(...HYP.map(([emoji, name, short, long, q], i) => {
      const on = i === open;
      return h('div', { style: { marginBottom: '8px' } }, card({ hl: on, onClick: () => { open = on ? -1 : i; render(); } },
        h('div', { class: 'frow' }, h('div', { style: { fontSize: '26px' } }, emoji),
          h('div', { class: 'fbody' }, h('div', { class: 'ft' }, name), h('div', { class: 'fs' }, short))),
        on ? h('div', { style: { marginTop: '12px' } }, h('div', null, long),
          h('div', { class: 'accent', style: { marginTop: '10px', fontSize: '12px', letterSpacing: '1px' } }, 'PARA DISCUTIR'),
          h('div', { class: 'accent', style: { fontSize: '13.5px' } }, q)) : null));
    }));
  };
  render();
  return screen({ title: 'Paradoxo de Fermi', subtitle: 'Se o universo é tão grande e antigo, onde está todo mundo?' },
    card(null, 'O Paradoxo de Fermi questiona por que ainda não encontramos sinais de outras civilizações inteligentes, apesar de a Via Láctea ter centenas de bilhões de estrelas, muitas delas bilhões de anos mais velhas que o Sol. Se uma única civilização colonizasse a galáxia a 1% da velocidade da luz, levaria "apenas" alguns milhões de anos. Então: onde estão todos?'),
    section('Cinco hipóteses'), list,
    note('Nenhuma dessas hipóteses foi confirmada. O paradoxo é útil porque obriga a ser explícito sobre o que se assume: quantas civilizações, quanto duram, se viajam, se falam. Cada resposta é testável de um jeito diferente.'));
}

// ---------------------------------------------------------------- Trânsito
const PERIOD_S = 2.029 * P.DAY, STAR_MASS = 0.26 * P.M_SUN;

export function transito() {
  let planet = 0.99, star = 0.27, view = 0;
  const chart = lineChart({ series: [], xRange: [-3, 3], yRange: [0.998, 1.0002], xTicks: [-3, -2, -1, 0, 1, 2, 3], yTicks: [1], fx: (t) => String(t), fy: (v) => F.num(v, 4), xLabel: 'tempo a partir do meio do trânsito (horas)', yLabel: 'fluxo relativo' });
  const caption = muted('');
  const sDepth = stat('Profundidade', '', '(Rp / R★)²'), sDur = stat('Duração', '', 'de um trânsito');
  const sPer = stat('Período', `${F.num(PERIOD_S / P.DAY, 2)} dias`, 'um "ano" lá'), sOrb = stat('Órbita', '', 'Mercúrio: 0,39 UA');
  const rStar = resultRow('Estrela', ''), rPlanet = resultRow('Planeta', '');
  const earthNote = h('div', { class: 'muted' });
  const hours = Array.from({ length: 601 }, (_, i) => (i - 300) / 100);
  const update = () => {
    const rp = planet * P.R_EARTH, rs = star * P.R_SUN;
    const depth = P.transitDepth(rp, rs), a = P.semiMajorAxis(PERIOD_S, STAR_MASS), dur = P.transitDuration(PERIOD_S, rs, a);
    const ingress = dur * (rp / rs) / (1 + rp / rs);
    const withP = hours.map((x) => [x, P.transitFlux(x * 3600, depth, dur, ingress)]);
    const without = hours.map((x) => [x, 1]);
    const dec = depth >= 0.001 ? 4 : 5;
    chart.opts.series = view === 0 ? [withP] : view === 1 ? [without] : [withP, without];
    chart.opts.yRange = [Math.min(1 - depth * 1.6, 0.9995), 1.0002];
    chart.opts.yTicks = [1, 1 - depth / 2, 1 - depth];
    chart.opts.fy = (v) => F.num(v, dec);
    chart.redraw();
    caption.textContent = view === 1 ? 'Estrela sem planeta: brilho constante (o ruído real seria maior que esta linha).'
      : `Queda de ${F.num(depth * 100, 2)}% no brilho, repetida a cada ${F.num(PERIOD_S / P.DAY, 2)} dias.`;
    sDepth.set(`${F.num(depth * 100, 2)}%`, '(Rp / R★)²'); sDur.set(F.duration(dur), 'de um trânsito'); sOrb.set(`${F.num(a / P.AU, 3)} UA`, 'Mercúrio: 0,39 UA');
    rStar.set(star < 0.6 ? 'anã vermelha (tipo M)' : star < 1.15 ? 'parecida com o Sol' : 'maior que o Sol');
    rPlanet.set(planet < 1.25 ? 'rochoso, tamanho da Terra' : planet < 2 ? 'super-Terra' : 'gigante/mini-Netuno');
    earthNote.textContent = `Por que planetas pequenos são achados primeiro em estrelas pequenas: a Terra na frente do Sol tiraria só 0,008% do brilho; na frente de LHS 475, uma anã vermelha com 27% do raio solar, a mesma Terra tira ${F.num(P.transitDepth(P.R_EARTH, 0.27 * P.R_SUN) * 100, 2)}%, 13 vezes mais fácil de medir.`;
  };
  const el = screen({ title: 'Método de Trânsito', subtitle: 'LHS 475 b · exoplaneta confirmado' },
    chips(['Com planeta', 'Sem planeta', 'Comparar'], 0, (i) => { view = i; update(); }),
    h('div', null, chart, caption),
    statRow(sDepth, sDur), statRow(sPer, sOrb),
    section('Mude o planeta e a estrela'),
    card(null,
      slider({ label: 'Raio do planeta', value: planet, min: 0.3, max: 4, fmt: (v) => `${F.num(v, 2)} R⊕`, onInput: (v) => { planet = v; update(); } }),
      slider({ label: 'Raio da estrela', value: star, min: 0.1, max: 1.5, fmt: (v) => `${F.num(v, 2)} R☉`, onInput: (v) => { star = v; update(); } }),
      spacer(6), rStar, rPlanet),
    note(''), muted('Dados de referência: LHS 475 b, a 12,6 pc (41 anos-luz). Candidato identificado pelo TESS e confirmado pelo telescópio James Webb em 2023. Modelo trapezoidal, sem escurecimento de limbo; estrela com 0,26 massas solares.'));
  // o texto do note depende dos cálculos: preenche depois de montar
  const noteBox = el.querySelector('.note div:last-child');
  const origUpdate = update;
  const wrapped = () => { origUpdate(); noteBox.textContent = earthNote.textContent; };
  wrapped();
  return el;
}
