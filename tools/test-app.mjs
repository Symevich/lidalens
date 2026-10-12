/* Integration test for the LidaLens SPA (jsdom, no browser needed).
   Run: node tools/test-app.mjs   (npm install first, see tools/package.json)

   NOTE — this suite was rewritten to describe the app that actually ships.
   The previous revision asserted a different UI (.top-chrome / .back-button /
   .list-item / .object-card, a scroll-aware `chrome-hidden` body class, the
   --chrome-* / --page-max token families) and two extra datasets
   (data/enterprises.json, data/people.json). This project has none of that:
   the shipped app is .topbar / .bottomnav / .sight-card / .feature-card over a
   single `sights` dataset, so 39 of the old 88 checks could never pass — and
   the file died on the missing enterprises.json before reaching the DOM part
   at all. The checks below are written against the real markup, stylesheet,
   dictionary and data files. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const data = (p) => JSON.parse(read(p));

let checks = 0;
let failures = 0;
function check(name, cond, extra = '') {
  checks++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? '  [' + extra + ']' : ''}`);
  if (!cond) failures++;
}
const tick = (ms = 25) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, timeout = 3000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeout) throw new Error(`timeout waiting for ${label}`);
    await tick(25);
  }
}

/* ════════════════════════════════════════════════════════════
   1. Static wiring: shell, manifest, service worker
   ════════════════════════════════════════════════════════════ */
const indexHtml = read('index.html');
const welcomeHtml = read('welcome.html');
const swJs = read('sw.js');
const appJs = read('js/app.js');
const i18nJs = read('js/i18n.js');
const styleCss = read('css/style.css');
const styleCssBare = styleCss.replace(/\/\*[\s\S]*?\*\//g, '');
const manifest = data('manifest.json');

check('index.html links manifest', /rel="manifest" href="\.\/manifest\.json"/.test(indexHtml));
check('index.html has theme-color', /name="theme-color"/.test(indexHtml));
/* The service worker must be registered with updateViaCache: 'none': that is
   the fix for the "the site never updates" bug, where a cached sw.js keeps
   serving the old shell forever. Asserted for real, not just "a registration
   happens" — a plain register('./sw.js') is exactly the broken form. */
const SW_REGISTER = /serviceWorker\.register\('\.\/sw\.js',\s*\{\s*updateViaCache:\s*'none'\s*\}\)/;
check('index.html registers sw.js with updateViaCache none', SW_REGISTER.test(indexHtml));
check('welcome.html registers sw.js with updateViaCache none', SW_REGISTER.test(welcomeHtml));
check('index.html loads the qrcode vendor', /src="\.\/js\/vendor\/qrcode\.js\?v=[^"]+"/.test(indexHtml));
check('index.html opts into the full screen', /viewport-fit=cover/.test(indexHtml));
check('welcome.html links manifest', /rel="manifest" href="\.\/manifest\.json"/.test(welcomeHtml));
check('welcome.html opts into the full screen', /viewport-fit=cover/.test(welcomeHtml));

check('manifest short_name', manifest.short_name === 'LidaLens', manifest.short_name);
check('manifest display standalone', manifest.display === 'standalone');
check('manifest start_url', manifest.start_url === './index.html', manifest.start_url);
for (const icon of manifest.icons) {
  check(`manifest icon exists ${icon.src}`, exists(icon.src), icon.sizes + ' ' + icon.purpose);
}

/* every precached shell asset must exist on disk */
const shellBlock = (swJs.match(/const SHELL_ASSETS = \[([\s\S]*?)\];/) || [])[1] || '';
const precached = [...shellBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== './');
check('sw declares a shell asset list', precached.length > 0, String(precached.length));
for (const asset of precached) {
  check(`sw precache exists ${asset}`, exists(asset));
}
check('sw has a versioned cache name', /lidalens-shell-\$\{VERSION\}/.test(swJs));
check('sw deletes old caches on activate', /caches\.delete/.test(swJs));
check('sw handles Range requests', /headers\.has\('range'\)/.test(swJs));

/* Cloudflare caches every .css/.js by extension for 4 hours unless the origin
   says otherwise, so a release used to sit invisible at the edge for hours.
   index.html is never edge-cached, so stamping a version on the assets it
   loads (and on the same assets in the precache list) makes a release visible
   at once. Both copies must carry the SAME stamp as sw.js VERSION. */
const swVersion = (swJs.match(/const VERSION = '([^']+)'/) || [])[1];
check('sw declares a version', !!swVersion, swVersion);
const stampedInHtml = [...indexHtml.matchAll(/\.\/(?:css|js)\/[^"?]+\.(?:css|js)\?v=([^"&]+)/g)].map((m) => m[1]);
check('index.html stamps every local stylesheet and script',
  stampedInHtml.length === 5, stampedInHtml.join(', '));
check('the stamp in index.html matches the service worker version',
  stampedInHtml.length > 0 && stampedInHtml.every((v) => v === swVersion),
  `html=${[...new Set(stampedInHtml)].join(',')} sw=${swVersion}`);
check('every local css/js is stamped (none left unversioned)',
  !/href="\.\/(?:css\/[^"?]+\.css|js\/[^"?]+\.js)"/.test(indexHtml) &&
  !/src="\.\/js\/[^"?]+\.js"/.test(indexHtml));
check('the precache list goes through the same stamp',
  /cache\.add\(new Request\(withVersion\(url\)/.test(swJs) &&
  /withVersion = \(url\) => \(\/\\\.\(css\|js\)\$\/\.test\(url\)/.test(swJs));

/* the old in-card share / QR UI must be gone for good */
check('no in-card share buttons left in app.js', !/btn-action|object-card__actions/.test(appJs));
check('no in-card share styles left in style.css', !/btn-action|\.qr-panel/.test(styleCss));

/* ════════════════════════════════════════════════════════════
   2. Design tokens and the touch / keyboard policy
   ════════════════════════════════════════════════════════════ */
check('the spacing scale is declared',
  /--space-1:\s*4px/.test(styleCss) && /--space-7:\s*32px/.test(styleCss));
check('the radius scale is declared',
  /--radius-sm:\s*\d+px/.test(styleCss) && /--radius-pill:\s*999px/.test(styleCss));
check('the elevation scale is declared',
  /--shadow-hover:/.test(styleCss) && /--shadow-modal:/.test(styleCss) && /--shadow-menu:/.test(styleCss));
check('the safe-area insets are read once',
  /--safe-top:\s*env\(safe-area-inset-top/.test(styleCss) &&
  /--safe-bottom:\s*env\(safe-area-inset-bottom/.test(styleCss));
check('the chrome height is a token', /--topbar-h:\s*\d+px/.test(styleCss));
check('the content and reading widths are tokens',
  /--content-max:\s*\d+px/.test(styleCss) && /--read-max:\s*[\d.]+rem/.test(styleCss));
check('the ornament is a reusable token', /--ornament:\s*url\(/.test(styleCss));

/* Touch screens keep :hover after a tap until you tap elsewhere, so a tapped
   card used to look "selected" (red title, lifted, shadowed). All hover
   effects therefore live behind @media (hover: hover); the keyboard focus
   rings must stay unconditional, and they are what makes the app usable
   without a pointer. */
const hoverMediaAt = styleCssBare.indexOf('@media (hover: hover)');
check('hover effects are gated behind @media (hover: hover)', hoverMediaAt > 0);
check('no :hover rule leaks outside that media query',
  hoverMediaAt > 0 && !styleCssBare.slice(0, hoverMediaAt).includes(':hover'));
check('all hover rules were moved, not dropped',
  (styleCssBare.slice(hoverMediaAt).match(/:hover/g) || []).length >= 20,
  String((styleCssBare.slice(hoverMediaAt).match(/:hover/g) || []).length));
check('keyboard focus rings are NOT gated behind hover',
  hoverMediaAt > 0 && styleCssBare.slice(0, hoverMediaAt).includes(':focus-visible'));

/* ════════════════════════════════════════════════════════════
   3. Dictionary integrity
   ════════════════════════════════════════════════════════════ */
const LOCALES = ['be', 'ru', 'en'];
const localeKeys = {};
for (const lang of LOCALES) {
  const block = (i18nJs.match(new RegExp(`\\n    ${lang}:\\s*\\{([\\s\\S]*?)\\n    \\},`)) || [])[1] || '';
  localeKeys[lang] = new Set([...block.matchAll(/^\s{6}([A-Za-z0-9_]+):/gm)].map((m) => m[1]));
}
check('the dictionary declares every locale',
  LOCALES.every((l) => localeKeys[l].size > 0),
  LOCALES.map((l) => l + '=' + localeKeys[l].size).join(' '));

const allKeys = new Set(LOCALES.flatMap((l) => [...localeKeys[l]]));
for (const lang of LOCALES) {
  const missing = [...allKeys].filter((k) => !localeKeys[lang].has(k));
  check(`locale "${lang}" defines every key`, missing.length === 0, missing.join(', '));
}

/* Every string the app asks for must exist: I18N.t() falls back to the raw
   key, so a typo ships as literal "someKey" to the user. */
const usedKeys = new Set([
  ...appJs.matchAll(/I18N\.t\(\s*['"]([^'"]+)['"]/g),
].map((m) => m[1]));
const undefinedKeys = [...usedKeys].filter((k) => !allKeys.has(k));
check('every dictionary key used by app.js exists', undefinedKeys.length === 0,
  undefinedKeys.join(', '), usedKeys.size + ' keys used');

/* ════════════════════════════════════════════════════════════
   4. Data files: the same sights in every language, audio per locale
   ════════════════════════════════════════════════════════════ */
const sightFiles = { be: 'data/sights.json', ru: 'data/sights.ru.json', en: 'data/sights.en.json' };
const sights = {};
for (const [lang, file] of Object.entries(sightFiles)) {
  check(`data file parses ${file}`, (() => { try { sights[lang] = data(file); return true; } catch (e) { return false; } })());
}

const idsOf = (list) => list.map((i) => i.id);
check('every locale ships the same sights in the same order',
  JSON.stringify(idsOf(sights.be)) === JSON.stringify(idsOf(sights.ru)) &&
  JSON.stringify(idsOf(sights.be)) === JSON.stringify(idsOf(sights.en)),
  String(sights.be.length) + ' sights');
check('every sight has the fields the UI renders',
  sights.be.every((i) => i.id && i.title && i.type && i.typeLabel && i.image && i.description),
  sights.be.filter((i) => !(i.id && i.title && i.type && i.typeLabel && i.image && i.description)).map((i) => i.id).join(', '));
check('every sight has coordinates for the map',
  sights.be.every((i) => typeof i.lat === 'number' && typeof i.lng === 'number'));

const missingAudio = sights.be.filter((i) => !i.audio).map((i) => i.id);
check('every Belarusian sight has a recording', missingAudio.length === 0, missingAudio.join(', '));

/* A recording must live in its own language folder: that is what keeps a
   Belarusian take from quietly serving a translation. */
const strayAudio = [];
for (const [lang, list] of Object.entries(sights)) {
  for (const item of list) {
    if (item.audio && item.audio !== `../assets/audio/${lang}/${item.id}.${lang}.mp3`) {
      strayAudio.push(`${lang}/${item.id}: ${item.audio}`);
    }
  }
}
check('every recording points into its own language folder', strayAudio.length === 0, strayAudio.join(', '));

/* Nothing may point at a file that is not on disk. */
const dangling = [];
for (const list of Object.values(sights)) {
  for (const item of list) {
    for (const key of ['image', 'audio']) {
      if (item[key] && !exists(item[key].replace(/^\.\.\//, ''))) dangling.push(`${item.id}: ${item[key]}`);
    }
  }
}
check('every referenced image and recording exists on disk', dangling.length === 0, dangling.join(', '));

/* The quiz text comes from the data, so the correct option must be addressed
   by an index that actually exists in that item's option list. */
check('every quiz points at one of its own options',
  sights.be.every((i) => !i.quiz || (Array.isArray(i.quiz.options) &&
    i.quiz.options.length >= 2 &&
    Number.isInteger(i.quiz.correctIndex) &&
    i.quiz.correctIndex >= 0 && i.quiz.correctIndex < i.quiz.options.length)),
  sights.be.filter((i) => !!i.quiz).length + ' quizzes');

/* The user-visible "no recording" placeholder was removed from the product;
   app.js still marks such an element with a dataset flag, which is not text. */
check('the "no recording" placeholder is gone from the dictionary', !/noAudio/.test(i18nJs));

/* ════════════════════════════════════════════════════════════
   5. DOM: the real app, rendered in jsdom
   ════════════════════════════════════════════════════════════ */
const dom = new JSDOM('<!doctype html><html lang="be"><body><main id="app"></main></body></html>', {
  url: 'http://localhost/index.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;

const requested = [];
window.fetch = async (url) => {
  requested.push(url);
  const file = path.join(ROOT, String(url).replace(/^\.\//, ''));
  if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
  return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
};
/* jsdom has no layout, so the browser APIs app.js reaches for are stubbed. */
Object.defineProperty(window, 'CSS', { configurable: true, value: { supports: () => true } });
window.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = window.matchMedia ||
  (() => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
window.scrollTo = () => {};

const copied = [];
Object.defineProperty(window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: async (t) => { copied.push(t); } },
});

const ctx = dom.getInternalVMContext();
vm.runInContext(read('js/i18n.js'), ctx, { filename: 'i18n.js' });
vm.runInContext(read('js/vendor/qrcode.js'), ctx, { filename: 'qrcode.js' });
vm.runInContext(read('js/app.js'), ctx, { filename: 'app.js' });

const doc = window.document;
const cardCount = () => doc.querySelectorAll('.feature-card, .sight-card').length;

async function goto(hash) {
  window.location.hash = hash;
  await tick(15);
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  await tick(80);
}

const topbar = await waitFor(() => doc.querySelector('.topbar'), 'topbar');
const shareBtn = await waitFor(() => doc.getElementById('shareButton'), 'share button');

/* ── the shell ── */
check('the top bar is built', !!topbar);
check('the bottom navigation is built', !!doc.querySelector('.bottomnav'));
check('the brand links home', /^LidaGid$/.test(doc.querySelector('.topbar__brand').textContent.trim()));
check('the shell offers the three views',
  !!doc.getElementById('navSights') && !!doc.getElementById('navLens') && !!doc.getElementById('navMap'));

/* The centre button carries the longest nav label ("Ліда ў аб'ектыве"). It
   used to sit in a hard 64px column, so the label wrapped onto two lines with
   the first painted in --brick on the --brick FAB — invisible — and the second
   hanging off the bottom of the bar. jsdom has no layout, so these assert the
   rules that make the layout correct. */
const bnLabelRule = (styleCss.match(/\.bottomnav__label\s*\{([^}]*)\}/) || [])[1] || '';
const bnCenterRule = (styleCss.match(/\.bottomnav__center\s*\{([^}]*)\}/) || [])[1] || '';
const bnCenterLabelRule = (styleCss.match(/\.bottomnav__center \.bottomnav__label\s*\{([^}]*)\}/) || [])[1] || '';
check('nav labels centre their lines', /text-align:\s*center/.test(bnLabelRule));
check('nav labels use a tight line height', /line-height:\s*1\.\d+/.test(bnLabelRule));
check('the centre column is not a hard 64px box',
  /width:\s*auto/.test(bnCenterRule), bnCenterRule.replace(/\s+/g, ' ').trim());
check('the centre column still reserves the fab width', /min-width:\s*64px/.test(bnCenterRule));
check('the centre label never wraps', /white-space:\s*nowrap/.test(bnCenterLabelRule));
check('the centre label is not permanently accented',
  !/color:\s*var\(--brick\)/.test(bnCenterLabelRule), bnCenterLabelRule.replace(/\s+/g, ' ').trim());
check('the centre button is labelled with the lens title',
  doc.querySelector('#bnLens .bottomnav__label').textContent.trim() === "Ліда ў аб'ектыве",
  doc.querySelector('#bnLens .bottomnav__label').textContent.trim());
check('the side buttons keep their own labels',
  doc.querySelector('#bnSights .bottomnav__label').textContent.trim() === 'Славутасці' &&
  doc.querySelector('#bnMap .bottomnav__label').textContent.trim() === 'Карта');
check('the language switcher lives in the top bar', !!topbar.querySelector('.lang-switcher'));
check('the share button lives in the top bar', !!topbar.querySelector('#shareButton'));
check('the share button is icon-only',
  shareBtn.textContent.trim() === '' && !!shareBtn.querySelector('svg'));
check('the share button has an accessible label',
  shareBtn.getAttribute('aria-label') === 'Падзяліцца спасылкай на гэтую старонку',
  shareBtn.getAttribute('aria-label'));
check('the share button announces a dialog', shareBtn.getAttribute('aria-haspopup') === 'dialog');
check('the share button starts collapsed', shareBtn.getAttribute('aria-expanded') === 'false');
check('the share button is hidden on the home screen', shareBtn.hidden === true);

/* ── home ── */
await waitFor(() => doc.querySelectorAll('.feature-card, .sight-card').length, 'home cards');
check('home renders the hero title', doc.querySelector('.home-hero__title').textContent === 'Ліда',
  doc.querySelector('.home-hero__title').textContent);
check('the home eyebrow is still there', !!doc.querySelector('.home-hero .eyebrow'));
/* Same rule as on the lens: the strip lives beside the gutter container, so it
   spans the screen instead of stopping at `100% - 2 * gutter` or, worse, being
   pinned to the left edge of a centred header. */
const heroOrnament = doc.querySelector('.home-hero .ornament');
const footOrnament = doc.querySelector('.page-footer .ornament');
check('the home hero ornament is not trapped in the gutter container',
  !!heroOrnament && heroOrnament.parentElement.classList.contains('home-hero') &&
  heroOrnament.parentElement.parentElement.classList.contains('page'),
  heroOrnament ? heroOrnament.parentElement.parentElement.className : 'missing');
check('the home hero keeps its title inside a gutter container',
  !!doc.querySelector('.home-hero > .container > .home-hero__title'));
check('the home hero ornament is full-bleed',
  !!heroOrnament && heroOrnament.classList.contains('ornament--bleed'));
check('the home footer ornament is full-bleed',
  !!footOrnament && footOrnament.classList.contains('ornament--bleed'));
check('the footer is no longer a gutter container',
  !doc.querySelector('.page-footer').classList.contains('container'));
check('home renders one card per sight', cardCount() === sights.be.length,
  `${cardCount()} cards / ${sights.be.length} sights`);
check('the first sight is the highlighted feature card', !!doc.querySelector('.feature-card'));
check('the remaining sights are a grid', doc.querySelectorAll('.sight-card').length === sights.be.length - 1);
check('the camera call-to-action is on home', !!doc.querySelector('.lens-cta'));
check('the category filter is gone', doc.querySelectorAll('.chip').length === 0,
  String(doc.querySelectorAll('.chip').length));
check('home embeds the map', !!doc.getElementById('homeMap'));
check('home has no quiz UI', !doc.querySelector('.quiz'));
check('the sight cards deep-link into the object view',
  /^#\/object\/sights\//.test(doc.querySelector('.feature-card').getAttribute('href')));

/* ════════════════════════════════════════════════════════════
   6. Regression: the five fixes from the customer's screenshots
   ════════════════════════════════════════════════════════════ */
check('regression: home no longer renders the sights subtitle',
  !doc.querySelector('.home-hero__sub'));
check('regression: the subtitle string is gone from the dictionary',
  !/homeSubtitle/.test(i18nJs));
check('regression: the subtitle style is gone from the stylesheet',
  !/\.home-hero__sub/.test(styleCss));
check('regression: the footer carries no caption any more',
  doc.querySelector('.page-footer').textContent.trim() === '' &&
  !!doc.querySelector('.page-footer .ornament'));
check('regression: the footer string is gone from the dictionary',
  !/footerNote/.test(i18nJs));
check('regression: the article keeps its gutter on mobile',
  /\.object-layout\s*\{[^}]*width:\s*min\(100% - 2 \* var\(--gutter\)/.test(styleCss));
check('regression: every ornament strip is full-bleed, none short or left-aligned',
  /\.ornament--bleed\s*\{[^}]*width:\s*100%/.test(styleCss) &&
  !/\.ornament--short/.test(styleCss) &&
  (appJs.match(/ornament ornament--bleed/g) || []).length === 3 &&
  !/ornament ornament--short/.test(appJs),
  (appJs.match(/ornament ornament--bleed/g) || []).length + ' full-bleed strips (home hero, home footer, lens)');
check('regression: the camera hint clears the control bar',
  /\.lens__hint \{[\s\S]*?72px[\s\S]*?var\(--safe-bottom\)/.test(styleCss));

/* ════════════════════════════════════════════════════════════
   7. Object view
   ════════════════════════════════════════════════════════════ */
await goto('#/object/sights/lidski-zamak');
const heroTitle = await waitFor(() => doc.querySelector('.hero__title'), 'object hero');
const castle = sights.be.find((i) => i.id === 'lidski-zamak');

check('the object view shows the sight title', heroTitle.textContent === castle.title, heroTitle.textContent);
check('the object view shows the type and period chip', !!doc.querySelector('.hero__chip'));
check('the object view renders the hero photo', !!doc.querySelector('.hero__img'));
check('the object view uses the two-column layout', !!doc.querySelector('.object-layout') && !!doc.querySelector('.object-main'));
check('the share button is visible on an object view', shareBtn.hidden === false);
check('the object view lists quick facts', doc.querySelectorAll('.fact-chip').length >= 2);
check('the object view renders the article', !!doc.querySelector('.article') &&
  doc.querySelector('.article').textContent.trim().length > 200);
check('the article keeps its drop cap', !!doc.querySelector('.article--dropcap'));
check('the object hero tucks under the transparent top bar',
  /\.page--object > \.hero\s*\{[^}]*margin-top:\s*calc\(-1/.test(styleCss));
check('the object page hides the chrome while scrolling down',
  /\.nav-hidden \.topbar\s*\{[^}]*translateY\(-100%\)/.test(styleCss));
check('the player only sticks to the top while playing',
  !/\.audio-player\s*\{[^}]*position:\s*sticky/.test(styleCss) &&
  /\.audio-player--playing\s*\{[^}]*position:\s*sticky/.test(styleCss));
check('the player keeps its play/pause control while playing',
  !/\.audio-player--playing \.audio-player__play\s*\{[^}]*display:\s*none/.test(styleCss));
check('the audio player is rendered', !!doc.querySelector('.audio-player') && !!doc.querySelector('audio'));
check('the player points at the recording named in the data file',
  doc.querySelector('audio source').getAttribute('src') === castle.audio.replace(/^\.\.\//, './'),
  doc.querySelector('audio source').getAttribute('src'));
check('the player offers a 15-second skip pair',
  doc.querySelectorAll('.audio-player__skip').length === 2);
check('the object view no longer offers the camera shortcut', !doc.querySelector('.lens-inline'));
check('the object view no longer links to the neighbours', doc.querySelectorAll('.sibling').length === 0);
check('the object view embeds a mini map', !!doc.getElementById('miniMap'));
check('the "how to get there" link is styled as a button',
  !!doc.querySelector('.mini-map__link') && /\.mini-map__link\s*\{[^}]*background:\s*var\(--brick\)/.test(styleCss));
check('the "how to get there" button offers a choice of maps',
  doc.querySelectorAll('.map-choose__item').length >= 3);
check('the first map option is Google Maps',
  /google\.com\/maps/.test((doc.querySelector('.map-choose__item') || {}).getAttribute?.('href') || ''));
check('the object hero never crops the photo',
  /\.hero__img\s*\{[^}]*object-fit:\s*contain/.test(styleCss));
check('the hero title is not overlaid on the photo',
  !/\.hero__caption\s*\{[^}]*position:\s*absolute/.test(styleCss));
check('the hero photo fades into the page background',
  /\.hero__img\s*\{[^}]*mask-image:\s*linear-gradient\(to bottom, #000/.test(styleCss));

/* ── the quiz is a collapsed disclosure ── */
const quizBlock = doc.querySelector('.quiz');
check('the object view renders the quiz', !!quizBlock);
check('the quiz starts collapsed', quizBlock.tagName === 'DETAILS' && quizBlock.open === false);
check('the quiz title sits inside the disclosure summary',
  !!quizBlock.querySelector('.quiz__summary > .quiz__title'));
check('the collapsed quiz shows an expand cue', !!quizBlock.querySelector('.quiz__chevron'));
check('the question and the options live in the panel',
  !!quizBlock.querySelector('.quiz__body > .quiz__question') &&
  !!quizBlock.querySelector('.quiz__body > .quiz__options'));
check('nothing outside the summary is a direct child of the disclosure',
  [...quizBlock.children].every((el) => el.matches('.quiz__summary, .quiz__body')),
  [...quizBlock.children].map((el) => el.className).join('|'));
check('the quiz question comes from the data file',
  quizBlock.querySelector('.quiz__question').textContent === castle.quiz.question,
  quizBlock.querySelector('.quiz__question').textContent);
const opts = [...quizBlock.querySelectorAll('.quiz__option')];
check('the quiz offers every option', opts.length === castle.quiz.options.length,
  opts.map((o) => o.textContent).join('|'));
check('feedback is empty while unanswered',
  quizBlock.querySelector('.quiz__feedback').textContent === '');
check('clicking the summary opens the quiz', (() => {
  try { quizBlock.querySelector('summary').click(); return quizBlock.open === true; }
  catch (e) { return false; }
})());
check('clicking the summary again closes it', (() => {
  try { quizBlock.querySelector('summary').click(); return quizBlock.open === false; }
  catch (e) { return false; }
})());
check('answering correctly is reported as correct', (() => {
  const right = opts[castle.quiz.correctIndex];
  if (!right) return false;
  right.click();
  return quizBlock.querySelector('.quiz__feedback').textContent === 'Правільна!';
})(), quizBlock.querySelector('.quiz__feedback').textContent);

/* ════════════════════════════════════════════════════════════
   8. The lens view
   ════════════════════════════════════════════════════════════ */
await goto('#/lens');
const lensTitle = await waitFor(() => doc.querySelector('.lens-hero__title'), 'lens hero');
check('the lens view renders its title', lensTitle.textContent === "Ліда ў аб'ектыве", lensTitle.textContent);
/* The gutter container must not own the ornament: `.container` is
   `100% - 2 * gutter` wide, so anything inside it stops short of the screen
   edge. The strip therefore sits beside the container, inside the header. */
const lensOrnament = doc.querySelector('.lens-hero .ornament');
check('the lens ornament is not trapped in the gutter container',
  !!lensOrnament && lensOrnament.parentElement.classList.contains('lens-hero') &&
  lensOrnament.parentElement.parentElement.classList.contains('page'),
  lensOrnament ? lensOrnament.parentElement.parentElement.className : 'missing');
check('the lens ornament is marked full-bleed',
  !!lensOrnament && lensOrnament.classList.contains('ornament--bleed'));
check('the lens title keeps its gutters inside the header',
  !!doc.querySelector('.lens-hero > .container > .lens-hero__title'));
check('the lens view explains itself', !!doc.querySelector('.lens-about'));
check('the lens view builds the camera stage',
  !!doc.querySelector('.lens__stage') && !!doc.getElementById('lensVideo'));
check('the viewfinder frame is gone', !doc.querySelector('.lens__viewfinder'));
check('the camera starts off, behind a start button',
  doc.querySelector('.lens-idle__btn').textContent === 'Уключыць камеру');
check('the lens view offers upload and shutter',
  !!doc.querySelector('.lens__tool') && !!doc.querySelector('.shutter') && !doc.querySelector('.lens__auto'));
check('the hint sits above the controls but still in the stage',
  !!doc.querySelector('.lens__stage .lens__hint'));
check('the result sheet is mounted', !!doc.getElementById('lensSheet'));
check('the bottom navigation steps aside for the camera',
  doc.querySelector('.bottomnav').hidden === true);
check('the top bar reports the lens link as active',
  doc.getElementById('navLens').classList.contains('topbar__navlink--active'));

await goto('#/');
check('the bottom navigation comes back on home',
  doc.querySelector('.bottomnav').hidden === false);
check('the share button hides again outside an object view', shareBtn.hidden === true);

/* ════════════════════════════════════════════════════════════
   9. The map view
   ════════════════════════════════════════════════════════════ */
await goto('#/map');
await waitFor(() => doc.querySelector('.mapscreen'), 'map screen');
check('the map view mounts the Leaflet container', !!doc.getElementById('bigMap'));
check('the map view offers a locate button', !!doc.getElementById('locateBtn'));
check('the map view locks the page against scrolling',
  doc.body.classList.contains('route-map') &&
  /body\.route-map\s*\{[^}]*overflow:\s*hidden/.test(styleCss));
check('the map screen is sized to the viewport height',
  /\.mapscreen__map[\s\S]{0,400}?100dvh/.test(styleCss) &&
  /\.page--map\s*\{[^}]*padding-top:\s*0/.test(styleCss));
check('offline, the map degrades to a list of sights',
  !!doc.querySelector('.mapscreen__fallback') &&
  doc.querySelectorAll('#mapFallbackList li').length === sights.be.length,
  String(doc.querySelectorAll('#mapFallbackList li').length));

/* ════════════════════════════════════════════════════════════
   10. Share modal
   ════════════════════════════════════════════════════════════ */
await goto('#/object/sights/lidski-zamak');
await waitFor(() => doc.querySelector('.hero__title'), 'object for sharing');
const urlOnObject = window.location.href;

check('the modal is not in the DOM before the first open', !doc.querySelector('.share-modal'));
shareBtn.click();
await tick(80);
const modal = doc.querySelector('.share-modal');
check('the share button opens the modal', !!modal && !modal.hidden);
check('the share button is marked expanded', shareBtn.getAttribute('aria-expanded') === 'true');
check('the page behind the modal is scroll-locked', doc.body.classList.contains('share-open'));

const dialog = modal.querySelector('.share-modal__dialog');
check('the modal is a dialog',
  dialog.getAttribute('role') === 'dialog' && dialog.getAttribute('aria-modal') === 'true');
check('focus moves into the modal', doc.activeElement === modal.querySelector('.share-modal__close'));

const qrSvgEl = modal.querySelector('.share-modal__qr svg');
check('the modal shows a QR code',
  !!qrSvgEl && (qrSvgEl.querySelector('path').getAttribute('d') || '').length > 500,
  qrSvgEl && qrSvgEl.getAttribute('viewBox'));
check('the QR svg is scalable and announced as an image',
  qrSvgEl && !qrSvgEl.getAttribute('width') && qrSvgEl.getAttribute('role') === 'img');
check('the modal carries a QR caption', !!modal.querySelector('.share-modal__hint'));

const dialogOrder = [...dialog.children].map((el) => el.className);
check('the QR comes before its divider',
  dialogOrder.indexOf('share-modal__qr') < dialogOrder.indexOf('share-modal__divider'));
check('the divider comes before the "share to" label',
  dialogOrder.indexOf('share-modal__divider') < dialogOrder.indexOf('share-modal__label'));
check('the copy-link button is the last block',
  dialogOrder[dialogOrder.length - 1] === 'share-modal__copy', dialogOrder.join('|'));

const socials = [...modal.querySelectorAll('.share-social')];
check('the modal offers the messaging targets', socials.length === 7, String(socials.length));
check('every target is labelled and linked',
  socials.every((s) => (s.querySelector('.share-social__name') || {}).textContent &&
    !!s.getAttribute('href')));
check('the link target for Telegram points at t.me',
  (socials.find((s) => s.querySelector('.share-social__name').textContent === 'Telegram') || {})
    .getAttribute?.('href')?.includes('t.me') === true);

modal.querySelector('.share-modal__copy').click();
await tick(40);
check('copying the link puts the deep link on the clipboard',
  copied[copied.length - 1] === urlOnObject, copied[copied.length - 1]);

/* ════════════════════════════════════════════════════════════
   11. Language switcher and per-locale content
   ════════════════════════════════════════════════════════════ */
await goto('#/');
const langTrigger = doc.querySelector('.lang-switcher__trigger');
check('the switcher is labelled with the current language',
  langTrigger.textContent.trim() === 'Беларуская', langTrigger.textContent.trim());
const langOptions = [...doc.querySelectorAll('.lang-switcher__option')];
check('the switcher offers all three languages', langOptions.length === 3, String(langOptions.length));
check('the current language is marked active',
  langOptions.filter((o) => o.classList.contains('lang-switcher__option--active')).length === 1);

/* Choosing a language stores it and then reloads the page. jsdom cannot
   reload, so the observable half is the stored choice plus the next render. */
check('choosing a language is persisted', (() => {
  const en = langOptions.find((o) => o.textContent.trim() === 'English');
  if (!en) return false;
  en.click();
  return window.localStorage.getItem('lidalens_lang') === 'en';
})(), window.localStorage.getItem('lidalens_lang'));

await goto('#/');
check('the app re-renders in the chosen language',
  doc.documentElement.lang === 'en' && doc.querySelector('.home-hero__title').textContent.trim() === 'Lida',
  doc.documentElement.lang + ' / ' + (doc.querySelector('.home-hero__title') || {}).textContent);

/* Recordings are per language: Russian ships only the castle, so a sight that
   has a Belarusian take but no Russian one must build no player at all. */
vm.runInContext("I18N.set('ru')", ctx, { filename: 'set-lang.js' });
await goto('#/object/sights/kamandzirovaczny');
await waitFor(() => doc.querySelector('.hero__title'), 'sight without a Russian recording');
check('a sight with no recording in this language builds a hidden player',
  !!doc.querySelector('.audio-player') && doc.querySelector('.audio-player').hidden === true);
await goto('#/object/sights/lidski-zamak');
await waitFor(() => doc.querySelector('.hero__title'), 'sight with a Russian recording');
check('a sight with a recording in this language builds a visible player',
  !!doc.querySelector('.audio-player') && doc.querySelector('.audio-player').hidden === false);

/* ════════════════════════════════════════════════════════════
   Summary
   ════════════════════════════════════════════════════════════ */
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) console.log(`${failures} FAILED`);
process.exitCode = failures ? 1 : 0;
