/**
 * Micro Noticias — servidor local de administración.
 *
 * SOLO corre en tu máquina (127.0.0.1) y NUNCA se sube a GitHub Pages.
 * Es la única forma de crear, editar, aprobar o borrar notas: sirve el
 * panel /admin y una API mínima que lee/escribe data/notes.json en disco.
 *
 * El verdadero control de acceso a la publicación es doble:
 *   1) Tener este servidor corriendo localmente (PIN de sesión, ver abajo).
 *   2) Tener permiso de "git push" sobre el repositorio para que los
 *      cambios lleguen al sitio público.
 * Sin dependencias externas: solo módulos nativos de Node.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const ROOT = path.join(__dirname, '..');
const NOTES_PATH = path.join(ROOT, 'data', 'notes.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const PORT = Number(process.env.PORT) || 4000;
const HOST = '127.0.0.1'; // nunca cambiar a 0.0.0.0: esto es lo que mantiene el panel privado
const SITE_URL = 'https://diallop96.github.io/micro-noticias/';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const LIMITS = {
  title: 200,
  excerpt: 400,
  category: 60,
  author: 100,
  coverImage: 500,
  body: 20000,
  focusKeyword: 80
};

// ---------- Config / PIN ----------

function loadOrCreateConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.error('config.json inválido, generando uno nuevo:', e.message);
    }
  }
  const pin = String(crypto.randomInt(100000, 999999));
  const config = { pin, createdAt: new Date().toISOString() };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
  return config;
}

let config = loadOrCreateConfig();

// simple in-memory rate limiting para el PIN
let failCount = 0;
let lockUntil = 0;

function pinIsLocked() {
  return Date.now() < lockUntil;
}

function checkPin(providedPin) {
  if (pinIsLocked()) return false;
  const ok = typeof providedPin === 'string' &&
    providedPin.length === String(config.pin).length &&
    crypto.timingSafeEqual(Buffer.from(providedPin), Buffer.from(String(config.pin)));
  if (!ok) {
    failCount++;
    if (failCount >= 5) {
      lockUntil = Date.now() + 2 * 60 * 1000;
      failCount = 0;
    }
  } else {
    failCount = 0;
  }
  return ok;
}

// ---------- Notes storage ----------

function readNotes() {
  if (!fs.existsSync(NOTES_PATH)) return { notes: [] };
  const raw = fs.readFileSync(NOTES_PATH, 'utf8').trim();
  if (!raw) return { notes: [] };
  const data = JSON.parse(raw);
  if (!Array.isArray(data.notes)) data.notes = [];
  return data;
}

function writeNotes(data) {
  fs.writeFileSync(NOTES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  writeSitemap(data);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Se regenera automáticamente cada vez que se crea, edita, publica,
// despublica o borra una nota: nunca queda desactualizado a mano.
function writeSitemap(data) {
  const published = (data.notes || [])
    .filter(n => n.status === 'published')
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

  const urls = [
    { loc: SITE_URL, changefreq: 'daily', priority: '1.0' },
    ...published.map(n => ({
      loc: SITE_URL + 'nota.html?slug=' + encodeURIComponent(n.slug),
      lastmod: (n.updatedAt || n.publishedAt || '').slice(0, 10),
      changefreq: 'monthly',
      priority: '0.8'
    }))
  ];

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u =>
      '  <url>\n' +
      '    <loc>' + escapeXml(u.loc) + '</loc>\n' +
      (u.lastmod ? '    <lastmod>' + u.lastmod + '</lastmod>\n' : '') +
      '    <changefreq>' + u.changefreq + '</changefreq>\n' +
      '    <priority>' + u.priority + '</priority>\n' +
      '  </url>\n'
    ).join('') +
    '</urlset>\n';

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
}

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');

function slugify(title) {
  return String(title)
    .normalize('NFD').replace(DIACRITICS_RE, '') // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'nota';
}

function uniqueSlug(base, notes, excludeId) {
  let slug = base;
  let n = 2;
  while (notes.some(note => note.slug === slug && note.id !== excludeId)) {
    slug = base + '-' + n;
    n++;
  }
  return slug;
}

const ALLOWED_CATEGORIES = ['Microeconomía', 'Comercio Exterior', 'Aranceles', 'Mercado Local', 'Análisis'];

function validateNoteInput(input, isUpdate) {
  const errors = [];
  const clean = {};

  function str(field, required, limit) {
    let v = input[field];
    if (v == null) v = '';
    v = String(v).trim();
    if (required && !isUpdate && !v) errors.push(field + ' es obligatorio');
    if (limit && v.length > limit) errors.push(field + ' supera el máximo de ' + limit + ' caracteres');
    clean[field] = v;
  }

  str('title', true, LIMITS.title);
  str('excerpt', true, LIMITS.excerpt);
  str('category', true, LIMITS.category);
  str('author', false, LIMITS.author);
  str('coverImage', false, LIMITS.coverImage);
  str('body', true, LIMITS.body);
  str('focusKeyword', false, LIMITS.focusKeyword);

  if (clean.category && !ALLOWED_CATEGORIES.includes(clean.category)) {
    errors.push('category debe ser una de: ' + ALLOWED_CATEGORIES.join(', '));
  }
  if (clean.coverImage && !/^(https?:\/\/|\/)/i.test(clean.coverImage)) {
    errors.push('coverImage debe ser una URL http(s) o una ruta relativa');
  }
  let readMinutes = Number(input.readMinutes);
  if (!Number.isFinite(readMinutes) || readMinutes <= 0) readMinutes = Math.max(2, Math.round((clean.body || '').split(/\s+/).length / 200)) || 4;
  clean.readMinutes = Math.min(60, Math.round(readMinutes));

  return { errors, clean };
}

// ---------- HTTP helpers ----------

function send(res, status, body, headers) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, Object.assign({
    'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }, headers || {}));
  res.end(payload);
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function requirePin(req) {
  const pin = req.headers['x-admin-pin'];
  return checkPin(typeof pin === 'string' ? pin : '');
}

// ---------- Static file serving ----------

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';

  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, 'Forbidden');
    return;
  }
  // no exponer archivos de configuración/servidor por la web estática
  if (rel.startsWith('/server/')) {
    send(res, 404, 'Not found');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      send(res, 404, '<h1>404</h1><p>No encontrado: ' + rel + '</p>', { 'Content-Type': 'text/html; charset=utf-8' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- API ----------

async function handleApi(req, res, pathname) {
  if (pathname === '/api/auth/verify' && req.method === 'POST') {
    if (pinIsLocked()) return send(res, 429, { ok: false, error: 'Demasiados intentos. Esperá unos minutos.' });
    try {
      const body = await readJsonBody(req, 1024);
      const ok = checkPin(String(body.pin || ''));
      return send(res, ok ? 200 : 401, { ok });
    } catch (e) {
      return send(res, 400, { ok: false, error: 'Solicitud inválida' });
    }
  }

  // todo lo demás bajo /api requiere PIN válido
  if (!requirePin(req)) {
    const status = pinIsLocked() ? 429 : 401;
    return send(res, status, { ok: false, error: pinIsLocked() ? 'Bloqueado temporalmente por intentos fallidos' : 'PIN inválido o ausente' });
  }

  const data = readNotes();

  if (pathname === '/api/notes' && req.method === 'GET') {
    return send(res, 200, { ok: true, notes: data.notes });
  }

  if (pathname === '/api/notes' && req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req, 200 * 1024);
    } catch (e) {
      return send(res, 400, { ok: false, error: 'JSON inválido' });
    }
    const { errors, clean } = validateNoteInput(body, false);
    if (errors.length) return send(res, 422, { ok: false, error: errors.join('; ') });

    const now = new Date().toISOString();
    const note = Object.assign({}, clean, {
      id: 'n-' + crypto.randomBytes(6).toString('hex'),
      slug: uniqueSlug(slugify(clean.title), data.notes, null),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: null
    });
    data.notes.unshift(note);
    writeNotes(data);
    return send(res, 201, { ok: true, note });
  }

  const idMatch = pathname.match(/^\/api\/notes\/([^/]+)(\/(publish|unpublish))?$/);
  if (idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    const action = idMatch[3];
    const idx = data.notes.findIndex(n => n.id === id);
    if (idx === -1) return send(res, 404, { ok: false, error: 'Nota no encontrada' });

    if (!action && req.method === 'PUT') {
      let body;
      try {
        body = await readJsonBody(req, 200 * 1024);
      } catch (e) {
        return send(res, 400, { ok: false, error: 'JSON inválido' });
      }
      const { errors, clean } = validateNoteInput(body, true);
      if (errors.length) return send(res, 422, { ok: false, error: errors.join('; ') });

      const existing = data.notes[idx];
      const merged = Object.assign({}, existing);
      for (const key of Object.keys(clean)) {
        if (clean[key] !== '' || key === 'coverImage' || key === 'author' || key === 'focusKeyword') merged[key] = clean[key];
      }
      if (clean.title && clean.title !== existing.title) {
        merged.slug = uniqueSlug(slugify(clean.title), data.notes, id);
      }
      merged.updatedAt = new Date().toISOString();
      data.notes[idx] = merged;
      writeNotes(data);
      return send(res, 200, { ok: true, note: merged });
    }

    if (!action && req.method === 'DELETE') {
      const [removed] = data.notes.splice(idx, 1);
      writeNotes(data);
      return send(res, 200, { ok: true, note: removed });
    }

    if (action === 'publish' && req.method === 'POST') {
      const note = data.notes[idx];
      if (note.status !== 'published') {
        note.publishedAt = new Date().toISOString();
      }
      note.status = 'published';
      note.updatedAt = new Date().toISOString();
      writeNotes(data);
      return send(res, 200, { ok: true, note });
    }

    if (action === 'unpublish' && req.method === 'POST') {
      const note = data.notes[idx];
      note.status = 'draft';
      note.updatedAt = new Date().toISOString();
      writeNotes(data);
      return send(res, 200, { ok: true, note });
    }
  }

  send(res, 404, { ok: false, error: 'Ruta no encontrada' });
}

// ---------- Server ----------

const server = http.createServer((req, res) => {
  let parsed;
  try {
    parsed = new URL(req.url, 'http://' + HOST);
  } catch (e) {
    return send(res, 400, 'Bad request');
  }
  const pathname = parsed.pathname;

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname).catch((err) => {
      console.error(err);
      send(res, 500, { ok: false, error: 'Error interno' });
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method not allowed');
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  Micro Noticias — panel de administración local');
  console.log('  ------------------------------------------------');
  console.log('  Sitio:  http://' + HOST + ':' + PORT + '/');
  console.log('  Panel:  http://' + HOST + ':' + PORT + '/admin/');
  console.log('  PIN de acceso: ' + config.pin + '  (guardado en server/config.json, no se sube a git)');
  console.log('  ------------------------------------------------');
  console.log('  Este servidor solo escucha en 127.0.0.1: no es accesible desde otras máquinas.');
  console.log('');
});
