// A CAIXA: jornada filosófica em 5 atos (Parte 2 do descritivo). Sons sintetizados (Web Audio) e voz do piloto (SpeechSynthesis).
import { h } from '../util.js';
import { screen, card, section, note, muted, pill, chips, button, stat, spacer } from '../ui.js';
import { hbarList, drawing } from '../charts.js';
import { onLeave } from '../router.js';
import * as S from '../store.js';

const ACT_NAMES = ['A Caixa', 'As Pistas', 'O Labirinto da Linguagem', 'O Gato na Caixa', 'A Abertura'];
const LENSES = ['Avião Secreto', 'Fenômeno Atmosférico', 'Nave', 'Ilusão de Ótica', 'Drone'];
// Perguntas de journaling provisórias (as 3 oficiais do projeto ainda não chegaram).
const JOURNAL_Q = [
  'Que "caixa" você está tentando abrir agora na sua vida, e o que você já decidiu que tem dentro dela?',
  'Quando foi a última vez que uma pista confirmou o que você já acreditava? Como você testou?',
  'O que mudaria se "não sei" fosse uma resposta aceitável por um tempo?',
];

// ---------------------------------------------------------------- sons
let actx = null;
function ac() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function synth(seconds, fn, gain = 1) {
  try {
    const c = ac(), rate = c.sampleRate, n = Math.floor(rate * seconds), buf = c.createBuffer(1, n, rate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = fn(i / rate, i, n, rate);
    const src = c.createBufferSource(), g = c.createGain(); g.gain.value = gain;
    src.buffer = buf; src.connect(g).connect(c.destination); src.start();
  } catch { /* sem áudio: a experiência continua em silêncio */ }
}
const envl = (t, T, att) => Math.min(1, t / att, (T - t) / att);
const TAU = Math.PI * 2;
const Sounds = {
  hum(T = 2.5) { synth(T, (t) => (0.5 * Math.sin(TAU * 55 * t) + 0.25 * Math.sin(TAU * 110 * t + 0.3) + 0.08 * Math.sin(TAU * 0.7 * t) * Math.sin(TAU * 165 * t)) * envl(t, T, 0.1), 0.3); },
  hiss(T = 3) {
    let low = 0;
    synth(T, (t) => { low = low * 0.92 + (Math.random() * 2 - 1) * 0.08; const burst = Math.floor(t * 3) % 4 === 0 ? 0.6 : 0.25; return Math.max(-1, Math.min(1, low * 2 * burst + 0.15 * Math.sin(TAU * (400 + 60 * Math.sin(TAU * 0.5 * t)) * t))) * envl(t, T, 0.1); }, 0.28);
  },
  vacuum(T = 3.5) {
    let low = 0, ph = 0;
    synth(T, (t, i, n, rate) => { low = low * 0.97 + (Math.random() * 2 - 1) * 0.03; ph += (TAU * (900 * (1 - t / T) + 60)) / rate; return Math.max(-1, Math.min(1, 0.5 * Math.sin(ph) * (1 - t / T) + low * 3 * (t / T))) * envl(t, T, 0.25); }, 0.3);
  },
  speak(text) {
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; u.rate = 0.85; speechSynthesis.speak(u); } catch { /* sem voz */ }
  },
};

// ---------------------------------------------------------------- a caixa de metal (canvas animado)
function metalBox() {
  const p = { vibrate: false, transparency: 0, lid: 0, dust: false };
  const rnd = (() => { let s = 3; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const parts = Array.from({ length: 40 }, () => [rnd(), rnd(), rnd()]);
  const cv = drawing(260, () => {});
  const ctxOf = () => cv.getContext('2d');
  function frame(now) {
    if (!cv.isConnected) return;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (r.width) {
      if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(260 * dpr); }
      const ctx = ctxOf(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, 260);
      draw(ctx, r.width, 260, now / 1000);
    }
    requestAnimationFrame(frame);
  }
  function draw(ctx, W, H, t) {
    const jx = p.vibrate ? Math.sin(t * 70) * 3 : 0, jy = p.vibrate ? Math.cos(t * 83) * 2 : 0;
    const w = W * 0.5, hh = H * 0.5, left = (W - w) / 2 + jx, top = (H - hh) / 2 + 20 + jy, alpha = 1 - p.transparency * 0.85;
    ctx.fillStyle = 'rgba(27,42,85,.55)'; ctx.beginPath(); ctx.ellipse(W / 2, top + hh + 8, w / 2 + 20, 18, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(left, top, left + w, top + hh); g.addColorStop(0, '#8E97A8'); g.addColorStop(0.5, '#4C5468'); g.addColorStop(1, '#2B3042');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(left, top, w, hh, 6); ctx.fill();
    ctx.strokeStyle = '#B9C2D6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#D6DCE8';
    [[16, 16], [w - 16, 16], [16, hh - 16], [w - 16, hh - 16]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(left + x, top + y, 3, 0, 7); ctx.fill(); });
    ctx.save(); ctx.translate(left + w / 2, top); ctx.rotate((-p.lid * 110 * Math.PI) / 180); ctx.translate(-(left + w / 2), -top);
    const lg = ctx.createLinearGradient(left, top - 26, left + w, top); lg.addColorStop(0, '#A7B0C2'); lg.addColorStop(1, '#5C6578');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(left - 4, top - 24, w + 8, 24, 6); ctx.fill(); ctx.restore();
    ctx.globalAlpha = 1;
    if (p.transparency > 0) parts.forEach(([px, py, r], i) => {
      const a = t * 0.6 + i;
      ctx.fillStyle = `rgba(138,180,255,${(0.2 + r * 0.6) * p.transparency})`;
      ctx.beginPath(); ctx.arc(left + px * w + Math.cos(a) * 8, top + py * hh + Math.sin(a) * 8, 1.5 + r * 2.5, 0, 7); ctx.fill();
    });
    if (p.dust) parts.forEach(([px, py, r]) => { ctx.fillStyle = `rgba(207,201,184,${0.25 + r * 0.4})`; ctx.beginPath(); ctx.arc(left + px * w, top + py * hh - p.lid * 30 * r, 1 + r * 2, 0, 7); ctx.fill(); });
  }
  requestAnimationFrame(frame);
  cv.p = p;
  return cv;
}

// ---------------------------------------------------------------- radar com ruído (pista instrumental)
function radar() {
  const rnd = (() => { let s = 5; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const blips = Array.from({ length: 25 }, () => [rnd() * 360, 0.2 + rnd() * 0.75, rnd()]);
  const cv = drawing(200, () => {});
  const frame = (now) => {
    if (!cv.isConnected) return;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (r.width) {
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(200 * dpr);
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = r.width / 2, cy = 100, R = 92, sweep = ((now / 3000) % 1) * 360;
      ctx.fillStyle = '#0B2A1E'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = '#1E6B4A'; ctx.lineWidth = 1.2;
      [1, 2, 3].forEach((k) => { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 3, 0, 7); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      blips.forEach(([a, d, s]) => {
        const vis = Math.max(0, Math.min(1, 1 - ((sweep - a + 360) % 360) / 120));
        ctx.fillStyle = `rgba(92,255,168,${vis * (0.3 + s * 0.7)})`; ctx.beginPath();
        ctx.arc(cx + Math.cos((a * Math.PI) / 180) * R * d, cy + Math.sin((a * Math.PI) / 180) * R * d, 2 + s * 3, 0, 7); ctx.fill();
      });
      ctx.strokeStyle = '#5CFFA8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos((sweep * Math.PI) / 180) * R, cy + Math.sin((sweep * Math.PI) / 180) * R); ctx.stroke();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return cv;
}

// ---------------------------------------------------------------- conteúdo das pistas
const CLUES = [
  { kind: 'Pista sensorial (áudio)', title: 'Gravação de rádio, 23h41', base: 'Chiado. Um zumbido que sobe e desce. Uma voz de piloto: "…não consigo identificar… está parado agora… não, moveu…"', biased: {} },
  { kind: 'Pista testemunhal (texto)', title: 'Três depoimentos', base: 'T1: "Era triangular."  T2: "Era uma luz redonda."  T3: "Não tinha forma, só brilho."', biased: {
    'Avião Secreto': 'T1: "Era triangular, tipo asa."  T2: "Luz redonda, mas tinha outra atrás."  T3: "Brilho e um ruído baixo, como turbina longe."',
    'Fenômeno Atmosférico': 'T1: "Triangular… ou era o reflexo nas nuvens."  T2: "Luz redonda, meio difusa."  T3: "Sem forma, só brilho, como um halo."',
    'Nave': 'T1: "Era triangular, com cantos definidos."  T2: "Luz redonda, muito nítida, parada no ar."  T3: "Não tinha forma, mas era sólido, dava para sentir."',
    'Ilusão de Ótica': 'T1: "Triangular… olhando bem, pode ter sido a moldura da janela."  T2: "Luz redonda, mas eu estava cansado."  T3: "Não tinha forma. Talvez nem estivesse lá."',
    'Drone': 'T1: "Triangular, com luzinhas nas pontas."  T2: "Luz redonda piscando."  T3: "Sem forma, só brilho, e um zumbido fino."' } },
  { kind: 'Pista instrumental (visual)', title: 'Radar, foto e infravermelho', base: 'Radar: um retorno fraco, intermitente. Foto: borrão claro sobre fundo escuro. Infravermelho: ponto morno, sem rastro de calor.', biased: {
    'Avião Secreto': 'Radar: retorno fraco, como superfície absorvente. Foto: borrão alongado. Infravermelho: ponto morno na traseira, como exaustão.',
    'Fenômeno Atmosférico': 'Radar: retorno fraco e intermitente, típico de ar úmido. Foto: borrão difuso. Infravermelho: temperatura igual ao entorno.',
    'Nave': 'Radar: retorno intermitente, aparece e some. Foto: borrão com borda nítida. Infravermelho: ponto morno sem motor visível.',
    'Ilusão de Ótica': 'Radar: nada consistente. Foto: borrão compatível com reflexo interno da lente. Infravermelho: nada além do céu.',
    'Drone': 'Radar: retorno fraco, alvo pequeno. Foto: borrão com pontos de luz. Infravermelho: ponto morno pequeno, como bateria.' } },
];
const FORBIDDEN = ['luz', 'voa', 'objeto', 'luzes', 'voando', 'voou', 'objetos'];

// ---------------------------------------------------------------- tela
export function caixa() {
  const wrap = h('div', { class: 'fill' });
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const tally = [];
  const saved = () => S.getPref('caixaAct', 0);
  const unlock = (n) => S.setPref('caixaAct', Math.max(saved(), n));
  onLeave(() => { timers.forEach(clearTimeout); try { speechSynthesis.cancel(); } catch { /* ok */ } });
  const show = (n) => {
    timers.splice(0).forEach(clearTimeout);
    try { speechSynthesis.cancel(); } catch { /* ok */ }
    wrap.replaceChildren([menu, act1, act2, act3, act4, act5, reflexao][n]());
    document.getElementById('view').scrollTop = 0;
  };
  const frame = (n, ...kids) => h('div', { class: 'screen plain' },
    h('div', { class: 'act-top' }, h('button', { type: 'button', onClick: () => show(0) }, '← atos'), h('span', null, `Ato ${n} · ${ACT_NAMES[n - 1]}`)), ...kids);

  function menu() {
    const sv = saved(), done = Math.min(Math.max(sv - 1, 0), 5);
    return screen({ title: 'A CAIXA', subtitle: 'Uma jornada filosófica em 5 atos' },
      card({ hl: true }, h('div', { style: { fontWeight: 600 } }, sv === 0 ? 'A jornada ainda não começou.' : sv >= 6 ? 'Jornada concluída. Você pode reler qualquer ato ou voltar à reflexão.' : `Ato ${sv} de 5 · ${done * 20}% concluído`),
        h('div', { class: 'progress' }, h('i', { style: { width: Math.max(2, sv >= 6 ? 100 : done * 20) + '%' } }))),
      section('5 atos'),
      ...ACT_NAMES.map((name, i) => {
        const n = i + 1, open = n <= sv || sv >= 6;
        return card({ hl: n === sv, onClick: open ? () => show(n) : null }, h('div', { class: 'row', style: { alignItems: 'center' } },
          h('div', { style: { flex: 1 } }, h('div', { class: 'accent', style: { fontSize: '12px', letterSpacing: '1px' } }, `ATO ${n}`), h('div', { class: 'ft', style: open ? null : { color: 'var(--muted)' } }, name)),
          h('div', { style: { flex: 'none' } }, pill(!open ? 'bloqueado' : n < sv || sv >= 6 ? 'concluído' : 'ativo', open ? null : 'var(--muted)'))));
      }),
      sv >= 6 ? card({ onClick: () => show(6) }, h('div', { class: 'ft' }, 'Reflexão final (journaling)')) : null,
      button(sv === 0 ? 'Começar' : sv >= 6 ? 'Reler do início' : 'Continuar jornada', () => { if (sv === 0) unlock(1); show(sv >= 6 ? 1 : sv || 1); }),
      muted('Use fones. Os sons são parte da experiência. Dura cerca de 10 minutos.'));
  }

  function act1() {
    let tries = 0;
    const msg = h('div', { class: 'muted center' });
    const box = metalBox(); box.p.vibrate = true; box.classList.add('metalbox');
    Sounds.hum();
    return frame(1, spacer(24), box, spacer(8),
      h('div', { class: 'big center' }, 'Há algo aqui dentro.', h('br'), 'Recebemos um relato.'), spacer(24),
      h('div', { class: 'btnrow' },
        button('ABRIR', () => { tries++; Sounds.hum(1.2); msg.textContent = ['Não abre.', 'Continua fechada. Só vibra.', 'Você só pode investigar.', 'Abrir não é uma opção. Ainda.'][Math.min(tries - 1, 3)]; }, 'ghost'),
        button('INVESTIGAR', () => { unlock(2); show(2); })), spacer(10), msg);
  }

  function act2() {
    let clue = 0, last = null;
    const body = h('div', { class: 'stack' });
    const paint = () => {
      const c = CLUES[Math.min(clue, 2)];
      const text = last && c.biased[last] ? c.biased[last] : c.base;
      body.replaceChildren(pill(c.kind), h('h2', { class: 'big' }, c.title), clue >= 2 ? radar() : null, card(null, text),
        h('div', { class: 'accent', style: { fontWeight: 600, marginTop: '6px' } }, 'O que você acha que é?'),
        chips(LENSES, -1, (i) => { tally.push(i); last = LENSES[i]; clue = Math.min(clue + 1, 3); if (clue === 1) {/* nada */} paint(); }),
        tally.length ? section('Sua percepção está moldando seus dados') : null,
        tally.length ? card(null, hbarList(LENSES.map((l, i) => [l, tally.filter((x) => x === i).length])), spacer(8),
          muted(clue < 3 ? `Repare: a próxima pista vai parecer mais com "${last}". Não porque a pista mudou. Porque você mudou.`
            : 'Três pistas, três escolhas. As pistas que você leu depois da primeira escolha já vinham filtradas por ela. Isso é viés de confirmação, ao vivo.')) : null,
        clue === 3 ? button('Continuar →', () => { unlock(3); show(3); }) : null);
    };
    tally.length = 0;
    Sounds.hiss(); Sounds.speak('não consigo identificar… está parado agora… não, moveu');
    paint();
    return frame(2, body);
  }

  function act3() {
    let sent = false;
    const ta = h('textarea', { class: 'dark', placeholder: 'Escreva aqui…' });
    const warn = h('div', { class: 'red', style: { fontSize: '13.5px' } }), out = h('div', { class: 'stack' });
    const words = () => ta.value.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
    ta.addEventListener('input', () => { sent = false; out.replaceChildren(); const bad = [...new Set(words().filter((w) => FORBIDDEN.includes(w)))]; ta.classList.toggle('bad', bad.length > 0); warn.textContent = bad.length ? `Palavra proibida: ${bad.join(', ')}` : ''; });
    return frame(3, spacer(6), h('div', { class: 'red', style: { fontSize: '12px', letterSpacing: '1px' } }, 'O APP TRAVOU.'),
      h('h2', { class: 'big' }, 'Descreva o que está na caixa sem usar as palavras "luz", "voa" ou "objeto".'), spacer(8), ta, warn, spacer(8),
      button('Enviar descrição', () => {
        const w = words(), bad = w.some((x) => FORBIDDEN.includes(x));
        if (bad) return; if (w.length < 3) { warn.textContent = 'Escreva pelo menos 3 palavras.'; return; }
        const key = w.find((x) => x.length > 4) || 'vermelho';
        out.replaceChildren(card({ hl: true }, h('div', { style: { fontWeight: 600, fontSize: '17px' } }, `Eu não consigo saber se o que você chama de "${key}" é o mesmo que eu vejo.`), spacer(8), h('div', { style: { fontWeight: 600, fontSize: '17px' } }, 'Sua caixa é só sua.')),
          note('Experiência privada: cada palavra que você usou aponta para algo que só você viu. A linguagem é um jogo combinado entre pessoas, e aqui o jogo falha, porque não há como comparar o que está dentro de cada um. (Wittgenstein, Investigações Filosóficas, §293: o "besouro na caixa".)'),
          button('Continuar →', () => { unlock(4); show(4); }));
      }), spacer(10), out);
  }

  function act4() {
    const box = metalBox(); box.classList.add('metalbox');
    const cont = h('div');
    const t0 = performance.now();
    (function tween(now) { if (!box.isConnected && now - t0 > 100) return; box.p.transparency = Math.min(1, (now - t0 - 600) / 5000); if (box.p.transparency < 1) requestAnimationFrame(tween); })(t0);
    later(() => cont.replaceChildren(button('Continuar →', () => { unlock(5); show(5); })), 5800);
    return frame(4, spacer(14), box, spacer(10),
      h('div', { class: 'big' }, 'Enquanto você não abre, é tudo e é nada ao mesmo tempo.'), spacer(10),
      h('div', { class: 'accent', style: { fontWeight: 600, fontSize: '17px' } }, 'A sua necessidade de uma resposta é o que mantém a caixa fechada.'), spacer(16),
      card(null, h('div', { class: 'muted', style: { margin: 0 } }, 'Outras pessoas também estão olhando para esta caixa agora. Não sabemos quantas. Isso também faz parte da caixa.')), spacer(10),
      note('Schrödinger propôs o gato na caixa em 1935 para mostrar como é estranho tratar a superposição quântica como se valesse para coisas grandes. Aqui a caixa é uma metáfora: o que você não mediu ainda não tem a forma que você imagina.'), spacer(16), cont);
  }

  function act5() {
    const box = metalBox(); box.classList.add('metalbox');
    const area = h('div', { class: 'stack' });
    area.append(h('div', { class: 'big center' }, 'Está na hora.'), button('ABRIR A CAIXA', open));
    function open() {
      Sounds.vacuum();
      area.replaceChildren(h('div', { class: 'big center muted' }, '…'));
      const t0 = performance.now();
      (function tw(now) { box.p.lid = Math.min(1, (now - t0) / 4000); box.p.dust = box.p.lid > 0.6; if (box.p.lid < 1 && box.isConnected) requestAnimationFrame(tw); })(t0);
      later(() => { const w = h('div', { class: 'whiteout' }); document.body.append(w); later(() => { w.remove(); final(); }, 3000); onLeave(() => w.remove()); }, 4500);
    }
    function final() {
      const fav = tally.length ? LENSES[[0, 1, 2, 3, 4].sort((a, b) => tally.filter((x) => x === b).length - tally.filter((x) => x === a).length)[0]] : null;
      area.replaceChildren(h('div', { class: 'muted' }, 'Vazia. Completamente vazia. Só poeira.'),
        h('div', { class: 'big' }, '"Você passou todo esse tempo tentando identificar algo que nunca foi apresentado a você."'),
        h('div', null, 'O OVNI nunca esteve na caixa. Estava na sua interpretação.'), h('div', null, 'Todo OVNI é isso: algo percebido, mas nunca identificado.'),
        h('div', { class: 'accent', style: { fontWeight: 600, fontSize: '17px' } }, 'E quantas outras caixas na sua vida você está tentando abrir?'),
        fav ? card(null, h('div', { class: 'muted', style: { margin: 0 } }, `No Ato 2 você escolheu "${fav}" mais vezes. A caixa nunca soube disso.`)) : null,
        button('Refletir →', () => { S.setPref('caixaAct', 6); show(6); }));
    }
    return frame(5, spacer(14), box, spacer(10), area);
  }

  function reflexao() {
    return screen({ title: 'Reflexão', subtitle: 'Três perguntas. Suas respostas ficam só neste aparelho.', back: false },
      h('button', { class: 'chip', type: 'button', style: { alignSelf: 'flex-start' }, onClick: () => show(0) }, '← atos'),
      ...JOURNAL_Q.flatMap((q, i) => [h('div', { style: { fontWeight: 600 } }, q),
        h('textarea', { class: 'dark', value: S.getPref('journal' + i, ''), onInput: (e) => S.setPref('journal' + i, e.target.value) })]),
      note('Perguntas provisórias: serão trocadas pelas 3 perguntas oficiais do projeto quando chegarem. O texto é salvo automaticamente.'),
      button('Voltar aos atos', () => show(0)));
  }

  show(0);
  return wrap;
}
