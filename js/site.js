(function () {
  const DATA_URL = 'data/notes.json';
  const SITE_URL = 'https://diallop96.github.io/micro-noticias/';
  const SITE_NAME = 'Micro Noticias';

  const CATEGORY_ICONS = {
    'Microeconomía': '📊',
    'Comercio Exterior': '🚢',
    'Aranceles': '📦',
    'Mercado Local': '🏪',
    'Análisis': '🔎'
  };

  const SHARE_ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.19-.24-.58-.49-.5-.67-.5-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z"/><path d="M12.02 2C6.5 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.33A9.94 9.94 0 0012.02 22C17.53 22 22 17.52 22 12S17.53 2 12.02 2zm0 18.15c-1.7 0-3.28-.5-4.61-1.36l-.33-.2-3.01.79.8-2.94-.21-.34a8.13 8.13 0 01-1.26-4.4c0-4.51 3.68-8.19 8.2-8.19 4.5 0 8.19 3.67 8.19 8.19 0 4.51-3.68 8.19-8.19 8.19z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8.5h2.85l.43-3.31H13.5V8.05c0-.96.27-1.61 1.64-1.61h1.75V3.48A23.6 23.6 0 0014.6 3.3c-2.6 0-4.38 1.59-4.38 4.5v2.39H7.35v3.31H10.22V22h3.28z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 3h3.11l-6.8 7.77L22.5 21h-6.26l-4.9-6.41L5.7 21H2.58l7.28-8.31L2 3h6.42l4.43 5.86L18.24 3zm-1.09 16.17h1.73L7.94 4.74H6.08l11.07 14.43z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3.5 8.98h3v11.52h-3V8.98zm6.02 0h2.88v1.58h.04c.4-.75 1.38-1.55 2.84-1.55 3.03 0 3.6 2 3.6 4.58v6.91h-3v-6.12c0-1.46-.03-3.34-2.04-3.34-2.04 0-2.35 1.6-2.35 3.24v6.22h-3V8.98z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07l1.49-1.49"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>'
  };

  function shareLinks(title, url) {
    const t = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    return {
      whatsapp: 'https://wa.me/?text=' + t + '%20-%20' + u,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
      x: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u,
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u
    };
  }

  function shareBarHtml(title, url, variant) {
    const links = shareLinks(title, url);
    const cls = variant === 'top' ? 'share-bar share-bar--top' : 'share-bar';
    return (
      '<div class="' + cls + '">' +
        (variant === 'top' ? '<span class="share-bar__label">Compartir</span>' : '') +
        '<a class="share-btn whatsapp" href="' + links.whatsapp + '" target="_blank" rel="noopener noreferrer" aria-label="Compartir por WhatsApp">' + SHARE_ICONS.whatsapp + '</a>' +
        '<a class="share-btn facebook" href="' + links.facebook + '" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">' + SHARE_ICONS.facebook + '</a>' +
        '<a class="share-btn x" href="' + links.x + '" target="_blank" rel="noopener noreferrer" aria-label="Compartir en X">' + SHARE_ICONS.x + '</a>' +
        '<a class="share-btn linkedin" href="' + links.linkedin + '" target="_blank" rel="noopener noreferrer" aria-label="Compartir en LinkedIn">' + SHARE_ICONS.linkedin + '</a>' +
        '<button type="button" class="share-btn copy-link" data-share-url="' + url + '" aria-label="Copiar enlace">' + SHARE_ICONS.link + '</button>' +
      '</div>'
    );
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function esc(s) {
    return window.MicroNoticias.escapeHtml(String(s == null ? '' : s));
  }

  async function fetchNotes() {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar data/notes.json (' + res.status + ')');
    const data = await res.json();
    return Array.isArray(data.notes) ? data.notes : [];
  }

  function publishedSorted(notes) {
    return notes
      .filter(n => n.status === 'published' && n.publishedAt)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  function noteCardHtml(note) {
    const img = note.coverImage
      ? '<img src="' + esc(note.coverImage) + '" alt="' + esc(note.title) + '" loading="lazy">'
      : '';
    return (
      '<a class="note-card" href="nota.html?slug=' + encodeURIComponent(note.slug) + '">' +
        '<div class="note-card__media">' + img + '</div>' +
        '<div class="note-card__body">' +
          '<span class="badge">' + (CATEGORY_ICONS[note.category] || '📰') + ' ' + esc(note.category) + '</span>' +
          '<h3 class="note-card__title">' + esc(note.title) + '</h3>' +
          '<p class="note-card__excerpt">' + esc(note.excerpt) + '</p>' +
          '<div class="meta-line"><span>' + formatDate(note.publishedAt) + '</span><span class="dot"></span><span>' + (note.readMinutes || 4) + ' min de lectura</span></div>' +
        '</div>' +
      '</a>'
    );
  }

  function featuredHtml(note) {
    const img = note.coverImage
      ? '<img src="' + esc(note.coverImage) + '" alt="' + esc(note.title) + '">'
      : '';
    return (
      '<div class="featured__media">' + img + '</div>' +
      '<div>' +
        '<span class="badge">' + (CATEGORY_ICONS[note.category] || '📰') + ' ' + esc(note.category) + '</span>' +
        '<a class="featured__title-link" href="nota.html?slug=' + encodeURIComponent(note.slug) + '">' +
          '<h2 class="featured__title">' + esc(note.title) + '</h2>' +
        '</a>' +
        '<p class="featured__excerpt">' + esc(note.excerpt) + '</p>' +
        '<a class="btn" href="nota.html?slug=' + encodeURIComponent(note.slug) + '">Leer nota completa ' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '</a>' +
        '<div class="meta-line"><span>' + esc(note.author || 'Redacción') + '</span><span class="dot"></span><span>' + formatDate(note.publishedAt) + '</span></div>' +
      '</div>'
    );
  }

  async function initHome() {
    const featuredEl = document.getElementById('featured');
    const gridEl = document.getElementById('note-grid');
    const filtersEl = document.getElementById('filters');
    if (!gridEl) return;

    let notes;
    try {
      notes = publishedSorted(await fetchNotes());
    } catch (err) {
      gridEl.innerHTML = '';
      gridEl.appendChild(el('div', 'empty-state', '<h3>No pudimos cargar las notas</h3><p>' + esc(err.message) + '</p>'));
      return;
    }

    if (notes.length === 0) {
      if (featuredEl) featuredEl.style.display = 'none';
      const sectionHead = document.querySelector('.section-head');
      if (sectionHead) sectionHead.style.display = 'none';
      gridEl.innerHTML = '';
      gridEl.appendChild(el('div', 'empty-state',
        '<h3>Todavía no hay notas publicadas</h3><p>Publicá tu primera nota desde el panel de administración local (<code>/admin</code>).</p>'));
      return;
    }

    const [featured, ...rest] = notes;
    if (featuredEl) featuredEl.innerHTML = featuredHtml(featured);
    if (featured.coverImage) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      const twImg = document.querySelector('meta[name="twitter:image"]');
      if (ogImg) ogImg.setAttribute('content', featured.coverImage);
      if (twImg) twImg.setAttribute('content', featured.coverImage);
    }

    const categories = Array.from(new Set(notes.map(n => n.category))).sort();
    if (filtersEl && categories.length > 1) {
      filtersEl.innerHTML = '<button class="filter-chip active" data-cat="all">Todas</button>' +
        categories.map(c => '<button class="filter-chip" data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('');
    }

    function renderGrid(list, filtered) {
      if (list.length) {
        gridEl.innerHTML = list.map(noteCardHtml).join('');
      } else if (filtered) {
        gridEl.innerHTML = '<div class="empty-state"><h3>Sin resultados</h3><p>No hay notas en esta categoría todavía.</p></div>';
      } else {
        gridEl.innerHTML = '<div class="empty-state"><h3>Muy pronto, más notas</h3><p>Por ahora esta es la única nota publicada.</p></div>';
      }
    }

    renderGrid(rest, false);

    if (filtersEl) {
      filtersEl.addEventListener('click', function (e) {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        filtersEl.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        renderGrid(cat === 'all' ? rest : rest.filter(n => n.category === cat), cat !== 'all');
      });
    }
  }

  async function initArticle() {
    const root = document.getElementById('article-root');
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');

    let notes;
    try {
      notes = await fetchNotes();
    } catch (err) {
      root.innerHTML = '<div class="empty-state"><h3>No pudimos cargar la nota</h3><p>' + esc(err.message) + '</p></div>';
      return;
    }

    const note = notes.find(n => n.slug === slug && n.status === 'published');
    if (!note) {
      document.title = 'Nota no encontrada — Micro Noticias';
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.setAttribute('content', 'noindex, follow');
      root.innerHTML =
        '<div class="empty-state"><h3>No encontramos esta nota</h3>' +
        '<p>Puede que todavía esté en borrador o que el enlace sea incorrecto.</p>' +
        '<p><a class="btn" href="index.html">Volver al inicio</a></p></div>';
      return;
    }

    const pageTitle = note.title + ' — Micro Noticias';
    const articleUrl = SITE_URL + 'nota.html?slug=' + encodeURIComponent(note.slug);
    document.title = pageTitle;

    function setMeta(selector, attr, value) {
      const node = document.querySelector(selector);
      if (node) node.setAttribute(attr, value);
    }
    setMeta('meta[name="description"]', 'content', note.excerpt || '');
    setMeta('#canonical-link', 'href', articleUrl);
    setMeta('#og-title', 'content', pageTitle);
    setMeta('#og-description', 'content', note.excerpt || '');
    setMeta('#og-url', 'content', articleUrl);
    setMeta('#twitter-title', 'content', pageTitle);
    setMeta('#twitter-description', 'content', note.excerpt || '');
    if (note.coverImage) {
      setMeta('#og-image', 'content', note.coverImage);
      setMeta('#twitter-image', 'content', note.coverImage);
    }

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: note.title,
      description: note.excerpt,
      image: note.coverImage ? [note.coverImage] : undefined,
      datePublished: note.publishedAt,
      dateModified: note.updatedAt || note.publishedAt,
      articleSection: note.category,
      inLanguage: 'es',
      author: { '@type': 'Organization', name: note.author || SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
      url: articleUrl
    });
    document.head.appendChild(ld);

    const img = note.coverImage
      ? '<div class="article__media"><img src="' + esc(note.coverImage) + '" alt="' + esc(note.title) + '"></div>'
      : '';

    root.innerHTML =
      '<div class="article__eyebrow"><span class="badge">' + (CATEGORY_ICONS[note.category] || '📰') + ' ' + esc(note.category) + '</span></div>' +
      '<h1 class="article__title">' + esc(note.title) + '</h1>' +
      '<p class="article__excerpt">' + esc(note.excerpt) + '</p>' +
      '<div class="meta-line"><span>' + esc(note.author || 'Redacción') + '</span><span class="dot"></span><span>' + formatDate(note.publishedAt) + '</span><span class="dot"></span><span>' + (note.readMinutes || 4) + ' min de lectura</span></div>' +
      shareBarHtml(note.title, articleUrl, 'top') +
      img +
      '<div class="article__body">' + window.MicroNoticias.renderMarkdown(note.body || '') + '</div>' +
      '<div class="share-card">' +
        '<div><p class="share-card__title">¿Te resultó útil esta nota?</p><p class="share-card__subtitle">Compartila para que le llegue a más gente.</p></div>' +
        shareBarHtml(note.title, articleUrl, 'bottom') +
      '</div>' +
      '<hr class="article__divider">' +
      '<p><a class="btn" href="index.html">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 18l-6-6 6-6"/></svg> Volver a todas las notas</a></p>';

    root.querySelectorAll('.copy-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyToClipboard(btn.getAttribute('data-share-url')).then(function () {
          const original = btn.innerHTML;
          btn.innerHTML = SHARE_ICONS.check;
          btn.classList.add('copied');
          btn.setAttribute('aria-label', 'Enlace copiado');
          setTimeout(function () {
            btn.innerHTML = original;
            btn.classList.remove('copied');
            btn.setAttribute('aria-label', 'Copiar enlace');
          }, 2000);
        });
      });
    });
  }

  function fallbackCopy(text) {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.style.position = 'fixed';
    tmp.style.opacity = '0';
    document.body.appendChild(tmp);
    tmp.select();
    try { document.execCommand('copy'); } catch (e) { /* sin soporte, no hay más fallback posible */ }
    document.body.removeChild(tmp);
  }

  // Nunca deja al botón "colgado": si el navegador tarda o no resuelve
  // navigator.clipboard.writeText (puede pasar sin un gesto de usuario
  // real), a los 800ms se resuelve igual usando el copiado clásico.
  function copyToClipboard(text) {
    return new Promise(function (resolve) {
      let done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(finish).catch(function () {
          fallbackCopy(text);
          finish();
        });
        setTimeout(finish, 800);
      } else {
        fallbackCopy(text);
        finish();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHome();
    initArticle();
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
