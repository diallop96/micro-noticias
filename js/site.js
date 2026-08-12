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
      img +
      '<div class="article__body">' + window.MicroNoticias.renderMarkdown(note.body || '') + '</div>' +
      '<hr class="article__divider">' +
      '<p><a class="btn" href="index.html">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 18l-6-6 6-6"/></svg> Volver a todas las notas</a></p>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHome();
    initArticle();
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
