// Módulo Comunidade: relatos (lista, envio, detalhe), mapa, estatísticas e galeria. Tudo fica neste aparelho.
import { h, icon } from '../util.js';
import { screen, card, section, note, muted, pill, chips, button, toggle, field, stat, statRow, resultRow, levelBadge, spacer } from '../ui.js';
import { barChart, hbarList, donut } from '../charts.js';
import { go, onLeave, onMount, toast, refresh } from '../router.js';
import * as S from '../store.js';
import * as D from '../data.js';
import * as P from '../physics.js';
import * as F from '../fmt.js';

const PERIODS = ['Madrugada', 'Manhã', 'Tarde', 'Noite'];
export const hourOf = (r) => new Date(r.sightingAt).getHours();
export const periodOf = (r) => PERIODS[Math.min(3, Math.floor(hourOf(r) / 6))];
export const yearOf = (r) => new Date(r.sightingAt).getFullYear();
export const placeOf = (r) => (r.state ? `${r.city}, ${r.state}` : r.city);
export const dateText = (ms) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
const hasPhoto = (r) => r.media.some((m) => m.kind === 'Foto');
const hasVideo = (r) => r.media.some((m) => m.kind === 'Video');

/** Miniatura/visualização de uma mídia guardada (foto ou vídeo). */
function mediaBox(m, { controls = false, onClick } = {}) {
  const box = h('div', { class: 'mbox', onClick });
  S.mediaURL(m.id).then((u) => {
    if (!u) return;
    box.prepend(m.kind === 'Foto' ? h('img', { src: u, alt: '', loading: 'lazy' })
      : h('video', { src: controls ? u : u + '#t=0.1', preload: 'metadata', muted: !controls, playsInline: true, controls }));
  });
  if (m.kind === 'Video' && !controls) box.append(icon('play', 44));
  return box;
}

export function reportCard(r, onClick) {
  const thumb = r.media[0];
  return card({ onClick }, h('div', { class: 'rc' },
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', { class: 'rc-title' }, placeOf(r), r.isExample ? pill('exemplo', 'var(--muted)') : null),
      h('div', { class: 'rc-meta' }, `${dateText(r.sightingAt)} · ${r.durationText}`),
      h('div', { class: 'rc-desc' }, r.description),
      h('div', { class: 'rc-tags' }, pill(D.shortShape(r.shape)),
        hasPhoto(r) ? icon('camera', 16) : null, hasVideo(r) ? icon('video', 16) : null,
        r.classification ? pill(`${P.EMOJI[r.classification]} ${P.EXPL_LEVELS[r.classification].short}`, P.COLOR[r.classification]) : null)),
    thumb ? mediaBox(thumb) : null));
}

// ---------------------------------------------------------------- Mapa (Leaflet + OpenStreetMap)
function makeMap(box, { center = [-27.2, -49.3], zoom = 7, interactive = true } = {}) {
  const map = L.map(box, { zoomControl: false, attributionControl: true, dragging: interactive, touchZoom: interactive, scrollWheelZoom: interactive, doubleClickZoom: interactive, boxZoom: false, keyboard: false }).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
  const layer = L.layerGroup().addTo(map);
  const setPoints = (points, onClick) => {
    layer.clearLayers();
    points.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="pin"><span>${p.count || ''}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 30] }), title: p.title });
      if (onClick) m.on('click', () => onClick(p));
      m.addTo(layer);
    });
  };
  return { map, setPoints };
}

// ---------------------------------------------------------------- Relatos (lista)
export function relatos() {
  const st = { q: '', media: 0, shape: 0, period: 0, year: 0, open: false };
  const list = h('div', { class: 'stack' });
  const panel = h('div', { class: 'stack' });
  const examples = toggle('Mostrar exemplos do app', S.getPref('showExamples', true), (v) => { S.setPref('showExamples', v); render(); });
  const mediaChips = chips(['Todos', 'Com foto', 'Com vídeo', 'Sem mídia'], 0, (i) => { st.media = i; render(); });
  const search = field({ label: 'Buscar', placeholder: 'Cidade, estado ou palavra-chave', onInput: (v) => { st.q = v; render(); } });
  const el = screen({ title: 'Relatos', subtitle: '' },
    button('+ Enviar relato', () => go('#/f/comunidade/enviar')), search,
    h('div', { class: 'row', style: { alignItems: 'center', gap: '8px' } },
      h('button', { class: 'chip', type: 'button', style: { flex: 'none' }, onClick: () => { st.open = !st.open; render(); } }, 'Filtros ▾'), h('div', { style: { minWidth: 0 } }, mediaChips)),
    panel, list);
  function render() {
    const base = S.visibleReports();
    const years = [...new Set(base.map(yearOf))].sort((a, b) => b - a);
    const shapes = ['Todos', ...Object.keys(D.SHAPES).map(D.shortShape)];
    panel.replaceChildren();
    if (st.open) {
      panel.append(section('Formato'), chips(shapes, st.shape, (i) => { st.shape = i; render(); }),
        section('Horário'), chips(['Todos', ...PERIODS], st.period, (i) => { st.period = i; render(); }),
        section('Ano'), chips(['Todos', ...years.map(String)], st.year, (i) => { st.year = i; render(); }), examples);
    }
    const q = st.q.trim().toLowerCase();
    const out = base.filter((r) => (!q || r.city.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.state.toLowerCase() === q)
      && (st.media === 0 || (st.media === 1 && hasPhoto(r)) || (st.media === 2 && hasVideo(r)) || (st.media === 3 && !r.media.length))
      && (st.shape === 0 || r.shape === Object.keys(D.SHAPES)[st.shape - 1])
      && (st.period === 0 || periodOf(r) === PERIODS[st.period - 1])
      && (st.year === 0 || yearOf(r) === years[st.year - 1]));
    el.querySelector('.subtitle').textContent = `${out.length} de ${base.length} avistamentos`;
    list.replaceChildren(...(out.length ? out.map((r) => reportCard(r, () => go('#/relato/' + r.id)))
      : [muted(S.ownReports().length || S.getPref('showExamples', true) ? 'Nenhum relato com esses filtros.' : 'Nenhum relato ainda. Toque em "Enviar relato" para registrar o primeiro.')]));
  }
  render();
  return el;
}

// ---------------------------------------------------------------- Envie seu relato
const two = (n) => String(n).padStart(2, '0');
export function enviar() {
  const now = new Date();
  const st = { shape: 0, weather: 0, company: 0, anon: !S.getPref('nickname', ''), media: [], city: '', submitted: false };
  const fCity = field({ label: 'Cidade', placeholder: 'Ex.: Itajaí, SC', onInput: (v) => { st.city = v; cityHint(); } });
  const fDate = field({ label: 'Data', type: 'date', value: `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`, onInput: () => {} });
  const fTime = field({ label: 'Hora', type: 'time', value: `${two(now.getHours())}:${two(now.getMinutes())}`, onInput: () => {} });
  const fDur = field({ label: 'Quanto tempo durou?', placeholder: 'Ex.: 45 segundos, 2 horas', onInput: () => {} });
  const fDesc = field({ label: 'Descrição', multiline: true, placeholder: 'Cor, brilho, movimento, som, direção, o que havia perto (prédios, mar, aeroporto)…', onInput: () => {} });
  const hint = h('div'), suggest = h('div'), previews = h('div', { class: 'thumbs' }), err = h('div', { class: 'err-msg' });
  const file = h('input', { type: 'file', accept: 'image/*,video/*', multiple: true, style: { display: 'none' } });
  const nick = S.getPref('nickname', '');
  function cityHint() {
    const c = D.findCity(st.city);
    hint.replaceChildren(c ? h('div', { class: 'ok-msg' }, `No mapa: ${c.name}, ${c.state}`) : st.city.trim() ? muted('Cidade fora da lista: o relato entra sem ponto no mapa.') : '');
    const sg = c ? [] : D.citySuggestions(st.city);
    suggest.replaceChildren(sg.length ? chips(sg.map((x) => `${x.name}, ${x.state}`), -1, (i) => { fCity.input.value = `${sg[i].name}, ${sg[i].state}`; st.city = fCity.input.value; cityHint(); }) : '');
  }
  function renderPreviews() {
    previews.replaceChildren(...st.media.map((m) => {
      const box = mediaBox(m);
      box.append(h('button', { class: 'x', type: 'button', 'aria-label': 'remover', onClick: (e) => { e.stopPropagation(); S.discardMedia(m.id); st.media = st.media.filter((x) => x !== m); renderPreviews(); } }, icon('close', 16)));
      return box;
    }));
  }
  file.addEventListener('change', async () => {
    for (const f of file.files) {
      const r = await S.importMedia(f);
      if (r.error) err.textContent = r.error; else { st.media.push(r.media); err.textContent = ''; }
    }
    file.value = ''; renderPreviews();
  });
  onLeave(() => { if (!st.submitted) st.media.forEach((m) => S.discardMedia(m.id)); });
  const keys = (obj) => Object.keys(obj), vals = (obj) => Object.values(obj);
  const chShape = chips(vals(D.SHAPES).map((s) => s.split(' /')[0]), 0, (i) => (st.shape = i));
  const chWeather = chips(vals(D.WEATHERS), 0, (i) => (st.weather = i));
  const chCompany = chips(vals(D.COMPANY), 0, (i) => (st.company = i));
  const chId = chips(['Anônimo', nick ? `Como ${nick}` : 'Com apelido (defina no Perfil)'], st.anon ? 0 : 1, (i) => { st.anon = i === 0 || !nick; chId.set(st.anon ? 0 : 1); });

  async function submit() {
    err.textContent = '';
    const c = D.findCity(st.city);
    const [y, mo, d] = fDate.input.value.split('-').map(Number), [hh, mi] = fTime.input.value.split(':').map(Number);
    const when = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mi || 0).getTime();
    if (!st.city.trim()) return void (err.textContent = 'Informe a cidade.');
    if (!y || Number.isNaN(when)) return void (err.textContent = 'Data ou hora inválida.');
    if (when > Date.now() + 60_000) return void (err.textContent = 'A data está no futuro.');
    if (!fDesc.input.value.trim()) return void (err.textContent = 'Descreva o que você viu.');
    const id = S.newId();
    const raw = st.city.trim();
    await S.addReport({
      id, createdAt: Date.now(), city: c ? c.name : raw.split(',')[0].trim(), state: c ? c.state : (raw.includes(',') ? raw.split(',')[1].trim().toUpperCase().slice(0, 2) : ''),
      lat: c ? c.lat : null, lng: c ? c.lng : null, sightingAt: when, durationText: fDur.input.value.trim() || 'não informado',
      description: fDesc.input.value.trim(), shape: keys(D.SHAPES)[st.shape], weather: keys(D.WEATHERS)[st.weather], company: keys(D.COMPANY)[st.company],
      media: st.media, nickname: st.anon ? '' : nick, isExample: false, classification: null, classificationNote: '',
    });
    st.submitted = true;
    toast('Relato enviado');
    location.replace('#/relato/' + id);
  }
  return screen({ title: 'Envie seu relato', subtitle: S.isPersistent() ? 'Fica guardado neste aparelho' : 'Atenção: este navegador não guarda dados (aba privada?)' },
    h('div', { class: 'form' },
      section('Local do avistamento'), fCity, suggest, hint,
      section('Data e horário'), h('div', { class: 'row2' }, fDate, fTime), fDur,
      section('O que você viu?'), fDesc,
      section('Formato'), chShape, section('Como estava o tempo?'), chWeather, section('Você estava…'), chCompany,
      section('Foto ou vídeo (opcional)'),
      card({ onClick: () => file.click() }, h('div', { style: { color: 'var(--accent)', fontWeight: 600 } }, '+ Adicionar foto ou vídeo'),
        h('div', { class: 'muted', style: { marginTop: '2px' } }, 'Fotos e vídeos até 50 MB · uma cópia fica no aparelho')), file, previews,
      section('Identificação'), chId,
      note('Um relato ou uma imagem não prova que o objeto seja extraterrestre. Registrar bem (hora exata, direção, duração, referências) é o que permite investigar.'),
      err, button('Enviar relato', submit)));
}

// ---------------------------------------------------------------- Detalhe do relato
export function detalhe(id) {
  const r0 = S.reportById(id);
  if (!r0) return screen({ title: 'Relato' }, muted('Relato não encontrado.'));
  let level = r0.classification, noteText = r0.classificationNote;
  const save = h('div');
  const mapBox = h('div', { class: 'mapbox small' });
  if (r0.lat != null) onMount(() => { const m = makeMap(mapBox, { center: [r0.lat, r0.lng], zoom: 10, interactive: false }); m.setPoints([{ lat: r0.lat, lng: r0.lng, title: placeOf(r0), count: 1 }]); });
  const levels = h('div', { class: 'stack' });
  const noteField = field({ label: 'Por quê? (o que foi medido ou o que falta)', multiline: true, value: noteText, onInput: (v) => { noteText = v; dirty(); } });
  function dirty() {
    save.replaceChildren((level !== r0.classification || noteText !== r0.classificationNote)
      ? button('Salvar classificação', async () => { await S.updateReport({ ...S.reportById(id), classification: level, classificationNote: noteText }); toast('Classificação salva'); refresh(); }) : '');
  }
  function renderLevels() {
    levels.replaceChildren(...P.LEVEL_KEYS.map((k) => card({ hl: level === k, onClick: () => { level = level === k ? null : k; renderLevels(); dirty(); } }, levelBadge(k, P.EXPL_LEVELS))));
  }
  renderLevels(); dirty();
  const media = r0.media.length ? [section('Foto / vídeo'), h('div', { class: 'stack' }, ...r0.media.map((m) => mediaBox(m, { controls: true }))),
    muted('Um registro não prova origem extraterrestre: prova que algo foi visto e merece explicação.')] : [];
  return screen({ title: placeOf(r0), subtitle: dateText(r0.sightingAt) },
    r0.lat != null ? mapBox : null,
    r0.isExample ? h('div', null, pill('Exemplo fictício embutido no app', 'var(--muted)')) : null,
    card(null, h('div', null, r0.description), spacer(10),
      resultRow('Duração', r0.durationText), resultRow('Formato', D.SHAPES[r0.shape]), resultRow('Tempo', D.WEATHERS[r0.weather]),
      resultRow('Testemunha', D.COMPANY[r0.company]), resultRow('Período', `${periodOf(r0)} (${hourOf(r0)}h)`), resultRow('Relatado por', r0.nickname || 'anônimo')),
    ...media,
    section('Classificação física'), muted('Nunca "alienígena". Um dos quatro rótulos, sempre com o motivo.'), levels, noteField, save,
    note('O que ajudaria a distinguir: horário exato; direção e altura no céu (em graus ou "dois punhos acima do horizonte"); vídeo com algo fixo no quadro (poste, prédio); tráfego aéreo e satélites no horário; condições do céu; outra testemunha independente.'),
    r0.isExample ? null : button('Apagar este relato', async () => { if (confirm('Apagar este relato? As fotos e vídeos anexados também serão apagados deste aparelho.')) { await S.deleteReport(id); history.length > 1 ? history.back() : go('#/'); } }, 'danger'));
}

// ---------------------------------------------------------------- Mapa dos avistamentos
export function mapa() {
  let filter = 0, sel = null;
  const mapBox = h('div', { class: 'mapbox' }), list = h('div', { class: 'stack' }), title = { el: null };
  let map;
  onMount(() => { map = makeMap(mapBox); render(); });
  const fch = chips(['Todos', 'Com foto/vídeo', 'Classificados', 'Sem classificação'], 0, (i) => { filter = i; sel = null; render(); });
  const el = screen({ title: 'Mapa dos avistamentos', subtitle: '' }, fch, mapBox, muted('© OpenStreetMap. Marcadores por cidade, não pelo ponto exato do avistamento.'), list);
  function render() {
    const vis = S.visibleReports().filter((r) => r.lat != null).filter((r) => (filter === 1 ? r.media.length : filter === 2 ? r.classification : filter === 3 ? !r.classification : true));
    const groups = new Map();
    vis.forEach((r) => { const k = placeOf(r); (groups.get(k) || groups.set(k, []).get(k)).push(r); });
    const byCity = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    el.querySelector('.subtitle').textContent = `${vis.length} relatos em ${byCity.length} cidades`;
    if (map) map.setPoints(byCity.map(([k, rs]) => ({ lat: rs[0].lat, lng: rs[0].lng, title: k, count: rs.length, key: k })), (p) => { sel = p.key; render(); });
    list.replaceChildren();
    if (!sel) {
      byCity.forEach(([k, rs]) => list.append(card({ onClick: () => { sel = k; render(); } }, h('div', { class: 'row', style: { alignItems: 'center' } },
        h('div', { style: { flex: 1 } }, h('div', { class: 'ft' }, k), h('div', { class: 'fs' }, `último em ${dateText(Math.max(...rs.map((r) => r.sightingAt)))}`)),
        h('div', { style: { flex: 'none', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' } }, String(rs.length))))));
    } else {
      const rs = groups.get(sel) || [];
      list.append(card({ hl: true, onClick: () => { sel = null; render(); } }, h('div', { class: 'accent', style: { fontWeight: 600 } }, '← Todas as cidades'), h('div', { class: 'ft' }, `${sel} · ${rs.length} relato(s)`)),
        ...rs.map((r) => reportCard(r, () => go('#/relato/' + r.id))));
    }
  }
  return el;
}

// ---------------------------------------------------------------- Estatísticas
export function estatisticas() {
  const rs = S.visibleReports();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
    const y = d.getFullYear(), m = d.getMonth();
    return [d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), rs.filter((r) => { const x = new Date(r.sightingAt); return x.getFullYear() === y && x.getMonth() === m; }).length];
  });
  const top = (fn, n = 6) => [...rs.reduce((m, r) => m.set(fn(r), (m.get(fn(r)) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]).slice(0, n);
  const classified = rs.filter((r) => r.classification).length;
  const byLevel = P.LEVEL_KEYS.map((k) => [`${P.EMOJI[k]} ${P.EXPL_LEVELS[k].short}`, rs.filter((r) => r.classification === k).length]);
  const empty = muted('Sem dados ainda.');
  return screen({ title: 'Estatísticas', subtitle: 'Relatos da comunidade neste aparelho' },
    statRow(stat('Total', String(rs.length)), stat('Com foto', String(rs.filter(hasPhoto).length)), stat('Com vídeo', String(rs.filter(hasVideo).length))),
    section('Classificação física'),
    card(null, h('div', { class: 'row', style: { alignItems: 'center', gap: '16px' } }, h('div', { style: { flex: 'none' } }, donut(classified, rs.length - classified)),
      h('div', null, h('div', { style: { fontSize: '30px', fontWeight: 700 } }, `${rs.length ? Math.round((classified * 100) / rs.length) : 0}%`), h('div', { class: 'muted', style: { margin: 0 } }, `já avaliados (${classified} de ${rs.length})`))),
      spacer(10), hbarList(byLevel)),
    section('Relatos por mês (últimos 6 meses)'), card(null, barChart(months)),
    section('Horários mais comuns'), card(null, barChart(PERIODS.map((p) => [p, rs.filter((r) => periodOf(r) === p).length]), '#8ab4ff')),
    section('Locais com mais relatos'), card(null, rs.length ? hbarList(top(placeOf)) : empty),
    section('Formatos descritos'), card(null, rs.length ? hbarList(top((r) => D.shortShape(r.shape), 8), '#3b82f6') : empty),
    note('"Noite" domina em quase todo registro de avistamentos: é quando luzes se destacam e referências de distância somem. Isso diz mais sobre como enxergamos do que sobre o que há no céu.'));
}

// ---------------------------------------------------------------- Galeria
export function galeria() {
  let kind = 0;
  const grid = h('div', { class: 'gal' });
  const el = screen({ title: 'Galeria', subtitle: '' }, note('Um relato ou uma imagem não comprova que o objeto seja extraterrestre. Cada arquivo aqui é um registro a investigar, não uma conclusão.'),
    chips(['Tudo', 'Fotos', 'Vídeos'], 0, (i) => { kind = i; render(); }), grid);
  function render() {
    const items = S.visibleReports().flatMap((r) => r.media.map((m) => [r, m])).filter(([, m]) => (kind === 1 ? m.kind === 'Foto' : kind === 2 ? m.kind === 'Video' : true));
    el.querySelector('.subtitle').textContent = `${items.length} arquivo(s) enviados com relatos`;
    grid.replaceChildren(...(items.length ? items.map(([r, m]) => h('div', { class: 'cell', onClick: () => go('#/relato/' + r.id) }, mediaBox(m),
      h('div', { class: 'cap' }, placeOf(r), h('small', null, dateText(r.sightingAt)))))
      : [muted('Ainda não há fotos ou vídeos. Eles aparecem aqui quando alguém anexa um arquivo ao enviar um relato.')]));
  }
  render();
  return el;
}
