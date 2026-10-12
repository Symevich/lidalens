/* ============================================================
   i18n.js — моўны слоўнік LidaLens
   Падтрымліваюцца: 'be' (Беларуская), 'ru' (Русский), 'en' (English)

   Усе тэксты інтэрфейсу жывуць тут. У HTML/JS не павінна быць
   зашытых надпісаў — толькі выклікі I18N.t('ключ').
   ============================================================ */

const I18N = (() => {
  const STORAGE_KEY = 'lidalens_lang';
  const SUPPORTED   = ['be', 'ru', 'en'];
  const DEFAULT     = 'be';

  const STRINGS = {
    /* ─────────────────────────── БЕЛАРУСКАЯ ─────────────────────────── */
    be: {
      appTitle:          'Аўдыёгід па горадзе Ліда',
      sights:            'Славутасці',
      sightsTitle:       'Славутасці Ліды',
      back:              'Назад',
      loading:           'Загрузка дадзеных…',
      loadingObj:        'Загрузка матэрыялу…',
      errorLoad:         'Не ўдалося загрузіць дадзеныя. Паспрабуйце абнавіць старонку.',
      errorObj:          'Памылка загрузкі дадзеных. Паспрабуйце пазней.',
      errorNotFound:     "Славутасць не знойдзена.",
      errorGoHome:       'Вярнуцца на галоўную',
      empty:             'Тут пакуль няма матэрыялаў.',
      noDesc:            '<p>Апісанне адсутнічае.</p>',
      noTitle:           'Без назвы',
      audioNotSupported: 'Ваш браузер не падтрымлівае аўдыёэлемент.',
      pageTitle:         '| LidaLens',
      retry:             'Паўтарыць',
      brand:             'LidaGid',

      /* ── Навігацыя ── */
      navSights:         'Славутасці',
      navLens:           "Ліда ў аб'ектыве",
      navMap:            'Карта',

      /* ── Галоўная ── */
      homeEyebrow:       'Аўдыёгід па горадзе',
      homeTitle:         'Ліда',
      featuredBadge:     'Візітоўка Ліды',
      homeMapTitle:      'Ліда на карце',
      openBigMap:        'Адкрыць вялікую карту',

      /* ── Старонка аб'екта ── */
      nextSight:         'Наступная славутасць',
      prevSight:         'Папярэдняя славутасць',
      howToGet:          'Як дабрацца',
      findByCamera:      "Пазнаць гэты аб'ект камерай",
      audioPlay:         'Прайграць',
      audioPause:        'Пауза',
      audioBack15:       'Назад на 15 секунд',
      audioFwd15:        'Наперад на 15 секунд',
      audioSpeed:        'Хуткасць',
      galleryCounter:    'Фота {n} з {total}',

      /* ── Квіз ── */
      quizTitle:         'Праверце сябе',
      quizCorrect:       'Правільна!',
      quizWrong:         'Няправільна.',
      quizAnswer:        'Правільны адказ: {answer}',

      /* ── Галерэя ── */
      galleryLabel:      'Фотаздымкі: {total}',
      galleryAlt:        '{title} — фота {n} з {total}',
      galleryGoTo:       'Паказаць фота {n} з {total}',
      galleryPrev:       'Папярэдняе фота',
      galleryNext:       'Наступнае фота',

      /* ── Падзяліцца ── */
      share:             'Падзяліцца',
      shareAria:         'Падзяліцца спасылкай на гэтую старонку',
      shareTo:           'Падзяліцца ў…',
      shareToNetwork:    'Падзяліцца ў {network}',
      shareCopyLink:     'Скапіяваць спасылку',
      shareMore:         'Яшчэ…',
      shareClose:        'Зачыніць акно',
      qrAlt:             'QR-код са спасылкай на гэтую старонку',
      qrTitle:           'Спасылка на старонку',
      qrHint:            'Навядзіце камеру тэлефона на код, каб адкрыць старонку',
      qrUnavailable:     'Не ўдалося згенераваць QR-код.',
      linkCopied:        'Спасылка скапіравана',
      shareFailed:       'Не ўдалося скапіяваць спасылку',

      /* ── Фіча «Ліда ў аб'ектыве» ── */
      lens:              "Ліда ў аб'ектыве",
      lensTitle:         "Ліда ў аб'ектыве",
      lensIntro:         "Навядзіце камеру на славутасць — нейрасетка пазнае яе і пакажа артыкул з даведніка.",
      lensTeaserDesc:    'Нейрасетка пазнае славутасць па камеры.',
      lensIdleText:      'Уключыце камеру або загрузіце фота славутасці, каб пазнаць яе.',
      lensStart:         'Уключыць камеру',
      lensStop:          'Выключыць камеру',
      lensShot:          'Распазнаць',
      lensUpload:        'Загрузіць фота',
      lensHint:          'Навядзіце камеру на славутасць',
      lensLoading:       'Распазнаю…',
      lensRecognized:    'Пазнана',
      lensUnknown:       'Не ўдалося пазнаць',
      lensOpen:          'Адкрыць артыкул',
      lensUnknownHint:   'Паспрабуйце наблізіцца або зняць славутасць з іншага ракурсу.',
      lensNearest:       'Найбліжэйшыя варыянты',
      lensConfidence:    'Упэўненасць',
      lensRetry:         'Паспрабаваць зноў',
      lensTipsTitle:     'Парады',
      lensTip1:          'Наблізцеся да славутасці',
      lensTip2:          'Трымайце ў кадры адзін аб\'ект',
      lensTip3:          'Пры добрым святле атрымліваецца лепш',
      lensCameraError:   'Не атрымалася ўключыць камеру. Скарыстайцеся загрузкай фота.',
      lensDenied:        'Доступ да камеры забаронены. Дазвольце яго ў наладах браўзера.',
      lensInsecure:      'Камера даступная толькі праз https або localhost. Запусціце праграму праз run.bat.',
      lensOffline:       'Сэрвіс распазнавання недаступны. Запусціце праграму праз run.bat.',

      /* ── Карта ── */
      mapTitle:          'Славутасці на карце',
      mapMyLocation:     'Маё месцазнаходжанне',
      mapOffline:        'Карта недаступная без інтэрнэту',
      mapLocateError:    'Не ўдалося вызначыць месцазнаходжанне',
      mapOpen:           'Адкрыць',
    },

    /* ─────────────────────────── РУСКАЯ ─────────────────────────── */
    ru: {
      appTitle:          'Аудиогид по городу Лида',
      sights:            'Достопримечательности',
      sightsTitle:       'Достопримечательности Лиды',
      back:              'Назад',
      loading:           'Загрузка данных…',
      loadingObj:        'Загрузка материала…',
      errorLoad:         'Не удалось загрузить данные. Попробуйте обновить страницу.',
      errorObj:          'Ошибка загрузки данных. Попробуйте позже.',
      errorNotFound:     'Достопримечательность не найдена.',
      errorGoHome:       'Вернуться на главную',
      empty:             'В этом разделе пока нет материалов.',
      noDesc:            '<p>Описание отсутствует.</p>',
      noTitle:           'Без названия',
      audioNotSupported: 'Ваш браузер не поддерживает аудиоэлемент.',
      pageTitle:         '| LidaLens',
      retry:             'Повторить',
      brand:             'LidaGid',

      navSights:         'Достопримечательности',
      navLens:           'Лида в объективе',
      navMap:            'Карта',

      homeEyebrow:       'Аудиогид по городу',
      homeTitle:         'Лида',
      featuredBadge:     'Визитка Лиды',
      homeMapTitle:      'Лида на карте',
      openBigMap:        'Открыть большую карту',

      nextSight:         'Следующая достопримечательность',
      prevSight:         'Предыдущая достопримечательность',
      howToGet:          'Как добраться',
      findByCamera:      'Узнать этот объект камерой',
      audioPlay:         'Играть',
      audioPause:        'Пауза',
      audioBack15:       'Назад на 15 секунд',
      audioFwd15:        'Вперёд на 15 секунд',
      audioSpeed:        'Скорость',
      galleryCounter:    'Фото {n} из {total}',

      quizTitle:         'Проверьте себя',
      quizCorrect:       'Правильно!',
      quizWrong:         'Неправильно.',
      quizAnswer:        'Правильный ответ: {answer}',

      galleryLabel:      'Фотографии: {total}',
      galleryAlt:        '{title} — фото {n} из {total}',
      galleryGoTo:       'Показать фото {n} из {total}',
      galleryPrev:       'Предыдущее фото',
      galleryNext:       'Следующее фото',

      share:             'Поделиться',
      shareAria:         'Поделиться ссылкой на эту страницу',
      shareTo:           'Поделиться в…',
      shareToNetwork:    'Поделиться в {network}',
      shareCopyLink:     'Скопировать ссылку',
      shareMore:         'Ещё…',
      shareClose:        'Закрыть окно',
      qrAlt:             'QR-код со ссылкой на эту страницу',
      qrTitle:           'Ссылка на страницу',
      qrHint:            'Наведите камеру телефона на код, чтобы открыть страницу',
      qrUnavailable:     'Не удалось сгенерировать QR-код.',
      linkCopied:        'Ссылка скопирована',
      shareFailed:       'Не удалось скопировать ссылку',

      lens:              'Лида в объективе',
      lensTitle:         'Лида в объективе',
      lensIntro:         'Наведите камеру на достопримечательность — нейросеть узнает её и покажет статью из справочника.',
      lensTeaserDesc:    'Нейросеть узнаёт достопримечательность по камере.',
      lensIdleText:      'Включите камеру или загрузите фото достопримечательности, чтобы её узнать.',
      lensStart:         'Включить камеру',
      lensStop:          'Выключить камеру',
      lensShot:          'Распознать',
      lensUpload:        'Загрузить фото',
      lensHint:          'Наведите камеру на достопримечательность',
      lensLoading:       'Распознаю…',
      lensRecognized:    'Узнано',
      lensUnknown:       'Не удалось узнать',
      lensOpen:          'Открыть артикул',
      lensUnknownHint:   'Попробуйте подойти ближе или снять достопримечательность с другого ракурса.',
      lensNearest:       'Ближайшие варианты',
      lensConfidence:    'Уверенность',
      lensRetry:         'Попробовать снова',
      lensTipsTitle:     'Советы',
      lensTip1:          'Подойдите ближе к достопримечательности',
      lensTip2:          'Держите в кадре один объект',
      lensTip3:          'При хорошем свете получается лучше',
      lensCameraError:   'Не удалось включить камеру. Воспользуйтесь загрузкой фото.',
      lensDenied:        'Доступ к камере запрещён. Разрешите его в настройках браузера.',
      lensInsecure:      'Камера доступна только через https или localhost. Запустите программу через run.bat.',
      lensOffline:       'Сервис распознавания недоступен. Запустите программу через run.bat.',

      mapTitle:          'Достопримечательности на карте',
      mapMyLocation:     'Моё местоположение',
      mapOffline:        'Карта недоступна без интернета',
      mapLocateError:    'Не удалось определить местоположение',
      mapOpen:           'Открыть',
    },

    /* ─────────────────────────── ENGLISH ─────────────────────────── */
    en: {
      appTitle:          'Audio Guide to the City of Lida',
      sights:            'Sights',
      sightsTitle:       'Sights of Lida',
      back:              'Back',
      loading:           'Loading data…',
      loadingObj:        'Loading content…',
      errorLoad:         'Failed to load data. Please refresh the page.',
      errorObj:          'Error loading data. Please try again later.',
      errorNotFound:     'Sight not found.',
      errorGoHome:       'Return to Home',
      empty:             'No content in this section yet.',
      noDesc:            '<p>No description available.</p>',
      noTitle:           'Untitled',
      audioNotSupported: 'Your browser does not support the audio element.',
      pageTitle:         '| LidaLens',
      retry:             'Retry',
      brand:             'LidaGid',

      navSights:         'Sights',
      navLens:           'Lida in the Lens',
      navMap:            'Map',

      homeEyebrow:       'Audio guide to the city',
      homeTitle:         'Lida',
      featuredBadge:     'Lida\'s landmark',
      homeMapTitle:      'Lida on the map',
      openBigMap:        'Open the big map',

      nextSight:         'Next sight',
      prevSight:         'Previous sight',
      howToGet:          'How to get there',
      findByCamera:      'Identify this place with the camera',
      audioPlay:         'Play',
      audioPause:        'Pause',
      audioBack15:       'Back 15 seconds',
      audioFwd15:        'Forward 15 seconds',
      audioSpeed:        'Speed',
      galleryCounter:    'Photo {n} of {total}',

      quizTitle:         'Test yourself',
      quizCorrect:       'Correct!',
      quizWrong:         'Not quite.',
      quizAnswer:        'The correct answer is: {answer}',

      galleryLabel:      'Photographs: {total}',
      galleryAlt:        '{title} — photo {n} of {total}',
      galleryGoTo:       'Show photo {n} of {total}',
      galleryPrev:       'Previous photo',
      galleryNext:       'Next photo',

      share:             'Share',
      shareAria:         'Share a link to this page',
      shareTo:           'Share to…',
      shareToNetwork:    'Share to {network}',
      shareCopyLink:     'Copy link',
      shareMore:         'More…',
      shareClose:        'Close the window',
      qrAlt:             'QR code with the link to this page',
      qrTitle:           'Link to the page',
      qrHint:            'Point your phone camera at the code to open this page',
      qrUnavailable:     'Could not generate the QR code.',
      linkCopied:        'Link copied',
      shareFailed:       'Could not copy the link',

      lens:              'Lida in the Lens',
      lensTitle:         'Lida in the Lens',
      lensIntro:         'Point the camera at a sight — the neural network recognises it and opens its guide article.',
      lensTeaserDesc:    'The neural network recognises a sight from the camera.',
      lensIdleText:      'Start the camera or upload a photo of a sight to recognise it.',
      lensStart:         'Start camera',
      lensStop:          'Stop camera',
      lensShot:          'Recognise',
      lensUpload:        'Upload a photo',
      lensHint:          'Point the camera at a sight',
      lensLoading:       'Recognising…',
      lensRecognized:    'Recognised',
      lensUnknown:       'Could not recognise',
      lensOpen:          'Open in the guide',
      lensUnknownHint:   'Try moving closer or shooting the sight from another angle.',
      lensNearest:       'Closest matches',
      lensConfidence:    'Confidence',
      lensRetry:         'Try again',
      lensTipsTitle:     'Tips',
      lensTip1:          'Move closer to the sight',
      lensTip2:          'Keep a single object in the frame',
      lensTip3:          'Good light gives better results',
      lensCameraError:   'Could not start the camera. Please upload a photo instead.',
      lensDenied:        'Camera access is blocked. Allow it in your browser settings.',
      lensInsecure:      'The camera works only over https or localhost. Start the app via run.bat.',
      lensOffline:       'The recognition service is unavailable. Start the app via run.bat.',

      mapTitle:          'Sights on the map',
      mapMyLocation:     'My location',
      mapOffline:        'The map is unavailable offline',
      mapLocateError:    'Could not determine your location',
      mapOpen:           'Open',
    },
  };

  const LABELS = { be: 'Беларуская', ru: 'Русский', en: 'English' };

  function get() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.includes(s) ? s : DEFAULT;
    } catch (e) { return DEFAULT; }
  }

  function set(lang) {
    if (!SUPPORTED.includes(lang)) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function t(key, vars) {
    const lang  = get();
    const value = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS[DEFAULT][key] || key;
    if (!vars) return value;
    /* {name}-падстаноўкі, напр. t('galleryAlt', { title, n: 2, total: 5 }) */
    return String(value).replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
    );
  }

  function dataFile(source) {
    const lang = get();
    return lang === 'be' ? `${source}.json` : `${source}.${lang}.json`;
  }

  /* ── Пераключальнік мовы ──
     Вяртае гатовы элемент; устаўляе яго ў панэль сам app.js. */
  function renderToggle() {
    const current = get();

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';

    wrapper.innerHTML = `
      <button class="lang-switcher__trigger"
              id="langTrigger"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-label="Select language / Выбар мовы">
        <svg class="lang-switcher__globe" width="16" height="16" viewBox="0 0 16 16"
             fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
          <ellipse cx="8" cy="8" rx="3" ry="7" stroke="currentColor" stroke-width="1.4"/>
          <line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" stroke-width="1.4"/>
          <line x1="1" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        <span class="lang-switcher__label">${LABELS[current]}</span>
        <svg class="lang-switcher__caret" width="10" height="10" viewBox="0 0 10 10"
             fill="none" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <ul class="lang-switcher__dropdown" id="langDropdown"
          role="listbox" aria-label="Select language" aria-hidden="true">
        ${SUPPORTED.map(lang => `
          <li class="lang-switcher__option${lang === current ? ' lang-switcher__option--active' : ''}"
              role="option" aria-selected="${lang === current}"
              tabindex="-1" data-lang="${lang}">
            ${LABELS[lang]}
          </li>`).join('')}
      </ul>
    `;

    const trigger  = wrapper.querySelector('#langTrigger');
    const dropdown = wrapper.querySelector('#langDropdown');
    const options  = Array.from(dropdown.querySelectorAll('.lang-switcher__option'));

    const open = () => {
      dropdown.classList.add('lang-switcher__dropdown--open');
      dropdown.setAttribute('aria-hidden', 'false');
      wrapper.classList.add('lang-switcher--open');
      trigger.setAttribute('aria-expanded', 'true');
      (dropdown.querySelector('.lang-switcher__option--active') || options[0]).focus();
    };
    const close = () => {
      dropdown.classList.remove('lang-switcher__dropdown--open');
      dropdown.setAttribute('aria-hidden', 'true');
      wrapper.classList.remove('lang-switcher--open');
      trigger.setAttribute('aria-expanded', 'false');
    };
    const pick = (lang) => {
      if (lang !== current) { set(lang); location.reload(); }
      close();
    };

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.contains('lang-switcher__dropdown--open') ? close() : open();
    });

    dropdown.addEventListener('keydown', e => {
      const i = options.indexOf(document.activeElement);
      if      (e.key === 'ArrowDown') { e.preventDefault(); options[(i + 1) % options.length].focus(); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); options[(i - 1 + options.length) % options.length].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (document.activeElement.dataset.lang) pick(document.activeElement.dataset.lang); }
      else if (e.key === 'Escape')    { close(); trigger.focus(); }
    });

    trigger.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    options.forEach(o => o.addEventListener('click', () => pick(o.dataset.lang)));
    document.addEventListener('click', close);

    return wrapper;
  }

  return { get, set, t, dataFile, renderToggle };
})();
