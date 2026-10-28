// Telas de navegação: Início (Menu Principal), hub de módulo, Explorar e Perfil.
import { h } from '../util.js';
import { screen, card, section, note, muted, button, toggle, field, logo, wordmark, moduleTile, featureRow, spacer } from '../ui.js';
import { MODULES, moduleById } from '../catalog.js';
import { go, refresh } from '../router.js';
import * as S from '../store.js';
import { reportCard } from './comunidade.js';

export function home() {
  return h('div', { class: 'screen' },
    h('div', { class: 'homehead' }, logo(44), wordmark(true)),
    h('h1', { class: 'title' }, 'Menu Principal'),
    h('p', { class: 'subtitle' }, 'Explore os módulos de ciência e comunidade'),
    h('div', { class: 'body' },
      h('div', { class: 'tiles' }, ...MODULES.map((m) => moduleTile(m, () => go('#/m/' + m.id)))),
      card(null, h('div', { style: { fontWeight: 600 } }, 'Você já viu algo que não conseguiu explicar?'),
        muted('O COSMO reúne ciência, física, investigação e relatos da comunidade para olhar o céu com curiosidade e rigor. Um relato ou uma imagem não prova que um objeto seja extraterrestre.'))));
}

export function hub(moduleId) {
  const m = moduleById(moduleId);
  if (!m) return screen({ title: 'Módulo não encontrado' });
  return screen({ title: m.title, subtitle: m.subtitle }, ...m.features.map((f) => featureRow(f, () => go(`#/f/${m.id}/${f.id}`))));
}

export function explorar() {
  return screen({ title: 'Explorar', subtitle: 'Tudo o que o COSMO oferece', back: false },
    ...MODULES.flatMap((m) => [section(m.title), ...m.features.map((f) => featureRow(f, () => go(`#/f/${m.id}/${f.id}`)))]));
}

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function perfil() {
  const nick = S.getPref('nickname', '');
  const fNick = field({ label: 'Apelido (opcional)', value: nick, placeholder: 'Ex.: observador_costeiro', onInput: () => {} });
  const act = S.getPref('caixaAct', 0);
  const mine = S.ownReports();
  return screen({ title: 'Perfil', subtitle: nick || 'Observador anônimo', back: false },
    fNick, button('Salvar apelido', () => { S.setPref('nickname', fNick.input.value.trim()); refresh(); }, 'ghost'),
    muted('Relatos podem sair como anônimos mesmo com apelido definido. Nada é enviado para fora do aparelho.'),
    section(`Meus relatos (${mine.length})`),
    ...(mine.length ? mine.map((r) => reportCard(r, () => go('#/relato/' + r.id))) : [card(null, muted('Nenhum relato seu ainda. Use Comunidade → Envie seu relato.'))]),
    section('Preferências'),
    card(null, toggle('Mostrar relatos de exemplo do app', S.getPref('showExamples', true), (v) => S.setPref('showExamples', v))),
    card(null, h('div', { style: { fontWeight: 600 } }, 'A CAIXA — progresso'),
      muted(act === 0 ? 'A jornada ainda não começou.' : act >= 6 ? 'Jornada concluída. Reflexão disponível.' : `Ato ${act} de 5.`)),
    standalone() ? null : card(null, h('div', { style: { fontWeight: 600 } }, 'Instalar no celular'),
      muted('iPhone (Safari): toque em Compartilhar e depois em "Adicionar à Tela de Início". Android (Chrome): menu ⋮ e depois "Instalar app". Depois de instalado, abre em tela cheia e funciona sem internet (exceto os mapas novos).')),
    card(null, h('div', { style: { fontWeight: 600 } }, 'Sobre o COSMO'),
      muted('Projeto educativo sobre o que vemos no céu e como a ciência investiga o desconhecido. Versão web 1.0. Os relatos e as respostas ficam só neste aparelho' + (S.isPersistent() ? '.' : ' (este navegador não está guardando dados: aba privada?).') + ' Mapa © colaboradores do OpenStreetMap. Fonte Poppins (OFL). Um relato ou uma imagem não prova que o objeto seja extraterrestre.')));
}
