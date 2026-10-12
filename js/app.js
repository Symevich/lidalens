/* ============================================================
   app.js — LidaLens (SPA)
   Экраны: галоўная (#/), аб'ект (#/object/sights/<id>),
   «Ліда ў аб'ектыве» (#/lens), карта (#/map).
   Чысты JS без фрэймворкаў. Усе надпісы — праз I18N.t().
   ============================================================ */

(function () {
  'use strict';

  const SOURCES = ['sights'];
  const META = { sights: { titleKey: 'sightsTitle' } };

  /* ── Агульны стан ── */
  let _map          = null;   /* апошняя створаная карта Leaflet */
  const _maps       = [];     /* усе жывыя карты на бягучым экране */
  const _cache      = Object.create(null);
  let _route        = null;
  let _homeScroll   = 0;
  let _homeItems    = [];

  /* стан лінзы */
  let _lensStream = null;
  let _lensBusy   = false;

  /* ============================================================
     ІКОНКІ (усе — інлайн SVG, адзін контурны стыль)
     ============================================================ */
  const ICONS = {
    camera: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l1-1.6A1.5 1.5 0 0 1 9 3.7h6a1.5 1.5 0 0 1 1.3.7l1 1.6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/><circle cx="12" cy="12.3" r="3.4"/></svg>`,
    building: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V8l4-3v16"/><path d="M8 21V10l8-4v15"/><path d="M16 21V13l4 2v6"/><path d="M2 21h20"/></svg>`,
    map: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.5-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.5 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/></svg>`,
    back: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
    share: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="17.5" cy="5" r="2.6"/><circle cx="6.5" cy="12" r="2.6"/><circle cx="17.5" cy="19" r="2.6"/><line x1="8.9" y1="10.7" x2="15.1" y2="6.3"/><line x1="8.9" y1="13.3" x2="15.1" y2="17.7"/></svg>`,
    close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`,
    link: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M10.6 13.4a4 4 0 0 0 5.6 0l2.6-2.6a4 4 0 1 0-5.6-5.6l-1 1"/><path d="M13.4 10.6a4 4 0 0 0-5.6 0l-2.6 2.6a4 4 0 1 0 5.6 5.6l1-1"/></svg>`,
    play: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`,
    locate: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>`,
    upload: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l5-4 4 3 3-2.5 4 3.5"/></svg>`,
    prev: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 5.5-6.5 6.5 6.5 6.5"/></svg>`,
    next: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>`,
    down: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5.5 9.5 6.5 6.5 6.5-6.5"/></svg>`,
  };

  /* ============================================================
     ХЕЛПЕРЫ
     ============================================================ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* data-файлы запісваюць шляхі як "../assets/…" — у SPA з кораня трэба "./assets/…" */
  function fixPath(p) { return p ? p.replace(/^\.\.\//, './') : ''; }

  function firstGlyph(text) {
    const found = String(text || '').match(/[\p{L}\p{N}]/u);
    return found ? found[0].toUpperCase() : '?';
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  let _toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('toast--visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2600);
  }

  function scrollToTop() {
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
  }

  /* ============================================================
     МАРШРУТЫ
     ============================================================ */
  function parseRoute() {
    const hash = location.hash.replace(/^#\/?/, '').trim();
    if (!hash) return { view: 'home' };
    const parts = hash.split('/');
    if (parts[0] === 'lens') return { view: 'lens' };
    if (parts[0] === 'map')  return { view: 'map' };
    if (parts[0] === 'object' && SOURCES.includes(parts[1]) && parts[2])
      return { view: 'object', id: decodeURIComponent(parts[2]) };
    if (SOURCES.includes(parts[0])) return { view: 'home' };   /* старыя #/sights */
    return { view: 'home' };
  }

  function navigate(route) {
    /* запомнім пазіцыю скролу галоўнай, каб вярнуць яе пры вяртанні */
    if (_route && _route.view === 'home' && route.view !== 'home') {
      _homeScroll = window.scrollY || window.pageYOffset || 0;
    }

    killMap(); killLens(); closeSheet(); closeShareModal();
    document.body.classList.remove('nav-hidden'); _chromeHidden = false;
    const app = document.getElementById('app');
    if (!app) return;

    updateShell(route);

    const draw = () => {
      app.innerHTML = '';
      const page = document.createElement('div');
      page.className = 'page__progress';
      app.appendChild(page);

      if      (route.view === 'object') renderObject(app, page, route.id);
      else if (route.view === 'lens')   renderLens(app, page);
      else if (route.view === 'map')    renderMapScreen(app, page);
      else                              renderHome(app, page);
    };

    if (document.startViewTransition) document.startViewTransition(draw);
    else draw();

    /* скрол: галоўная — вярнуць пазіцыю, астатнія — уверх */
    requestAnimationFrame(() => {
      if (route.view === 'home' && _route && _route.view !== 'home' && _homeScroll) {
        const scroller = document.scrollingElement || document.documentElement;
        if (scroller) scroller.scrollTop = _homeScroll;
      } else {
        scrollToTop();
      }
      _route = route;
    });
  }

  /* ============================================================
     КАРКАС: верхняя панэль + ніжняя навігацыя
     ============================================================ */
  let _el = {};

  function buildShell() {
    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.innerHTML = `
      <div class="topbar__inner">
        <a class="topbar__back" id="topBack" href="#/" hidden>${ICONS.back}<span>${esc(I18N.t('back'))}</span></a>
        <a class="topbar__brand" id="topBrand" href="#/">${esc(I18N.t('brand'))}</a>
        <nav class="topbar__nav" aria-label="${esc(I18N.t('navSights'))}">
          <a class="topbar__navlink" id="navSights" href="#/">${esc(I18N.t('navSights'))}</a>
          <a class="topbar__navlink" id="navLens" href="#/lens">${esc(I18N.t('navLens'))}</a>
          <a class="topbar__navlink" id="navMap" href="#/map">${esc(I18N.t('navMap'))}</a>
        </nav>
        <div class="topbar__actions" id="topActions"></div>
      </div>`;
    document.body.prepend(topbar);

    const bottomnav = document.createElement('nav');
    bottomnav.className = 'bottomnav';
    bottomnav.setAttribute('aria-label', esc(I18N.t('navSights')));
    bottomnav.innerHTML = `
      <a class="bottomnav__item" id="bnSights" href="#/">${ICONS.building}<span class="bottomnav__label">${esc(I18N.t('navSights'))}</span></a>
      <a class="bottomnav__item bottomnav__center" id="bnLens" href="#/lens">
        <span class="bottomnav__fab">${ICONS.camera}</span>
        <span class="bottomnav__label">${esc(I18N.t('lens'))}</span>
      </a>
      <a class="bottomnav__item" id="bnMap" href="#/map">${ICONS.map}<span class="bottomnav__label">${esc(I18N.t('navMap'))}</span></a>`;
    document.body.appendChild(bottomnav);

    /* акно «Падзяліцца» будуем адзін раз */
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'icon-btn';
    share.id = 'shareButton';
    share.innerHTML = ICONS.share;
    share.setAttribute('aria-haspopup', 'dialog');
    share.setAttribute('aria-expanded', 'false');
    share.setAttribute('aria-label', I18N.t('shareAria'));
    share.setAttribute('title', I18N.t('share'));
    share.addEventListener('click', () => openShareModal(share));
    _shareButton = share;

    const actions = document.getElementById('topActions');
    actions.appendChild(share);
    actions.appendChild(I18N.renderToggle());

    _el = {
      topbar,
      back:   document.getElementById('topBack'),
      brand:  document.getElementById('topBrand'),
      navSights: document.getElementById('navSights'),
      navLens:   document.getElementById('navLens'),
      navMap:    document.getElementById('navMap'),
      bottomnav,
      bnSights: document.getElementById('bnSights'),
      bnLens:   document.getElementById('bnLens'),
      bnMap:    document.getElementById('bnMap'),
    };
  }

  function updateShell(route) {
    if (!_el.topbar) return;

    const isHome = route.view === 'home';
    _el.back.hidden  = isHome;
    _el.brand.hidden = !isHome;

    /* спасылкі навігацыі */
    const activeNav = isHome ? _el.navSights : route.view === 'lens' ? _el.navLens : route.view === 'map' ? _el.navMap : null;
    [_el.navSights, _el.navLens, _el.navMap].forEach(a => a.classList.remove('topbar__navlink--active'));
    if (activeNav) activeNav.classList.add('topbar__navlink--active');

    [_el.bnSights, _el.bnLens, _el.bnMap].forEach(a => a.classList.remove('bottomnav__item--active'));
    if (isHome) _el.bnSights.classList.add('bottomnav__item--active');
    else if (route.view === 'lens') _el.bnLens.classList.add('bottomnav__item--active');
    else if (route.view === 'map')  _el.bnMap.classList.add('bottomnav__item--active');

    /* ніжнюю навігацыю хаваем у рэжыме камеры */
    _el.bottomnav.hidden = route.view === 'lens';
    document.body.classList.toggle('has-bottomnav', !_el.bottomnav.hidden);

    /* карта займае экран цалкам — скрол не патрэбны */
    document.body.classList.toggle('route-map', route.view === 'map');

    /* «Падзяліцца» — толькі на старонцы аб'екта */
    if (_shareButton) _shareButton.hidden = route.view !== 'object';

    /* празрыстая панэль над hero */
    _el.topbar.classList.remove('topbar--over-hero');
    if (route.view !== 'object') { document.title = `${I18N.t('sightsTitle')} ${I18N.t('pageTitle')}`; }
  }

  /* ============================================================
     ДАНЫЯ
     ============================================================ */
  async function loadData(source) {
    const file = I18N.dataFile(source);
    const key  = `${source}/${file}`;
    if (_cache[key]) return _cache[key];
    const res = await fetch(`./data/${file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _cache[key] = data;
    return data;
  }

  /* ============================================================
     ГАЛОЎНАЯ
     ============================================================ */
  function renderHome(app, page) {
    document.title = `${I18N.t('sightsTitle')} ${I18N.t('pageTitle')}`;
    document.documentElement.lang = I18N.get();

    page.className = 'page page--home page__progress';
    page.innerHTML = `
      <header class="home-hero">
        <div class="container">
          <span class="eyebrow">${esc(I18N.t('homeEyebrow'))}</span>
          <h1 class="home-hero__title">${esc(I18N.t('homeTitle'))}</h1>
        </div>
        <div class="ornament ornament--bleed" aria-hidden="true"></div>
      </header>

      <div class="container">
        <a class="lens-cta" href="#/lens">
          <span class="lens-cta__frame" aria-hidden="true"><i></i></span>
          <span class="lens-cta__badge">${ICONS.camera}</span>
          <span class="lens-cta__body">
            <span class="lens-cta__title">${esc(I18N.t('lens'))}</span>
            <span class="lens-cta__desc">${esc(I18N.t('lensTeaserDesc'))}</span>
          </span>
          <span class="lens-cta__arrow" aria-hidden="true">→</span>
        </a>

        <div id="status" class="skeleton skeleton--pulse" aria-hidden="true">
          <div class="skeleton__card"><div class="skeleton__media"></div><div class="skeleton__line"></div><div class="skeleton__line skeleton__line--short"></div></div>
        </div>

        <section id="sightList" class="sight-list" aria-label="${esc(I18N.t('sightsTitle'))}"></section>
      </div>

      <section class="home-map container">
        <h2 class="section-title">${esc(I18N.t('homeMapTitle'))}</h2>
        <div class="home-map__frame" id="homeMap"></div>
        <a class="home-map__cta" href="#/map">${ICONS.map}<span>${esc(I18N.t('openBigMap'))}</span></a>
      </section>

      <footer class="page-footer">
        <div class="ornament ornament--bleed" aria-hidden="true"></div>
      </footer>
    `;

    loadData('sights').then(items => {
      _homeItems = items.filter(i => i.id && i.title);
      renderSightList();
      initHomeMap('homeMap', _homeItems);
    }).catch(() => {
      const st = document.getElementById('status');
      if (st) {
        st.className = 'status status--error';
        st.innerHTML = `${esc(I18N.t('errorLoad'))}<br><button class="status__retry" type="button">${esc(I18N.t('retry'))}</button>`;
        st.querySelector('.status__retry').addEventListener('click', () => navigate(parseRoute()));
      }
    });
  }

  /* Парадак: першая — «візітоўка» (Лідскі замак), астатнія — як у файле */
  function orderedItems(items) {
    const castleIdx = items.findIndex(i => i.id === 'lidski-zamak');
    if (castleIdx <= 0) return items.slice();
    const rest = items.slice();
    const [castle] = rest.splice(castleIdx, 1);
    return [castle, ...rest];
  }

  function renderSightList() {
    const list   = document.getElementById('sightList');
    const status = document.getElementById('status');
    if (!list) return;

    const all = orderedItems(_homeItems);

    if (status) status.style.display = 'none';
    list.innerHTML = '';
    if (!all.length) return;

    /* нумары 01..08 па парадку паказу ва ўсім спісе */
    const numberOf = (id) => pad2(all.findIndex(i => i.id === id) + 1);

    const featured = all[0];
    list.appendChild(buildFeatureCard(featured, numberOf(featured.id)));

    const grid = document.createElement('div');
    grid.className = 'sight-grid';
    all.slice(1).forEach(item => grid.appendChild(buildSightCard(item, numberOf(item.id))));
    list.appendChild(grid);
  }

  function itemDesc(item) {
    return item.short || [item.typeLabel, item.period].filter(Boolean).join(' · ');
  }

  function buildFeatureCard(item, num) {
    const a = document.createElement('a');
    a.className = 'feature-card';
    a.href = `#/object/sights/${encodeURIComponent(item.id)}`;

    const media = item.image
      ? `<img class="feature-card__img" src="${esc(fixPath(item.image))}" alt="${esc(item.title)}" fetchpriority="high" decoding="async">`
      : `<div class="feature-card__monogram" aria-hidden="true">${esc(firstGlyph(item.title))}</div>`;

    a.innerHTML = `
      ${media}
      <span class="feature-card__scrim" aria-hidden="true"></span>
      <span class="feature-card__badge">${esc(I18N.t('featuredBadge'))}</span>
      <span class="feature-card__caption">
        <span class="feature-card__title">${esc(item.title)}</span>
        <span class="feature-card__desc">${esc(itemDesc(item))}</span>
      </span>`;
    return a;
  }

  function buildSightCard(item, num) {
    const a = document.createElement('a');
    a.className = 'sight-card';
    a.href = `#/object/sights/${encodeURIComponent(item.id)}`;

    const media = item.image
      ? `<div class="sight-card__media"><img class="sight-card__img" src="${esc(fixPath(item.image))}" alt="${esc(item.title)}" loading="lazy" decoding="async"><span class="sight-card__num">${num}</span></div>`
      : `<div class="sight-card__media"><div class="sight-card__monogram" aria-hidden="true">${esc(firstGlyph(item.title))}</div><span class="sight-card__num">${num}</span></div>`;

    a.innerHTML = `
      ${media}
      <div class="sight-card__body">
        <h2 class="sight-card__title">${esc(item.title)}</h2>
        <p class="sight-card__desc">${esc(itemDesc(item))}</p>
      </div>`;
    return a;
  }

  /* ============================================================
     СТАРОНКА АБ'ЕКТА
     ============================================================ */
  async function renderObject(app, page, id) {
    document.documentElement.lang = I18N.get();
    page.className = 'page page--object page__progress';

    let items = [], obj = null;
    try {
      items = await loadData('sights');
      obj = items.find(i => i.id === id) || null;
    } catch (e) {
      showError(page, I18N.t('errorObj'));
      return;
    }
    if (!obj) { showError(page, I18N.t('errorNotFound')); return; }

    document.title = `${obj.title} ${I18N.t('pageTitle')}`;
    populateObject(page, obj);
  }

  function populateObject(page, obj) {
    page.innerHTML = '';

    /* ── 1. Hero-фота ── */
    const hero = document.createElement('div');
    hero.className = 'hero';
    const shots = [obj.image, ...(Array.isArray(obj.gallery) ? obj.gallery : [])].filter(Boolean);
    const heroSrc = shots[0];
    hero.innerHTML = `
      <div class="hero__media" id="heroMedia">
        ${heroSrc
          ? `<img class="hero__img" src="${esc(fixPath(heroSrc))}" alt="${esc(obj.title)}" fetchpriority="high" decoding="async">`
          : `<div class="hero__monogram" aria-hidden="true">${esc(firstGlyph(obj.title))}</div>`}
        <span class="hero__scrim" aria-hidden="true"></span>
      </div>
      <div class="hero__caption">
        <div class="hero__inner">
          <h1 class="hero__title">${esc(obj.title)}</h1>
          ${(obj.typeLabel || obj.period) ? `<span class="hero__chip">${esc([obj.typeLabel, obj.period].filter(Boolean).join(' · '))}</span>` : ''}
        </div>
      </div>`;
    page.appendChild(hero);

    /* ── 2. Агульны двухслупковы лейаўт ── */
    const layout = document.createElement('div');
    layout.className = 'object-layout';
    const main = document.createElement('div');
    main.className = 'object-main';
    const aside = document.createElement('div');
    aside.className = 'object-aside';

    /* ── 3. Прыліпная панэль аўдыягіда ── */
    const player = buildAudioPlayer(obj);
    main.appendChild(player);

    /* ── 4. Хуткія факты ── */
    const facts = [obj.typeLabel, obj.period, obj.address].filter(Boolean);
    if (facts.length) {
      const box = document.createElement('div');
      box.className = 'facts';
      facts.forEach(f => { const s = document.createElement('span'); s.className = 'fact-chip'; s.textContent = f; box.appendChild(s); });
      main.appendChild(box);
    }

    /* ── 5. Тэкст артыкула ── */
    const article = document.createElement('div');
    article.className = 'article article--dropcap';
    article.innerHTML = obj.description || I18N.t('noDesc');
    main.appendChild(article);

    /* ── 6. Галерэя ── */
    if (shots.length > 1) main.appendChild(buildGallery(shots, obj.title));

    /* ── 7. Квіз ── */
    const quiz = buildQuiz(obj, 'sights');
    if (quiz) main.appendChild(quiz);

    /* ── Панэль справа: мінікарта + выбар карты ── */
    if (obj.lat && obj.lng) {
      const wrap = document.createElement('div');
      wrap.className = 'mini-map';
      const frame = document.createElement('div');
      frame.className = 'mini-map__frame';
      frame.id = 'miniMap';
      wrap.appendChild(frame);
      wrap.appendChild(buildMapChooser(obj, 'mini-map__link'));
      aside.appendChild(wrap);
    }

    layout.append(main, aside);
    page.appendChild(layout);

    /* ажыўляем плэер і карту пасля ўстаўкі ў DOM */
    activateAudioPlayer(player, obj);
    if (obj.lat && obj.lng) initHomeMap('miniMap', [obj], 16, false);

    /* празрыстая панэль над hero, цвёрдая пасля скролу */
    observeHero();
  }

  /* ── Плэер аўдыягіда (уласныя кантролі вакол <audio>) ── */
  function buildAudioPlayer(obj) {
    const player = document.createElement('div');
    player.className = 'audio-player';
    if (!obj.audio) { player.hidden = true; player.dataset.noAudio = '1'; return player; }

    player.innerHTML = `
      <div class="audio-player__row">
        <button type="button" class="audio-player__play" id="apPlay" aria-label="${esc(I18N.t('audioPlay'))}">${ICONS.play}</button>
        <span class="audio-wave" aria-hidden="true"><span class="audio-wave__bar"></span><span class="audio-wave__bar"></span><span class="audio-wave__bar"></span></span>
        <div class="audio-player__main">
          <div class="audio-player__progress" id="apProgress" role="slider" tabindex="0"
               aria-label="${esc(I18N.t('audioPlay'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="audio-player__track"><div class="audio-player__fill" id="apFill"></div></div>
          </div>
          <div class="audio-player__time" id="apTime">0:00 / 0:00</div>
        </div>
      </div>
      <div class="audio-player__tools">
        <button type="button" class="audio-player__skip" id="apBack" aria-label="${esc(I18N.t('audioBack15'))}">−15</button>
        <button type="button" class="audio-player__skip" id="apFwd"  aria-label="${esc(I18N.t('audioFwd15'))}">+15</button>
        <div class="audio-player__speed" role="group" aria-label="${esc(I18N.t('audioSpeed'))}">
          ${[1, 1.25, 1.5].map(s => `<button type="button" class="audio-player__speed-btn" data-speed="${s}" aria-pressed="${s === 1}">${s}×</button>`).join('')}
        </div>
      </div>
      <audio id="apAudio" preload="metadata" hidden>
        <source type="audio/mpeg" src="${esc(fixPath(obj.audio))}">
        ${esc(I18N.t('audioNotSupported'))}
      </audio>`;
    return player;
  }

  function activateAudioPlayer(player, obj) {
    if (player.dataset.noAudio) return;
    const audio = player.querySelector('#apAudio');
    const play  = player.querySelector('#apPlay');
    const fill  = player.querySelector('#apFill');
    const time  = player.querySelector('#apTime');
    const prog  = player.querySelector('#apProgress');

    const fmt = (s) => { if (!isFinite(s)) s = 0; const m = Math.floor(s / 60); const x = Math.floor(s % 60); return `${m}:${pad2(x)}`; };
    const setIcon = (playing) => { play.innerHTML = playing ? ICONS.pause : ICONS.play; play.setAttribute('aria-label', I18N.t(playing ? 'audioPause' : 'audioPlay')); };

    play.addEventListener('click', () => { audio.paused ? audio.play() : audio.pause(); });
    player.querySelector('#apBack').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
    player.querySelector('#apFwd').addEventListener('click',  () => { audio.currentTime = Math.min(audio.duration || 1e9, audio.currentTime + 15); });

    const seek = (clientX) => {
      const rect = prog.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      if (audio.duration) audio.currentTime = ratio * audio.duration;
    };
    prog.addEventListener('click', (e) => seek(e.clientX));
    prog.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime + (e.key === 'ArrowRight' ? 5 : -5));
    });

    player.querySelectorAll('.audio-player__speed-btn').forEach(b => {
      b.addEventListener('click', () => {
        audio.playbackRate = Number(b.dataset.speed);
        player.querySelectorAll('.audio-player__speed-btn').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      });
    });

    audio.addEventListener('loadedmetadata', () => { time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`; });
    audio.addEventListener('timeupdate', () => {
      const d = audio.duration || 0;
      const pct = d ? (audio.currentTime / d) * 100 : 0;
      fill.style.width = pct + '%';
      prog.setAttribute('aria-valuenow', String(Math.round(pct)));
      time.textContent = `${fmt(audio.currentTime)} / ${fmt(d)}`;
    });
    audio.addEventListener('play',  () => { player.classList.add('audio-player--playing');  setIcon(true); });
    audio.addEventListener('pause', () => { player.classList.remove('audio-player--playing'); setIcon(false); });
    audio.addEventListener('ended', () => { player.classList.remove('audio-player--playing'); setIcon(false); });
  }

  /* ── Галерэя (scroll-snap, стрэлкі, кропкі, лічыльнік) ── */
  function buildGallery(paths, title) {
    const total = paths.length;
    const wrap = document.createElement('div');
    wrap.className = 'gallery';

    const viewport = document.createElement('div');
    viewport.className = 'gallery__viewport';

    const track = document.createElement('div');
    track.className = 'gallery__track';
    track.tabIndex = 0;
    track.setAttribute('role', 'group');
    track.setAttribute('aria-label', I18N.t('galleryLabel', { total }));

    paths.forEach((path, i) => {
      const img = document.createElement('img');
      img.className = 'gallery__image';
      img.src = fixPath(path);
      img.alt = I18N.t('galleryAlt', { title, n: i + 1, total });
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      track.appendChild(img);
    });

    const counter = document.createElement('span');
    counter.className = 'gallery__counter';

    const dots = document.createElement('div');
    dots.className = 'gallery__dots';
    let shown = -1;

    const goTo = (i) => { track.scrollLeft = track.clientWidth * Math.max(0, Math.min(total - 1, i)); };

    const dotButtons = paths.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery__dot';
      dot.setAttribute('aria-label', I18N.t('galleryGoTo', { n: i + 1, total }));
      dot.addEventListener('click', () => goTo(i));
      dots.appendChild(dot);
      return dot;
    });

    const makeArrow = (kind, icon, labelKey) => {
      const arrow = document.createElement('button');
      arrow.type = 'button';
      arrow.className = `gallery__arrow gallery__arrow--${kind}`;
      arrow.innerHTML = icon;
      arrow.setAttribute('aria-label', I18N.t(labelKey));
      return arrow;
    };
    const prev = makeArrow('prev', ICONS.prev, 'galleryPrev');
    const next = makeArrow('next', ICONS.next, 'galleryNext');
    prev.addEventListener('click', () => goTo(shown - 1));
    next.addEventListener('click', () => goTo(shown + 1));

    const sync = () => {
      const width = track.clientWidth || 1;
      const index = Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / width)));
      if (index === shown) return;
      shown = index;
      counter.textContent = `${index + 1} / ${total}`;
      dotButtons.forEach((dot, i) => i === index ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current'));
      prev.disabled = index === 0;
      next.disabled = index === total - 1;
    };

    track.addEventListener('scroll', sync, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      goTo(shown + (e.key === 'ArrowRight' ? 1 : -1));
    });

    viewport.append(track, prev, next, counter);
    wrap.append(viewport, dots);
    sync();
    return wrap;
  }

  /* ── Квіз ── */
  function buildQuiz(obj, source) {
    const quiz = obj.quiz;
    if (!quiz || !Array.isArray(quiz.options) || !quiz.options.length) return null;
    const correctIndex = Number.isInteger(quiz.correctIndex) ? quiz.correctIndex : 0;

    const block = document.createElement('details');
    block.className = 'quiz';
    const summary = document.createElement('summary');
    summary.className = 'quiz__summary';
    const title = document.createElement('h2');
    title.className = 'quiz__title';
    title.textContent = I18N.t('quizTitle');
    const chevron = document.createElement('span');
    chevron.className = 'quiz__chevron';
    chevron.innerHTML = ICONS.down;
    summary.append(title, chevron);

    const body = document.createElement('div');
    body.className = 'quiz__body';
    const question = document.createElement('p');
    question.className = 'quiz__question';
    question.textContent = quiz.question || '';
    const options = document.createElement('div');
    options.className = 'quiz__options';
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', quiz.question || I18N.t('quizTitle'));
    const feedback = document.createElement('p');
    feedback.className = 'quiz__feedback';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    const explanation = document.createElement('p');
    explanation.className = 'quiz__explanation';
    explanation.hidden = true;
    if (quiz.explanation) explanation.textContent = quiz.explanation;

    const buttons = quiz.options.map((option, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz__option';
      btn.textContent = option;
      btn.addEventListener('click', () => answer(index, true));
      options.appendChild(btn);
      return btn;
    });

    function answer(index, userAction) {
      const isCorrect = index === correctIndex;
      buttons.forEach((btn, i) => {
        btn.disabled = true;
        btn.classList.toggle('quiz__option--correct', i === correctIndex);
        btn.classList.toggle('quiz__option--wrong', i === index && !isCorrect);
        if (i === index) btn.setAttribute('aria-current', 'true');
      });
      feedback.classList.toggle('quiz__feedback--correct', isCorrect);
      feedback.classList.toggle('quiz__feedback--wrong', !isCorrect);
      feedback.textContent = isCorrect ? I18N.t('quizCorrect') : I18N.t('quizWrong') + ' ' + I18N.t('quizAnswer', { answer: quiz.options[correctIndex] });
      if (quiz.explanation) explanation.hidden = false;
      if (isCorrect && userAction) quizMarkDone(source, obj.id);
    }

    if (quizIsDone(source, obj.id)) answer(correctIndex, false);

    body.append(question, options, feedback, explanation);
    block.append(summary, body);
    return block;
  }

  /* ── Празрыстая панэль над hero ── */
  function observeHero() {
    const hero = document.getElementById('heroMedia');
    if (!hero || !_el.topbar) return;
    _el.topbar.classList.add('topbar--over-hero');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => _el.topbar.classList.toggle('topbar--over-hero', e.isIntersecting));
    }, { rootMargin: '-64px 0px 0px 0px', threshold: 0 });
    io.observe(hero);
  }

  /* ── Аўтахаванне шапкі пры пракрутцы ўніз (старонка аб'екта) ── */
  let _lastScrollY = 0;
  let _chromeHidden = false;
  function initScrollChrome() {
    window.addEventListener('scroll', () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const onObject = !!(_route && _route.view === 'object');
      const hide = onObject && y > _lastScrollY && y > 80;
      const show = !onObject || y < _lastScrollY || y <= 80;
      if (hide && !_chromeHidden) { document.body.classList.add('nav-hidden'); _chromeHidden = true; }
      else if (show && _chromeHidden) { document.body.classList.remove('nav-hidden'); _chromeHidden = false; }
      _lastScrollY = y;
    }, { passive: true });
  }

  /* ============================================================
     ЛІНЗА — рэжым камеры
     ============================================================ */
  const LENS_API = '/api/lens/recognize';

  function killLens() {
    if (_lensStream) { _lensStream.getTracks().forEach(t => t.stop()); _lensStream = null; }
    _lensBusy = false;
  }

  const lensEl = (id) => document.getElementById(id);

  function lensState(state) {
    const root = lensEl('lens');
    if (root) root.dataset.state = state;
  }
  function lensError(text) {
    const el = lensEl('lensStatus');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
    if (text) lensState('error');
  }

  async function lensStartCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      lensError(I18N.t('lensInsecure')); return;
    }
    try {
      _lensStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
    } catch (e) {
      lensError(e && e.name === 'NotAllowedError' ? I18N.t('lensDenied') : I18N.t('lensCameraError'));
      return;
    }
    const video = lensEl('lensVideo');
    if (!video) return;
    video.srcObject = _lensStream;
    const root = lensEl('lens'); if (root) root.classList.add('lens--live');
    const idle = lensEl('lensIdle'); if (idle) idle.hidden = true;
    const hint = lensEl('lensHint'); if (hint) hint.hidden = false;
    const shot = lensEl('lensShot'); if (shot) shot.disabled = false;
    lensError('');
    lensState('streaming');
  }

  function lensStopCamera() {
    killLens();
    const root = lensEl('lens'); if (root) root.classList.remove('lens--live');
    const video = lensEl('lensVideo'); if (video) video.srcObject = null;
    const idle = lensEl('lensIdle'); if (idle) idle.hidden = false;
    const hint = lensEl('lensHint'); if (hint) hint.hidden = true;
    const shot = lensEl('lensShot'); if (shot) shot.disabled = true;
    lensState('idle');
  }

  function lensGrabFrame() {
    const video = lensEl('lensVideo');
    const canvas = lensEl('lensCanvas');
    if (!video || !canvas || !video.videoWidth) return Promise.resolve(null);
    const scale = Math.min(1, 720 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85));
  }

  function flash() {
    const f = lensEl('lensFlash');
    if (!f) return;
    f.classList.remove('lens__flash--on');
    void f.offsetWidth;   /* перазапуск анімацыі */
    f.classList.add('lens__flash--on');
  }

  async function lensSend(blob) {
    if (!blob || _lensBusy) return;
    _lensBusy = true;
    lensState('busy');
    const spinner = lensEl('lensSpinner'); if (spinner) spinner.hidden = false;
    try {
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      const resp = await fetch(LENS_API, { method: 'POST', body: form });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      await lensRender(await resp.json());
      lensState(_lensStream ? 'streaming' : 'idle');
    } catch (e) {
      lensError(I18N.t('lensOffline'));
    } finally {
      _lensBusy = false;
      if (spinner) spinner.hidden = true;
    }
  }

  function lensBar(name, value) {
    const row = document.createElement('div');
    row.className = 'lens-bar';
    row.innerHTML = `
      <div class="lens-bar__top"><span>${esc(name)}</span><span>${Math.round(value * 100)}%</span></div>
      <div class="lens-bar__track"><div class="lens-bar__fill" style="width:${Math.max(3, Math.round(value * 100))}%"></div></div>`;
    return row;
  }

  function confRing(score) {
    const r = 26, C = 2 * Math.PI * r;
    const pct = Math.round(score * 100);
    const off = C * (1 - Math.max(0, Math.min(1, score)));
    const ring = document.createElement('div');
    ring.className = 'ring';
    ring.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle class="ring__track" cx="32" cy="32" r="${r}"></circle>
        <circle class="ring__value" cx="32" cy="32" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"></circle>
      </svg>
      <span class="ring__label">${pct}%</span>`;
    return ring;
  }

  async function lensRender(data) {
    const inner = lensEl('lensSheetInner');
    if (!inner) return;

    let sights = [];
    try { sights = await loadData('sights'); } catch (e) {}
    const byId = {};
    sights.forEach(o => { byId[o.id] = o; });

    const hit = data.recognized ? byId[data.best] : null;
    inner.innerHTML = '';

    const badge = document.createElement('span');
    badge.className = 'sheet__badge ' + (hit ? 'sheet__badge--ok' : 'sheet__badge--unknown');
    badge.textContent = hit ? I18N.t('lensRecognized') : I18N.t('lensUnknown');
    inner.appendChild(badge);

    if (hit) {
      const rowEl = document.createElement('div');
      rowEl.className = 'sheet__hit';
      rowEl.innerHTML = `
        ${hit.image ? `<img class="sheet__thumb" src="${esc(fixPath(hit.image))}" alt="${esc(hit.title)}">` : ''}
        <div class="sheet__meta">
          <h2 class="sheet__title">${esc(hit.title)}</h2>
          <p class="sheet__desc">${esc(itemDesc(hit))}</p>
        </div>`;
      rowEl.appendChild(confRing(data.score || 0));
      inner.appendChild(rowEl);

      const open = document.createElement('a');
      open.className = 'sheet__open';
      open.href = `#/object/sights/${encodeURIComponent(hit.id)}`;
      open.textContent = I18N.t('lensOpen');
      open.addEventListener('click', closeSheet);
      inner.appendChild(open);
    } else {
      const p = document.createElement('p');
      p.className = 'sheet__desc';
      p.textContent = I18N.t('lensUnknownHint') || '';
      inner.appendChild(p);

      const tipsTitle = document.createElement('p');
      tipsTitle.className = 'quiz__title';
      tipsTitle.textContent = I18N.t('lensTipsTitle');
      const ul = document.createElement('ul');
      ul.className = 'tips';
      [I18N.t('lensTip1'), I18N.t('lensTip2'), I18N.t('lensTip3')].forEach(t => {
        const li = document.createElement('li'); li.className = 'tip'; li.textContent = t; ul.appendChild(li);
      });
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'sheet__retry'; retry.textContent = I18N.t('lensRetry');
      retry.addEventListener('click', closeSheet);
      inner.append(tipsTitle, ul, retry);
    }

    /* топ-3 — у раскрывальным блоку */
    const top = data.top || [];
    if (top.length) {
      const details = document.createElement('details');
      details.className = 'sheet__details';
      const summary = document.createElement('summary');
      summary.textContent = I18N.t('lensNearest');
      const bars = document.createElement('div');
      bars.className = 'lens-bars';
      top.forEach(item => bars.appendChild(lensBar(byId[item.id] ? byId[item.id].title : item.id, item.score)));
      details.append(summary, bars);
      inner.appendChild(details);
    }

    openSheet();
  }

  function openSheet() {
    const sheet = lensEl('lensSheet');
    if (!sheet) return;
    sheet.hidden = false;
    lensState('result');
    requestAnimationFrame(() => sheet.classList.add('sheet--open'));
  }
  function closeSheet() {
    const sheet = lensEl('lensSheet');
    if (!sheet) return;
    sheet.classList.remove('sheet--open');
    setTimeout(() => { if (!sheet.classList.contains('sheet--open')) sheet.hidden = true; }, 300);
  }

  function renderLens(app, page) {
    document.title = `${I18N.t('lensTitle')} ${I18N.t('pageTitle')}`;
    document.documentElement.lang = I18N.get();
    page.className = 'page page--lens page__progress';

    page.innerHTML = `
      <header class="lens-hero">
        <div class="container">
          <h1 class="lens-hero__title">${esc(I18N.t('lensTitle'))}</h1>
        </div>
        <div class="ornament ornament--bleed" aria-hidden="true"></div>
      </header>

      <div class="container">
        <div class="lens-about">
          <span class="lens-about__icon" aria-hidden="true">${ICONS.camera}</span>
          <p class="lens-about__text">${esc(I18N.t('lensIntro'))}</p>
        </div>

        <div class="lens" id="lens" data-state="idle">
          <div class="lens__stage">
            <video id="lensVideo" autoplay playsinline muted></video>
            <canvas id="lensCanvas" hidden></canvas>

            <div class="lens__hint" id="lensHint" hidden>${esc(I18N.t('lensHint'))}</div>
            <div class="lens__spinner" id="lensSpinner" hidden></div>
            <div class="lens__flash" id="lensFlash" aria-hidden="true"></div>

            <button type="button" class="lens__stop" id="lensStop" aria-label="${esc(I18N.t('lensStop'))}">${ICONS.close}</button>

            <div class="lens-idle" id="lensIdle">
              <span class="lens-idle__icon">${ICONS.camera}</span>
              <p class="lens-idle__text">${esc(I18N.t('lensIdleText'))}</p>
              <button type="button" class="lens-idle__btn" id="lensStart">${esc(I18N.t('lensStart'))}</button>
            </div>

            <div class="lens__controls">
              <button type="button" class="lens__tool" id="lensUploadBtn" aria-label="${esc(I18N.t('lensUpload'))}">
                ${ICONS.upload}<span>${esc(I18N.t('lensUpload'))}</span>
              </button>
              <button type="button" class="shutter" id="lensShot" disabled aria-label="${esc(I18N.t('lensShot'))}"><span class="shutter__inner"></span></button>
              <span class="lens__tool lens__tool--spacer" aria-hidden="true"></span>
            </div>
          </div>

          <div class="status lens__error" id="lensStatus" role="status" aria-live="polite" hidden></div>
        </div>
      </div>

      <input type="file" accept="image/*" id="lensFile" hidden>

      <div class="sheet" id="lensSheet" hidden>
        <div class="sheet__handle" aria-hidden="true"></div>
        <div class="sheet__ornament" aria-hidden="true"></div>
        <div class="sheet__inner" id="lensSheetInner"></div>
      </div>
    `;

    lensEl('lensStart').addEventListener('click', () => { flash(); lensStartCamera(); });
    lensEl('lensShot').addEventListener('click', () => { flash(); lensGrabFrame().then(lensSend); });
    lensEl('lensUploadBtn').addEventListener('click', () => lensEl('lensFile').click());
    lensEl('lensFile').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) lensSend(file);
      e.target.value = '';
    });
    lensEl('lensStop').addEventListener('click', lensStopCamera);
    /* закрыццё шторкі свайпам-уніз ці тапам па ручцы */
    lensEl('lensSheet').querySelector('.sheet__handle').addEventListener('click', closeSheet);
  }

  /* ============================================================
     ЭКРАН «КАРТА»
     ============================================================ */
  function renderMapScreen(app, page) {
    document.title = `${I18N.t('mapTitle')} ${I18N.t('pageTitle')}`;
    document.documentElement.lang = I18N.get();
    page.className = 'page page--map page__progress';

    page.innerHTML = `
      <div class="mapscreen" id="mapscreen">
        <div class="mapscreen__map" id="bigMap"></div>
        <button type="button" class="mapscreen__locate" id="locateBtn" aria-label="${esc(I18N.t('mapMyLocation'))}">${ICONS.locate}</button>
      </div>`;

    const el = document.getElementById('bigMap');
    if (typeof L === 'undefined') {
      /* афлайн: Leaflet не загрузіўся */
      el.outerHTML = `<div class="mapscreen__fallback" id="bigMap"><p>${esc(I18N.t('mapOffline'))}</p><ul id="mapFallbackList"></ul></div>`;
      loadData('sights').then(items => {
        const ul = document.getElementById('mapFallbackList');
        if (!ul) return;
        orderedItems(items).forEach(it => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="#/object/sights/${encodeURIComponent(it.id)}">${esc(it.title)}</a>`;
          ul.appendChild(li);
        });
      }).catch(() => {});
      document.getElementById('locateBtn').hidden = true;
      return;
    }

    const start = (items) => {
      _map = L.map('bigMap', { zoomControl: true }).setView([53.8918, 25.3021], 13);
      _maps.push(_map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(_map);

      const card = document.createElement('div');
      card.className = 'map-card';
      card.id = 'mapCard';
      document.getElementById('mapscreen').appendChild(card);

      items.forEach((item, i) => {
        if (!item.lat || !item.lng) return;
        L.marker([item.lat, item.lng], { icon: numberIcon(i + 1) })
          .addTo(_map)
          .on('click', () => showMapCard(item));
      });
    };

    if (_homeItems.length) start(orderedItems(_homeItems));
    else loadData('sights').then(list => { _homeItems = list.filter(i => i.id && i.title); start(orderedItems(_homeItems)); }).catch(() => {
      el.outerHTML = `<div class="mapscreen__fallback"><p>${esc(I18N.t('errorLoad'))}</p></div>`;
    });

    document.getElementById('locateBtn').addEventListener('click', locateMe);
  }

  function numberIcon(n) {
    return L.divIcon({ className: '', html: `<div class="map-marker">${n}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
  }

  function osmLink(item) {
    return `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=17/${item.lat}/${item.lng}`;
  }

  /* Спасылкі на папулярныя карты: OSM па змаўчанні мала хто выкарыстоўвае */
  function mapProviders(item) {
    const lat = item.lat, lng = item.lng, title = encodeURIComponent(item.title || '');
    return [
      { label: 'Google Maps',   href: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` },
      { label: 'Apple Maps',    href: `https://maps.apple.com/?ll=${lat},${lng}&q=${title}` },
      { label: 'Яндекс.Карты',  href: `https://yandex.by/maps/?ll=${lng},${lat}&z=17&pt=${lng},${lat}` },
      { label: 'OpenStreetMap', href: osmLink(item) },
    ];
  }

  /* Кнопка «Як дабрацца», што раскрывае выбар карты (без JS — на <details>) */
  function buildMapChooser(item, triggerClass, openUp) {
    const details = document.createElement('details');
    details.className = 'map-choose' + (openUp ? ' map-choose--up' : '');
    details.innerHTML = `
      <summary class="map-choose__trigger ${triggerClass || ''}">
        ${ICONS.map}<span>${esc(I18N.t('howToGet'))}</span>
      </summary>
      <ul class="map-choose__menu" role="menu">
        ${mapProviders(item).map(p =>
          `<li role="none"><a class="map-choose__item" role="menuitem" target="_blank" rel="noopener" href="${esc(p.href)}">${esc(p.label)}</a></li>`
        ).join('')}
      </ul>`;
    details.querySelectorAll('.map-choose__item').forEach(a =>
      a.addEventListener('click', () => { details.open = false; }));
    return details;
  }

  function showMapCard(item) {
    const card = document.getElementById('mapCard');
    if (!card) return;
    card.innerHTML = `
      <button type="button" class="map-card__close" aria-label="${esc(I18N.t('shareClose'))}">${ICONS.close}</button>
      ${item.image ? `<img class="map-card__img" src="${esc(fixPath(item.image))}" alt="${esc(item.title)}">` : ''}
      <div class="map-card__body">
        <h2 class="map-card__title">${esc(item.title)}</h2>
        <p class="map-card__desc">${esc(itemDesc(item))}</p>
        <div class="map-card__actions">
          <a class="map-card__btn map-card__btn--primary" href="#/object/sights/${encodeURIComponent(item.id)}">${esc(I18N.t('mapOpen'))}</a>
        </div>
      </div>`;
    card.querySelector('.map-card__actions')
      .appendChild(buildMapChooser(item, 'map-card__btn map-card__btn--ghost', true));
    card.querySelector('.map-card__close').addEventListener('click', () => card.classList.remove('map-card--open'));
    card.classList.add('map-card--open');
    if (_map) _map.setView([item.lat, item.lng], 16);
  }

  function locateMe() {
    if (!navigator.geolocation) { showToast(I18N.t('mapLocateError')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!_map) return;
        const ll = [pos.coords.latitude, pos.coords.longitude];
        L.circleMarker(ll, { radius: 8, color: '#fff', weight: 2, fillColor: '#9c3b2a', fillOpacity: 1 }).addTo(_map);
        _map.setView(ll, 15);
      },
      () => showToast(I18N.t('mapLocateError')),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  /* ============================================================
     КАРТА (убудаваная — галоўная і мінікарта аб'екта)
     ============================================================ */
  function killMap() { _maps.forEach(m => { try { m.remove(); } catch (e) {} }); _maps.length = 0; _map = null; }

  function initHomeMap(containerId, items, zoom, interactive = true) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (typeof L === 'undefined') { el.hidden = true; return; }

    const map = L.map(containerId, { zoomControl: true, scrollWheelZoom: false })
      .setView([53.8918, 25.3021], zoom || 13);
    _maps.push(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const pts = [];
    /* нумары — як на галоўнай і на вялікай карце: «візітоўка» (замак) першая */
    orderedItems(items).forEach((item, i) => {
      if (!item.lat || !item.lng) return;
      pts.push([item.lat, item.lng]);
      const marker = L.marker([item.lat, item.lng], {
        icon: numberIcon(i + 1),
        interactive: interactive,
        keyboard: interactive,
      }).addTo(map);
      if (!interactive) return;   /* на старонцы аб'екта пін неклікабельны */
      const popup = document.createElement('div');
      popup.className = 'map-popup';
      if (item.image) {
        const img = document.createElement('img');
        img.src = fixPath(item.image); img.alt = item.title; img.className = 'map-popup__img';
        popup.appendChild(img);
      }
      const lnk = document.createElement('a');
      lnk.href = `#/object/sights/${encodeURIComponent(item.id)}`;
      lnk.className = 'map-popup__title';
      lnk.textContent = item.title;
      popup.appendChild(lnk);
      marker.bindPopup(popup, { maxWidth: 220, className: 'map-popup-wrap' })
        .on('click', () => map.setView([item.lat, item.lng], 16));
    });
    if (pts.length === 1) map.setView(pts[0], zoom || 15);
    else if (pts.length) map.fitBounds(pts, { padding: [30, 30] });
  }

  /* ============================================================
     ПРОГРЭС КВІЗАЎ (localStorage)
     ============================================================ */
  const QUIZ_KEY = 'lidalens_quiz_progress';
  function quizDoneList() {
    try {
      const list = JSON.parse(localStorage.getItem(QUIZ_KEY) || '[]');
      return Array.isArray(list) ? list.filter(k => typeof k === 'string') : [];
    } catch (e) { return []; }
  }
  function quizIsDone(source, id) { return quizDoneList().includes(`${source}/${id}`); }
  function quizMarkDone(source, id) {
    const list = quizDoneList(); const key = `${source}/${id}`;
    if (list.includes(key)) return;
    list.push(key);
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify(list)); } catch (e) {}
  }

  /* ============================================================
     ПАМЫЛКІ
     ============================================================ */
  function showError(page, message) {
    page.innerHTML = `
      <div class="container">
        <div class="status status--error">
          ${esc(message)}<br><br>
          <a href="#/">${esc(I18N.t('errorGoHome'))}</a>
        </div>
      </div>`;
  }

  /* ============================================================
     АКНО «ПАДЗЯЛІЦЦА»
     ============================================================ */
  const PHONE_PATH = 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24' +
    ' 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5' +
    'c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';

  const SHARE_NETWORKS = [
    { id: 'telegram', name: 'Telegram', color: '#2aabee',
      href: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: (c) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#fff" d="M21.9 4.1 3 11.5c-.9.3-.9 1.4 0 1.7l4.5 1.5 1.7 5.1c.2.7 1.1.9 1.6.3l2.3-2.4 4.7 3.5c.6.4 1.4.1 1.5-.6l3.3-15.1c.2-.9-.6-1.6-1.4-1.4Z"/><path fill="${c}" d="m9.7 14.3 8.6-6.1-7 7-.3 3.2z"/></svg>` },
    { id: 'viber', name: 'Viber', color: '#7360f2',
      href: (url, title) => `viber://forward?text=${encodeURIComponent(title + ' ' + url)}`,
      icon: () => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#fff" d="${PHONE_PATH}"/></svg>` },
    { id: 'whatsapp', name: 'WhatsApp', color: '#25d366',
      href: (url, title) => `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
      icon: (c) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#fff" d="M12 2.9a9.1 9.1 0 0 0-7.8 13.6L2.8 21.2l4.8-1.3A9.1 9.1 0 1 0 12 2.9Z"/><g transform="translate(4.7 4.7) scale(0.61)"><path fill="${c}" d="${PHONE_PATH}"/></g></svg>` },
    { id: 'vk', name: 'VK', color: '#4c75a3',
      href: (url, title) => `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      icon: () => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><text x="12" y="16.4" text-anchor="middle" font-family="Roboto, Arial, sans-serif" font-size="10.5" font-weight="700" fill="#fff">VK</text></svg>` },
    { id: 'facebook', name: 'Facebook', color: '#1877f2',
      href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: () => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><text x="12" y="17.4" text-anchor="middle" font-family="Roboto, Arial, sans-serif" font-size="16" font-weight="700" fill="#fff">f</text></svg>` },
    { id: 'x', name: 'X', color: '#10151c',
      href: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: () => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#fff" d="M4.4 3.5h4.4l3.9 5.4 4.5-5.4h2.5l-6 7.1 6.4 9.9h-4.4l-4.2-5.7-4.8 5.7H4.2l6.4-7.6z"/></svg>` },
    { id: 'email', name: 'E-mail', color: '#6b5f57',
      href: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
      icon: () => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="#fff" stroke-width="1.7"/><path d="M4.6 7.4 12 12.8l7.4-5.4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  ];

  let _shareModal = null;
  let _shareButton = null;

  const NATIVE_SHARE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v11"/><path d="m7.8 7.2 4.2-4.2 4.2 4.2"/><path d="M5.5 12.5v6a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6"/></svg>`;

  function ensureShareModal() {
    if (_shareModal) return _shareModal;
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.hidden = true;

    const backdrop = document.createElement('div');
    backdrop.className = 'share-modal__backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'share-modal__dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'shareModalLabel');

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'share-modal__close';
    close.innerHTML = ICONS.close;

    const qr = document.createElement('div');
    qr.className = 'share-modal__qr';
    const hint = document.createElement('p');
    hint.className = 'share-modal__hint';
    const divider = document.createElement('hr');
    divider.className = 'share-modal__divider';
    const label = document.createElement('h2');
    label.className = 'share-modal__label';
    label.id = 'shareModalLabel';
    const socials = document.createElement('div');
    socials.className = 'share-modal__socials';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'share-modal__copy';
    copy.innerHTML = ICONS.link;
    const copyText = document.createElement('span');
    copyText.className = 'share-modal__copy-label';
    copy.appendChild(copyText);
    copy.addEventListener('click', async () => {
      try { await copyToClipboard(location.href); closeShareModal(); showToast(I18N.t('linkCopied')); }
      catch (e) { showToast(I18N.t('shareFailed')); }
    });

    dialog.append(close, qr, hint, divider, label, socials, copy);
    modal.append(backdrop, dialog);
    document.body.appendChild(modal);

    backdrop.addEventListener('click', closeShareModal);
    close.addEventListener('click', closeShareModal);
    _shareModal = modal;
    return modal;
  }

  function fillShareModal(modal) {
    const url = location.href;
    const title = document.title;
    modal.querySelector('.share-modal__close').setAttribute('aria-label', I18N.t('shareClose'));
    modal.querySelector('.share-modal__hint').textContent = I18N.t('qrHint');
    modal.querySelector('.share-modal__label').textContent = I18N.t('shareTo');
    modal.querySelector('.share-modal__copy-label').textContent = I18N.t('shareCopyLink');

    const qr = modal.querySelector('.share-modal__qr');
    qr.innerHTML = '';
    const svg = qrSvg(url);
    if (svg) qr.innerHTML = svg;
    else { const p = document.createElement('p'); p.className = 'share-modal__error'; p.textContent = I18N.t('qrUnavailable'); qr.appendChild(p); }

    const socials = modal.querySelector('.share-modal__socials');
    socials.innerHTML = '';
    SHARE_NETWORKS.forEach(net => {
      const a = document.createElement('a');
      a.className = 'share-social';
      a.href = net.href(url, title);
      if (net.id !== 'email') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.setAttribute('aria-label', I18N.t('shareToNetwork', { network: net.name }));
      const icon = document.createElement('span');
      icon.className = 'share-social__icon';
      icon.style.background = net.color;
      icon.innerHTML = net.icon(net.color);
      const name = document.createElement('span');
      name.className = 'share-social__name';
      name.textContent = net.name;
      a.append(icon, name);
      socials.appendChild(a);
    });

    if (navigator.share) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'share-social share-social--native';
      more.setAttribute('aria-label', I18N.t('shareMore'));
      more.addEventListener('click', async () => {
        try { await navigator.share({ title, url }); closeShareModal(); } catch (e) {}
      });
      const icon = document.createElement('span');
      icon.className = 'share-social__icon';
      icon.style.background = 'var(--text)';
      icon.innerHTML = NATIVE_SHARE_ICON;
      const name = document.createElement('span');
      name.className = 'share-social__name';
      name.textContent = I18N.t('shareMore');
      more.append(icon, name);
      socials.appendChild(more);
    }
  }

  function openShareModal(trigger) {
    const modal = ensureShareModal();
    fillShareModal(modal);
    modal.hidden = false;
    document.body.classList.add('share-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    modal.querySelector('.share-modal__close').focus();
    document.addEventListener('keydown', onShareKeydown);
  }

  function closeShareModal() {
    if (!_shareModal || _shareModal.hidden) return;
    _shareModal.hidden = true;
    document.body.classList.remove('share-open');
    document.removeEventListener('keydown', onShareKeydown);
    if (_shareButton && !_shareButton.hidden) {
      _shareButton.setAttribute('aria-expanded', 'false');
      _shareButton.focus();
    }
  }

  function onShareKeydown(e) {
    if (!_shareModal || _shareModal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeShareModal(); return; }
    if (e.key !== 'Tab') return;
    const items = _shareModal.querySelectorAll('button, a[href]');
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return; }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.top = '-1000px';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (!ok) throw new Error('copy failed');
  }

  function qrSvg(text) {
    if (typeof qrcode !== 'function') return null;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text, 'Byte');
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true, title: I18N.t('qrTitle'), alt: I18N.t('qrAlt') });
    } catch (e) { return null; }
  }

  /* ============================================================
     ЗАПУСК
     ============================================================ */
  function init() {
    buildShell();
    initScrollChrome();
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('hashchange', () => navigate(parseRoute()));
    navigate(parseRoute());
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
