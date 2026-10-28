# COSMO web (PWA)

Versão web instalável do COSMO. Funciona em iPhone (Safari), Android (Chrome) e computador, sem App Store, sem conta
Apple e sem compilar nada. Os relatos, fotos e respostas ficam no aparelho (IndexedDB e localStorage); a única
conexão é para baixar os azulejos do mapa (OpenStreetMap), que depois ficam guardados.

## Rodar no computador (desenvolvimento)

```powershell
python C:\TC-LEGION\site-ovni\serve-cosmo-web.py 8123
```

Abra http://localhost:8123/. O servidor não deixa o navegador guardar cache, então toda edição aparece ao recarregar.
Não existe etapa de build: são arquivos estáticos (HTML, CSS, JavaScript em módulos).

## Instalar no celular

1. Publique a pasta `cosmo-web/` em qualquer hospedagem HTTPS estática (ver abaixo).
2. iPhone: abra o endereço no **Safari**, toque em Compartilhar e em **Adicionar à Tela de Início**.
3. Android: abra no **Chrome**, menu ⋮ e **Instalar app**.

HTTPS é obrigatório fora do `localhost`: sem ele o navegador não registra o service worker (nada de modo offline).

## Publicar uma versão nova

- Edite os arquivos e publique a pasta inteira de novo. Com internet o app sempre baixa a versão mais recente.
- Se **adicionar, remover ou renomear arquivos**, atualize a lista `APP_FILES` em `sw.js` e aumente `VERSION`.

## Estrutura

```
index.html, manifest.webmanifest, sw.js
css/app.css                 design system Dark Space v1.0
js/main.js                  inicialização, rotas (#/...), barra inferior
js/ui.js, util.js, charts.js  componentes, DOM seguro, gráficos em canvas
js/physics.js, fmt.js       física e formatação em pt-BR (portadas do app Android)
js/store.js, data.js        IndexedDB, preferências, cidades offline, relatos de exemplo
js/screens/                 core (início, hubs, perfil), ciencia, fisica, comunidade, investigacao, caixa
fonts/ vendor/leaflet/ icons/
```

## Diferenças em relação ao APK Android 1.0

- Rótulos físicos separados em dois vocabulários, como no descritivo: propulsão (existente, possível, especulativa,
  sem mecanismo) e explicações (compatível, dados insuficientes, tecnologia extraordinária, contradiz a física).
  O APK 1.0 usa o vocabulário de propulsão também nas explicações (amarelo aparece como "Fisicamente possível" em vez
  de "Dados insuficientes").
- Data e hora do relato usam os seletores nativos do celular.
- Voz do piloto e sons d'A CAIXA vêm do navegador (Web Audio e SpeechSynthesis); a voz depende do que o aparelho tem em pt-BR.
- Conteúdos ainda provisórios, como no APK: textos de Drake e Fermi, 6 etapas da aula, 3 perguntas de journaling.
