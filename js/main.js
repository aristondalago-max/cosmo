// COSMO web (PWA): inicialização, roteamento e barra inferior.
import { h, icon } from './util.js';
import { screen, logo, wordmark, starfield } from './ui.js';
import { runCleanups, runMounts } from './router.js';
import { initStore } from './store.js';
import { home, hub, explorar, perfil } from './screens/core.js';
import { drake, fermi, transito } from './screens/ciencia.js';
import { laboratorio, missao, detector, escala, ovni2d } from './screens/fisica.js';
import { relatos, enviar, detalhe, mapa, estatisticas, galeria } from './screens/comunidade.js';
import { investigador, arvore, professor } from './screens/investigacao.js';
import { caixa } from './screens/caixa.js';

const FEATURES = { drake, fermi, transito, laboratorio, missao, detector, escala, ovni2d, investigador, arvore, professor, relatos, enviar, mapa, estatisticas, galeria, caixa };
const TABS = [['#/', 'Início', 'home', 'home'], ['#/m/comunidade', 'Comunidade', 'groups', 'comunidade'], ['#/explorar', 'Explorar', 'explore', 'explorar'], ['#/perfil', 'Perfil', 'person', 'perfil']];
const view = document.getElementById('view'), tabbar = document.getElementById('tabbar');

function match(hash) {
  let m;
  if (hash === '#/' || hash === '#' || hash === '') return ['home', home()];
  if (hash === '#/explorar') return ['explorar', explorar()];
  if (hash === '#/perfil') return ['perfil', perfil()];
  if ((m = hash.match(/^#\/m\/(\w+)$/))) return [m[1] === 'comunidade' ? 'comunidade' : 'home', hub(m[1])];
  if ((m = hash.match(/^#\/f\/(\w+)\/(\w+)$/)) && FEATURES[m[2]]) return [m[1] === 'comunidade' ? 'comunidade' : 'home', FEATURES[m[2]]()];
  if ((m = hash.match(/^#\/relato\/([\w-]+)$/))) return ['comunidade', detalhe(m[1])];
  return ['home', screen({ title: 'Página não encontrada', back: true })];
}

function paintTabs(active) {
  tabbar.replaceChildren(...TABS.map(([href, label, ic, key]) => h('a', { class: 'tab' + (key === active ? ' on' : ''), href }, icon(ic, 24), label)));
}

function render() {
  runCleanups();
  let tab, el;
  try { [tab, el] = match(location.hash); } catch (e) {
    console.error(e);
    tab = 'home'; el = screen({ title: 'Algo deu errado', subtitle: 'Volte ao início e tente de novo.' });
  }
  view.replaceChildren(el);
  view.scrollTop = 0;
  paintTabs(tab);
  runMounts();
}

function splash() {
  if (sessionStorage.getItem('cosmo.splash')) return;
  try { sessionStorage.setItem('cosmo.splash', '1'); } catch { /* ok */ }
  const s = h('div', { class: 'splash' }, logo(180), h('div', { class: 'wordmark big-wm' }, 'COSMO'), h('div', { class: 'tagline' }, 'Explore o universo, questione o impossível'));
  document.body.append(s);
  setTimeout(() => { s.classList.add('out'); setTimeout(() => s.remove(), 700); }, 1700);
}

(async function boot() {
  document.body.prepend(starfield());
  await initStore();
  window.addEventListener('hashchange', render);
  window.addEventListener('cosmo:refresh', render);
  render();
  splash();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
