// Módulo Física: Laboratório, Planejador de Missão, Detector, Escala do Universo, Monte seu OVNI (2D).
import { h } from '../util.js';
import { screen, card, section, note, chips, slider, field, stat, statRow, resultRow, levelBadge, spacer, muted } from '../ui.js';
import { lineChart, drawing } from '../charts.js';
import * as F from '../fmt.js';
import * as P from '../physics.js';

const dec = (s) => parseFloat(String(s).replace(',', '.')) || 0;

// ---------------------------------------------------------------- Laboratório
export function laboratorio() {
  let mass = 1.0e6, beta = 0.1;
  const presets = [0.1, 0.5, 0.9, 0.99];
  const sGamma = stat('Fator γ', ''), sE = stat('Energia cinética', ''), sWorld = stat('Equivale a', '', '');
  const rGamma = resultRow('γ = 1 / √(1 − v²/c²)', ''), rMc2 = resultRow('m · c²', ''), rE = resultRow('Energia relativística', '', 'var(--accent)');
  const rCl = resultRow('Se fosse ½mv² (clássica)', ''), rPlus = resultRow('A relatividade acrescenta', '', 'var(--yellow)');
  const chart = lineChart({
    series: [Array.from({ length: 100 }, (_, i) => [i / 100, P.gamma(i / 100) - 1])], xRange: [0, 1], yRange: [0, 6],
    xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 1, 2, 3, 4, 5, 6], fx: (t) => `${Math.round(t * 100)}%`, fy: (t) => String(Math.round(t)),
    xLabel: 'velocidade (fração de c)', yLabel: 'E / mc²', marker: [beta, P.gamma(beta) - 1],
  });
  const chipsEl = chips(presets.map((p) => `${F.num(p * 100, 0)}% de c`), 0, (i) => { beta = presets[i]; sB.set(beta); update(); });
  const sM = slider({ label: 'Massa da nave', value: mass, min: 1e3, max: 1e8, log: true, fmt: F.massKg, onInput: (v) => { mass = v; update(); } });
  const sB = slider({ label: 'Velocidade', value: beta, min: 0.001, max: 0.995, fmt: (v) => F.speed(v * P.C), onInput: (v) => { beta = v; update(); } });
  function update() {
    const gm = P.gamma(beta), e = P.kineticEnergy(mass, beta), ec = P.classicalKinetic(mass, beta), wy = e / P.WORLD_ENERGY_PER_YEAR;
    sGamma.set(F.num(gm, gm < 2 ? 4 : 2)); sE.set(F.energy(e));
    sWorld.set(wy < 0.01 ? `${F.num(wy * 365, 1)} dias` : `${F.num(wy, wy < 10 ? 2 : 0)} anos`, 'de todo o consumo de energia da humanidade (~600 EJ/ano)');
    rGamma.set(F.num(gm, 4)); rMc2.set(F.energy(mass * P.C * P.C)); rE.set(F.energy(e)); rCl.set(F.energy(ec)); rPlus.set(`${F.num((e / ec - 1) * 100, 1)}%`);
    chart.opts.marker = [beta, gm - 1]; chart.redraw();
    const hit = presets.findIndex((p) => Math.abs(p - beta) < 1e-6); chipsEl.set(hit);
  }
  update();
  return screen({ title: 'Laboratório relativístico', subtitle: 'Quanta energia custa acelerar uma nave?' },
    card(null, sM, sB, spacer(8), chipsEl),
    statRow(sGamma, sE), sWorld,
    card(null, section('E = (γ − 1) · m · c²', true), spacer(6), rGamma, rMc2, rE, rCl, rPlus),
    section('Como a energia cresce com a velocidade'), chart,
    note('De 10% para 50% de c a energia cresce cerca de 31 vezes. Perto de c ela dispara: a 99% de c, γ ≈ 7, e a 99,9%, γ ≈ 22. É por isso que "quase a velocidade da luz" não é um detalhe de engenharia, mas uma barreira de energia.'),
    muted('Só a energia de movimento. Não inclui combustível carregado, frenagem no destino, nem a energia para voltar.'));
}

// ---------------------------------------------------------------- Planejador de Missão
export function missao() {
  let di = 3, pi = 0, payload = 1.0e6;
  const destChips = chips(P.MISSION_DESTS.map((d) => d.name), di, (i) => { di = i; refresh(); });
  const destNote = muted('');
  const list = h('div'), result = h('div', { class: 'stack' });
  const sPayload = slider({ label: 'Massa da nave (carga útil)', value: payload, min: 100, max: 1e7, log: true, fmt: F.massKg, onInput: (v) => { payload = v; renderResult(); } });
  const el = screen({ title: 'Planejador de Missão', subtitle: '' },
    section('Destino'), destChips, destNote,
    section('Propulsão'), list, card(null, sPayload),
    section('Resultado'), result,
    muted('Modelo simplificado: velocidade constante, sem frenagem no destino, sem combustível a bordo (que multiplicaria a massa muitas vezes).'));
  function renderList() {
    const d = P.MISSION_DESTS[di];
    list.replaceChildren(...P.PROPULSIONS.map((p, i) => {
      const on = i === pi;
      return h('div', { style: { marginBottom: '8px' } }, card({ hl: on, onClick: () => { pi = i; renderList(); renderResult(); } },
        h('div', { class: 'frow' }, h('div', { style: { fontSize: '24px' } }, P.EMOJI[p.level]),
          h('div', { class: 'fbody', style: { flex: 1 } }, h('div', { class: 'ft' }, p.name),
            h('div', { style: { color: P.COLOR[p.level], fontSize: '13.5px' } }, p.beta != null ? F.speed(p.beta * P.C) : 'sem velocidade definida')),
          p.beta != null ? h('div', { style: { color: 'var(--accent)', fontWeight: 600, fontSize: '13.5px' } }, F.duration(d.meters / (p.beta * P.C))) : null),
        on ? h('div', { style: { marginTop: '10px' } }, h('div', { class: 'muted', style: { marginTop: 0 } }, p.detail), spacer(8), levelBadge(p.level, P.PROP_LEVELS)) : null));
    }));
  }
  function renderResult() {
    const d = P.MISSION_DESTS[di], p = P.PROPULSIONS[pi];
    result.replaceChildren();
    if (p.beta == null) {
      result.append(card(null, levelBadge(p.level, P.PROP_LEVELS), spacer(10), p.level === 'Red'
        ? 'Não há tempo de viagem a calcular. Nenhuma teoria testada permite transportar massa ou informação acima de c; se fosse possível, haveria referenciais em que a chegada acontece antes da partida.'
        : 'Não há tempo de viagem a calcular. Um buraco de minhoca atravessável exigiria matéria com densidade de energia negativa em quantidade comparável à massa de uma estrela. Nunca foi observada nem produzida.'));
      return;
    }
    const r = P.missionCompute(d, p.beta, payload), gens = r.earthTimeSeconds / (25 * P.YEAR);
    const wy = r.worldEnergyYears;
    result.append(
      statRow(stat('Tempo na Terra', F.duration(r.earthTimeSeconds)), stat('Tempo a bordo', F.duration(r.shipTimeSeconds), p.beta < 0.05 ? 'sem dilatação perceptível' : 'dilatação do tempo')),
      card(null,
        resultRow('Velocidade de cruzeiro', F.speed(p.beta * P.C)),
        resultRow('Gerações a bordo (25 anos cada)', gens < 1 ? 'menos de 1' : F.num(gens, 0)),
        resultRow('Energia cinética da nave', F.energy(r.kineticEnergyJ), 'var(--accent)'),
        resultRow('Consumo mundial equivalente', wy * 365 * 24 < 0.1 ? 'menos de 1 hora' : wy < 1 / 365 ? `${F.num(wy * 365 * 24, 1)} horas` : wy < 1 ? `${F.num(wy * 365, 0)} dias` : `${F.num(wy, 0)} anos`),
        resultRow('Acelerar a 1 g até lá (a bordo)', F.duration(r.accelShipDays * P.DAY)),
        resultRow('Grão de poeira de 1 mg na proa', `${F.num(r.dustGrainTntGrams, r.dustGrainTntGrams < 10 ? 2 : 0)} g de TNT`, r.dustGrainTntGrams > 100 ? 'var(--red)' : null)),
      h('div', null, levelBadge(p.level, P.PROP_LEVELS)),
      note(`Nada chega a ${d.name} em menos de ${F.duration(d.lightTimeSeconds)}: esse é o tempo da própria luz. Com ${p.name.toLowerCase()}, a viagem leva ${F.duration(r.earthTimeSeconds)} no relógio da Terra.`));
  }
  function refresh() {
    const d = P.MISSION_DESTS[di];
    el.querySelector('.subtitle').textContent = `${d.name} · ${F.distance(d.meters)}`;
    destNote.textContent = d.note; renderList(); renderResult();
  }
  refresh();
  return el;
}

// ---------------------------------------------------------------- Detector de Impossibilidades
const DET_PRESETS = [
  ['Avião de linha', '250', '1', '5000'], ['Caça em manobra', '600', '1', '2000'],
  ['Relato: 10.000 km em 1 s', '10000', '1', '10000'], ['Mockup: 5 km/s, raio 100 m', '5', '1', '100'],
];

export function detector() {
  const fDist = field({ label: 'Percorreu', value: '10000', suffix: 'km', inputmode: 'decimal', onInput: () => { preset.set(-1); update(); } });
  const fTime = field({ label: 'em', value: '1', suffix: 's', inputmode: 'decimal', onInput: () => { preset.set(-1); update(); } });
  const fRad = field({ label: 'Raio da curva', value: '10000', suffix: 'm', inputmode: 'decimal', onInput: () => { preset.set(-1); update(); } });
  const preset = chips(DET_PRESETS.map((p) => p[0]), 2, (i) => { fDist.input.value = DET_PRESETS[i][1]; fTime.input.value = DET_PRESETS[i][2]; fRad.input.value = DET_PRESETS[i][3]; update(); });
  const sV = stat('Velocidade', ''), sA = stat('Aceleração', '');
  const r1 = resultRow('', ''), r2 = resultRow('', ''), r3 = resultRow('÷ 9,81 m/s²', '');
  const tolTitle = h('div', { style: { fontSize: '20px', fontWeight: 700 } }), tolText = h('div', { style: { marginTop: '6px' } }), warn = h('div', { class: 'red', style: { marginTop: '10px', fontSize: '13.5px' } });
  const ifBox = h('div');
  function update() {
    const d = dec(fDist.input.value), t = dec(fTime.input.value), r = dec(fRad.input.value);
    const v = t > 0 ? (d * 1000) / t : 0, a = r > 0 ? P.centripetal(v, r) : 0, g = P.toG(a), tol = P.toleranceOf(g), col = P.COLOR[tol.level];
    sV.set(F.speed(v), v > P.C ? 'acima de c!' : ''); sA.set(F.g(g), `${F.sci(a, 2)} m/s²`);
    r1.querySelector('.rl').textContent = 'v = distância / tempo'; r1.set(`${F.num(v, 0)} m/s`);
    r2.querySelector('.rl').textContent = `a = v² / r = (${F.num(v, 0)})² / ${F.num(r, 0)}`; r2.set(`${F.sci(a, 2)} m/s²`);
    r3.set(F.g(g), col);
    tolTitle.textContent = tol.label; tolTitle.style.color = col; tolText.textContent = tol.detail;
    warn.textContent = v > P.C ? `A velocidade relatada supera a da luz (${F.speed(P.C)}). Nada com massa faz isso.` : '';
    ifBox.replaceChildren();
    if (g > 9 && v > 0) {
      const v10 = (d * 1000) / 600, g10 = P.toG(P.centripetal(v10, r));
      ifBox.append(section('E se…'), card(null,
        resultRow('…a curva tivesse raio suficiente para 9 g?', F.distance(P.radiusFor(v, 9))),
        resultRow('…o mesmo trajeto levasse 10 minutos?', `${F.speed(v10)} → ${F.g(g10)}`),
        muted('A pergunta certa não é "o que era?", mas "quão bem medimos velocidade, distância e tempo?". Um erro de estimativa de distância muda a velocidade na mesma proporção.')));
    }
  }
  update();
  return screen({ title: 'Detector de Impossibilidades', subtitle: 'a = v² / r' },
    section('Exemplos'), preset,
    section('O que foi relatado'),
    h('div', { class: 'row2' }, fDist, fTime), fRad,
    section('Cálculo'), statRow(sV, sA), card(null, r1, r2, r3),
    card({ hl: true }, tolTitle, tolText, warn), ifBox,
    note('Referências: 1 g é a gravidade; montanha-russa ≈ 4 g; piloto com traje anti-g aguenta ~9 g por segundos; o recorde documentado de sobrevivência em desaceleração breve é ~46 g (John Stapp, 1954). Um objeto sem tripulação pode suportar mais, mas aviões e satélites se rompem bem antes de 1.000 g.'));
}

// ---------------------------------------------------------------- Escala do Universo
export function escala() {
  let idx = 5;
  const bar = drawing(70, (ctx, w, hh) => {
    const y = hh / 2, left = 10, right = w - 10, pos = (e) => left + ((e - 8) / 15) * (right - left);
    ctx.strokeStyle = '#26325a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.lineWidth = 2;
    for (let e = 8; e <= 23; e++) { ctx.beginPath(); ctx.moveTo(pos(e), y - 8); ctx.lineTo(pos(e), y + 8); ctx.stroke(); }
    P.SCALE_DESTS.forEach((d, i) => {
      const x = pos(Math.log10(d.meters)), on = i === idx;
      ctx.fillStyle = on ? '#eab308' : '#8ab4ff'; ctx.beginPath(); ctx.arc(x, y, on ? 10 : 6, 0, 7); ctx.fill();
      if (on) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); }
    });
  });
  const list = h('div');
  const sLight = stat('Luz', '', 'a 300.000 km/s'), sVoy = stat('Voyager 1', '', 'a 17 km/s');
  const rows = [resultRow('Distância', ''), resultRow('Em quilômetros', ''), resultRow('Enviar uma mensagem de rádio', ''), resultRow('Receber a resposta', '', 'var(--accent)'), resultRow('Avião a 900 km/h', '')];
  const nt = h('div');
  const el = screen({ title: 'Escala do Universo', subtitle: '' },
    h('div', null, bar, muted('Escala logarítmica: cada traço é 10× mais longe que o anterior')),
    section('Destinos'), list, section('Quanto tempo leva'), statRow(sLight, sVoy), card(null, ...rows), nt);
  function update() {
    const d = P.SCALE_DESTS[idx], light = d.lightTimeSeconds;
    el.querySelector('.subtitle').textContent = `Terra → ${d.name}`;
    bar.redraw();
    list.replaceChildren(...P.SCALE_DESTS.map((x, i) => h('div', { style: { marginBottom: '6px' } }, card({ hl: i === idx, onClick: () => { idx = i; update(); } },
      h('div', { class: 'row', style: { alignItems: 'center', gap: '8px' } }, h('div', { style: { flex: 1 } }, h('div', { class: 'ft' }, x.name), h('div', { class: 'fs' }, x.note)),
        h('div', { style: { flex: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '13.5px' } }, F.distance(x.meters)))))));
    sLight.set(F.duration(light), 'a 300.000 km/s'); sVoy.set(F.duration(d.meters / P.VOYAGER_SPEED), 'a 17 km/s');
    rows[0].set(F.distance(d.meters)); rows[1].set(`${F.sci(d.meters / 1e3, 2)} km`); rows[2].set(F.duration(light)); rows[3].set(F.duration(2 * light), 'var(--accent)'); rows[4].set(F.duration(d.meters / 250));
    nt.replaceChildren(note(d.lightYears < 1e-3
      ? 'Dentro do Sistema Solar o rádio funciona como conversa com atraso: com Marte, de 3 a 22 minutos por trecho.'
      : d.lightYears < 100
        ? `Uma pergunta enviada hoje para ${d.name} só teria resposta daqui a ${F.duration(2 * light)}. Qualquer visita de lá exigiria viagens de décadas a milênios.`
        : `A luz que vemos de ${d.name} saiu de lá há ${F.duration(light)}. Olhar longe é olhar para o passado.`));
  }
  update();
  return el;
}

// ---------------------------------------------------------------- Monte seu OVNI (2D)
export function ovni2d() {
  const s = { speed: 60, alt: 450, ang: 12, mass: 5, dia: 10 };
  const cap = muted('');
  const canvas = drawing(220, (ctx, w, hh) => {
    const f = P.ballistic(s.speed / 3.6, s.ang, s.alt), maxX = Math.max(f.rangeM, 50), maxY = Math.max(f.maxHeightM, 50) * 1.15, pad = 18;
    const px = (x) => pad + (x / maxX) * (w - 2 * pad), py = (y) => hh - pad - (y / maxY) * (hh - 2 * pad);
    ctx.fillStyle = '#121a33'; ctx.beginPath(); ctx.roundRect(0, 0, w, hh, 12); ctx.fill();
    ctx.strokeStyle = '#26325a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pad, py(0)); ctx.lineTo(w - pad, py(0)); ctx.stroke();
    ctx.strokeStyle = '#8ab4ff'; ctx.lineWidth = 3; ctx.beginPath();
    f.path.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y)))); ctx.stroke();
    const st = f.path[0], dw = Math.max((s.dia / maxX) * (w - 2 * pad), 28);
    ctx.fillStyle = '#bfd6ff'; ctx.beginPath(); ctx.ellipse(px(st.x), py(st.y) - dw / 12, dw / 2, dw / 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.ellipse(px(st.x), py(st.y) - dw / 5, dw / 4, dw / 8, 0, 0, 7); ctx.fill();
    const en = f.path[f.path.length - 1]; ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(px(en.x), py(en.y), 6, 0, 7); ctx.fill();
    cap.textContent = `Eixo horizontal: ${F.num(maxX, 0)} m · vertical: ${F.num(maxY, 0)} m`;
  });
  const sT = stat('Tempo até o chão', ''), sR = stat('Alcance', '');
  const rMax = resultRow('Altura máxima', ''), rImp = resultRow('Velocidade de impacto', '');
  const sF = stat('Empuxo', '', '= peso do disco'), sPw = stat('Potência mínima', '', 'empurrando ar');
  const nt = h('div');
  function update() {
    const f = P.ballistic(s.speed / 3.6, s.ang, s.alt), hover = P.hoverPowerW(s.mass * 1000, s.dia), thrust = s.mass * 1000 * P.G0;
    const pw = hover < 1e6 ? `${F.num(hover / 1e3, 0)} kW` : `${F.num(hover / 1e6, 1)} MW`;
    sT.set(F.duration(f.timeS)); sR.set(f.rangeM < 1000 ? `${F.num(f.rangeM, 0)} m` : F.distance(f.rangeM));
    rMax.set(`${F.num(f.maxHeightM, 0)} m`); rImp.set(`${F.num(Math.sqrt(Math.pow(s.speed / 3.6, 2) + 2 * P.G0 * s.alt) * 3.6, 0)} km/h`);
    sF.set(`${F.num(thrust / 1e3, 0)} kN`, '= peso do disco'); sPw.set(pw, 'empurrando ar');
    nt.replaceChildren(note(`Um helicóptero de 5 t usa cerca de 1,5–3 MW para pairar e faz muito barulho justamente porque acelera toneladas de ar por segundo. Um disco de ${F.num(s.mass, 1)} t e ${F.num(s.dia, 0)} m precisaria de pelo menos ${pw} só para se sustentar empurrando ar, e não seria silencioso. "Parado e sem som" é uma pista física importante: ou o objeto é muito leve (balão, lanterna), ou está muito mais longe do que parece, ou não está se sustentando no ar.`));
    canvas.redraw();
  }
  const sl = (label, key, min, max, fmt, log = false) => slider({ label, value: s[key], min, max, log, fmt, onInput: (v) => { s[key] = v; update(); } });
  const el = screen({ title: 'Monte seu OVNI', subtitle: 'Simulação 2D com física real' },
    h('div', null, canvas, cap),
    card(null, sl('Velocidade', 'speed', 0, 2000, (v) => `${F.num(v, 0)} km/h`), sl('Altitude', 'alt', 0, 5000, (v) => `${F.num(v, 0)} m`),
      sl('Inclinação', 'ang', -45, 80, (v) => `${F.num(v, 0)}°`), sl('Massa', 'mass', 0.5, 200, (v) => `${F.num(v, 1)} t`, true), sl('Diâmetro do disco', 'dia', 3, 60, (v) => `${F.num(v, 0)} m`)),
    section('Se os motores desligarem agora'), statRow(sT, sR),
    card(null, rMax, rImp, muted('Sem arrasto do ar. Qualquer objeto, do balão à aeronave, segue esta curva se nada o sustentar: a gravidade não faz exceções.')),
    section('Para ficar parado no ar'), statRow(sF, sPw), nt);
  update();
  return el;
}
