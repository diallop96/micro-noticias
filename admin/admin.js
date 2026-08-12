(function () {
  const PIN_KEY = 'mn-admin-pin';

  const CATEGORY_ICONS = {
    'Microeconomía': '📊',
    'Comercio Exterior': '🚢',
    'Aranceles': '📦',
    'Mercado Local': '🏪',
    'Análisis': '🔎'
  };

  const els = {
    loginScreen: document.getElementById('login-screen'),
    loginForm: document.getElementById('login-form'),
    pinInput: document.getElementById('pin-input'),
    loginError: document.getElementById('login-error'),
    adminMain: document.getElementById('admin-main'),
    logoutBtn: document.getElementById('btn-logout'),
    noteList: document.getElementById('note-list'),
    statusTabs: document.querySelector('.status-tabs'),
    newBtn: document.getElementById('btn-new'),
    form: document.getElementById('note-form'),
    formMsg: document.getElementById('form-msg'),
    id: document.getElementById('note-id'),
    title: document.getElementById('f-title'),
    category: document.getElementById('f-category'),
    author: document.getElementById('f-author'),
    excerpt: document.getElementById('f-excerpt'),
    cover: document.getElementById('f-cover'),
    read: document.getElementById('f-read'),
    body: document.getElementById('f-body'),
    excerptCount: document.getElementById('excerpt-count'),
    bodyCount: document.getElementById('body-count'),
    saveBtn: document.getElementById('btn-save'),
    publishBtn: document.getElementById('btn-publish'),
    unpublishBtn: document.getElementById('btn-unpublish'),
    deleteBtn: document.getElementById('btn-delete'),
    pvBadge: document.getElementById('pv-badge'),
    pvTitle: document.getElementById('pv-title'),
    pvExcerpt: document.getElementById('pv-excerpt'),
    pvAuthor: document.getElementById('pv-author'),
    pvRead: document.getElementById('pv-read'),
    pvMedia: document.getElementById('pv-media'),
    pvImg: document.getElementById('pv-img'),
    pvBody: document.getElementById('pv-body')
  };

  let notes = [];
  let statusFilter = 'all';
  let currentId = null;

  function getPin() {
    try { return sessionStorage.getItem(PIN_KEY) || ''; } catch (e) { return ''; }
  }
  function setPin(pin) {
    try { sessionStorage.setItem(PIN_KEY, pin); } catch (e) { /* ignore */ }
  }
  function clearPin() {
    try { sessionStorage.removeItem(PIN_KEY); } catch (e) { /* ignore */ }
  }

  async function api(path, opts) {
    opts = opts || {};
    const pinAtCallTime = getPin();
    const headers = Object.assign({ 'Content-Type': 'application/json', 'X-Admin-Pin': pinAtCallTime }, opts.headers || {});
    let res;
    try {
      res = await fetch(path, Object.assign({}, opts, { headers }));
    } catch (e) {
      throw new Error('No se pudo conectar con el servidor local. ¿Está corriendo "node server/admin-server.js"?');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* respuesta vacía */ }
    if (res.status === 401) {
      // Solo cerrar sesión si el PIN que falló sigue siendo el activo: evita
      // que una revalidación vieja (ej. el chequeo automático de boot()) se
      // resuelva tarde y pise un login nuevo y válido hecho mientras tanto.
      if (getPin() === pinAtCallTime) {
        clearPin();
        showLogin('Tu sesión expiró o el PIN es inválido. Ingresá de nuevo.');
      }
      throw new Error('No autorizado');
    }
    if (!res.ok) throw new Error((data && data.error) || ('Error ' + res.status));
    return data;
  }

  function showLogin(msg) {
    els.loginScreen.style.display = 'flex';
    els.adminMain.style.display = 'none';
    els.logoutBtn.style.display = 'none';
    els.loginError.textContent = msg || '';
    // No pisar el campo si el usuario ya está escribiendo ahí: evita que una
    // revalidación silenciosa en segundo plano (boot()) borre lo que tipeó.
    if (document.activeElement !== els.pinInput) {
      els.pinInput.value = '';
      els.pinInput.focus();
    }
  }

  function showDashboard() {
    els.loginScreen.style.display = 'none';
    els.adminMain.style.display = 'grid';
    els.logoutBtn.style.display = 'inline-flex';
  }

  function flash(msg, type) {
    els.formMsg.textContent = msg;
    els.formMsg.className = 'form-msg show ' + type;
    if (type === 'success') setTimeout(() => { els.formMsg.classList.remove('show'); }, 3500);
  }

  // ---------- List rendering ----------

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  function renderList() {
    const filtered = notes
      .filter(n => statusFilter === 'all' || n.status === statusFilter)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (filtered.length === 0) {
      els.noteList.innerHTML = '<p class="empty-notes">No hay notas en esta vista todavía.</p>';
      return;
    }

    els.noteList.innerHTML = filtered.map(n => (
      '<button type="button" class="note-list-item' + (n.id === currentId ? ' active' : '') + '" data-id="' + n.id + '">' +
        '<div class="note-list-item__title">' + window.MicroNoticias.escapeHtml(n.title || '(sin título)') + '</div>' +
        '<div class="note-list-item__meta">' +
          '<span class="' + (n.status === 'published' ? 'dot-published' : 'dot-draft') + '">●</span>' +
          '<span>' + (n.status === 'published' ? 'Publicada' : 'Borrador') + '</span>' +
          '<span>· ' + fmtDate(n.updatedAt) + '</span>' +
        '</div>' +
      '</button>'
    )).join('');
  }

  els.statusTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    statusFilter = btn.dataset.status;
    els.statusTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
  });

  els.noteList.addEventListener('click', (e) => {
    const btn = e.target.closest('.note-list-item');
    if (!btn) return;
    const note = notes.find(n => n.id === btn.dataset.id);
    if (note) loadIntoForm(note);
  });

  // ---------- Form <-> preview ----------

  function loadIntoForm(note) {
    currentId = note ? note.id : null;
    els.id.value = note ? note.id : '';
    els.title.value = note ? note.title : '';
    els.category.value = note ? note.category : 'Microeconomía';
    els.author.value = note ? (note.author || '') : '';
    els.excerpt.value = note ? note.excerpt : '';
    els.cover.value = note ? (note.coverImage || '') : '';
    els.read.value = note && note.readMinutes ? note.readMinutes : '';
    els.body.value = note ? note.body : '';

    const editingExisting = !!currentId;
    els.unpublishBtn.style.display = editingExisting && note.status === 'published' ? 'inline-flex' : 'none';
    els.deleteBtn.style.display = editingExisting ? 'inline-flex' : 'none';
    els.publishBtn.textContent = editingExisting && note.status === 'published' ? 'Actualizar publicación' : 'Aprobar y publicar';
    els.saveBtn.textContent = editingExisting ? 'Guardar cambios' : 'Guardar borrador';

    updateCounts();
    updatePreview();
    renderList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateCounts() {
    const eLen = els.excerpt.value.length, bLen = els.body.value.length;
    els.excerptCount.textContent = eLen + ' / 400';
    els.excerptCount.classList.toggle('over', eLen > 400);
    els.bodyCount.textContent = bLen + ' / 20000';
    els.bodyCount.classList.toggle('over', bLen > 20000);
  }

  function updatePreview() {
    els.pvBadge.textContent = (CATEGORY_ICONS[els.category.value] || '📰') + ' ' + els.category.value;
    els.pvTitle.textContent = els.title.value || 'Título de la nota';
    els.pvExcerpt.textContent = els.excerpt.value || 'La bajada aparece acá.';
    els.pvAuthor.textContent = els.author.value || 'Redacción Micro Noticias';
    els.pvRead.textContent = (els.read.value || 4) + ' min de lectura';
    if (els.cover.value.trim()) {
      els.pvImg.src = els.cover.value.trim();
      els.pvMedia.style.display = 'block';
    } else {
      els.pvMedia.style.display = 'none';
    }
    els.pvBody.innerHTML = window.MicroNoticias.renderMarkdown(els.body.value);
  }

  ['input', 'change'].forEach(evt => {
    els.form.addEventListener(evt, (e) => {
      if (e.target.id === 'f-excerpt' || e.target.id === 'f-body') updateCounts();
      updatePreview();
    });
  });

  // ---------- Actions ----------

  function currentPayload() {
    return {
      title: els.title.value.trim(),
      category: els.category.value,
      author: els.author.value.trim(),
      excerpt: els.excerpt.value.trim(),
      coverImage: els.cover.value.trim(),
      readMinutes: els.read.value ? Number(els.read.value) : undefined,
      body: els.body.value
    };
  }

  async function loadNotes() {
    const data = await api('/api/notes');
    notes = data.notes || [];
    renderList();
  }

  async function saveCurrent() {
    const payload = currentPayload();
    if (!payload.title || !payload.excerpt || !payload.body) {
      throw new Error('Completá al menos título, bajada y cuerpo antes de guardar.');
    }
    if (currentId) {
      const data = await api('/api/notes/' + encodeURIComponent(currentId), { method: 'PUT', body: JSON.stringify(payload) });
      return data.note;
    }
    const data = await api('/api/notes', { method: 'POST', body: JSON.stringify(payload) });
    return data.note;
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.saveBtn.disabled = true;
    try {
      const note = await saveCurrent();
      await loadNotes();
      loadIntoForm(note);
      flash('Guardado como borrador. Todavía no está visible en el sitio público.', 'success');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      els.saveBtn.disabled = false;
    }
  });

  els.publishBtn.addEventListener('click', async () => {
    els.publishBtn.disabled = true;
    try {
      const note = await saveCurrent();
      const data = await api('/api/notes/' + encodeURIComponent(note.id) + '/publish', { method: 'POST' });
      await loadNotes();
      loadIntoForm(data.note);
      flash('Nota aprobada y publicada en data/notes.json. Para que se vea en GitHub, hacé commit + push.', 'success');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      els.publishBtn.disabled = false;
    }
  });

  els.unpublishBtn.addEventListener('click', async () => {
    if (!currentId) return;
    try {
      const data = await api('/api/notes/' + encodeURIComponent(currentId) + '/unpublish', { method: 'POST' });
      await loadNotes();
      loadIntoForm(data.note);
      flash('Nota despublicada. Volvió a estado borrador.', 'success');
    } catch (err) {
      flash(err.message, 'error');
    }
  });

  els.deleteBtn.addEventListener('click', async () => {
    if (!currentId) return;
    if (!confirm('¿Eliminar esta nota definitivamente? No se puede deshacer.')) return;
    try {
      await api('/api/notes/' + encodeURIComponent(currentId), { method: 'DELETE' });
      await loadNotes();
      loadIntoForm(null);
      flash('Nota eliminada.', 'success');
    } catch (err) {
      flash(err.message, 'error');
    }
  });

  els.newBtn.addEventListener('click', () => loadIntoForm(null));

  // ---------- Login ----------

  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = els.pinInput.value.trim();
    if (!pin) return;
    els.loginError.textContent = '';
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setPin(pin);
        showDashboard();
        await loadNotes();
        loadIntoForm(notes[0] || null);
      } else if (res.status === 429) {
        els.loginError.textContent = 'Demasiados intentos fallidos. Esperá unos minutos.';
      } else {
        els.loginError.textContent = 'PIN incorrecto.';
      }
    } catch (err) {
      els.loginError.textContent = 'No se pudo conectar con el servidor local. Corré "node server/admin-server.js" y volvé a intentar.';
    }
  });

  els.logoutBtn.addEventListener('click', () => {
    clearPin();
    notes = [];
    currentId = null;
    showLogin('');
  });

  // ---------- Boot ----------

  (async function boot() {
    const pin = getPin();
    if (!pin) { showLogin(''); return; }
    try {
      await loadNotes();
      showDashboard();
      loadIntoForm(notes[0] || null);
    } catch (err) {
      // Si mientras tanto se logró un login válido (getPin() ya no está
      // vacío), no pisar esa sesión con el error de este chequeo viejo.
      if (!getPin()) {
        showLogin(err.message === 'No autorizado' ? 'Ingresá el PIN para continuar.' : err.message);
      }
    }
  })();
})();
