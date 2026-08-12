/**
 * Analizador SEO local para el panel de administración de Micro Noticias.
 * No usa ninguna IA ni API externa: son reglas basadas en los mismos
 * criterios técnicos que buscan Google y herramientas como Yoast SEO
 * (largo de título/meta descripción, densidad de palabra clave,
 * estructura de encabezados, legibilidad, etc). Corre 100% en el navegador,
 * sin costo y sin conexión a internet.
 */
(function (global) {
  const DIACRITICS_RE = /[̀-ͯ]/g;

  function normalize(str) {
    return String(str || '')
      .normalize('NFD').replace(DIACRITICS_RE, '')
      .toLowerCase();
  }

  function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    const h = normalize(haystack);
    const n = normalize(needle);
    if (!n) return 0;
    let count = 0;
    let idx = 0;
    while ((idx = h.indexOf(n, idx)) !== -1) {
      count++;
      idx += n.length;
    }
    return count;
  }

  function wordCount(text) {
    const t = String(text || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }

  function stripMarkdown(body) {
    return String(body || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[>*_]/g, '')
      .trim();
  }

  function check(status, label, detail) {
    return { status, label, detail };
  }

  // status: 'good' (2pt) | 'ok' (1pt) | 'bad' (0pt) | 'na' (no cuenta para el puntaje)
  function analyzeSeo(fields) {
    const title = fields.title || '';
    const excerpt = fields.excerpt || '';
    const body = fields.body || '';
    const slug = fields.slug || '';
    const coverImage = fields.coverImage || '';
    const keyword = (fields.focusKeyword || '').trim();

    const plainBody = stripMarkdown(body);
    const words = wordCount(plainBody);
    const checks = [];

    if (!keyword) {
      checks.push(check('bad', 'Sin palabra clave objetivo',
        'Definí una palabra o frase clave (ej. "productos importados") para habilitar el análisis de posicionamiento.'));
    }

    // --- Título ---
    const titleLen = title.length;
    if (titleLen === 0) {
      checks.push(check('bad', 'Falta el título', ''));
    } else if (titleLen < 30) {
      checks.push(check('bad', 'Título muy corto', titleLen + ' caracteres — Google suele mostrar hasta ~60. Sumá contexto.'));
    } else if (titleLen <= 60) {
      checks.push(check('good', 'Largo de título ideal', titleLen + ' caracteres.'));
    } else if (titleLen <= 70) {
      checks.push(check('ok', 'Título un poco largo', titleLen + ' caracteres — Google podría cortarlo en el buscador.'));
    } else {
      checks.push(check('bad', 'Título demasiado largo', titleLen + ' caracteres — se va a cortar en los resultados de búsqueda.'));
    }

    if (keyword) {
      const inTitle = countOccurrences(title, keyword) > 0;
      checks.push(inTitle
        ? check('good', 'La palabra clave aparece en el título', '')
        : check('bad', 'La palabra clave no aparece en el título', 'Incluirla ayuda mucho al posicionamiento.'));

      if (inTitle) {
        const posRatio = normalize(title).indexOf(normalize(keyword)) / Math.max(1, title.length);
        checks.push(posRatio <= 0.5
          ? check('good', 'La palabra clave está cerca del inicio del título', '')
          : check('ok', 'La palabra clave aparece tarde en el título', 'Si podés, movela más cerca del principio.'));
      }
    }

    // --- Meta descripción (bajada / excerpt) ---
    const excLen = excerpt.length;
    if (excLen === 0) {
      checks.push(check('bad', 'Falta la bajada (meta descripción)', ''));
    } else if (excLen < 70) {
      checks.push(check('bad', 'Meta descripción muy corta', excLen + ' caracteres — lo ideal es 120-160.'));
    } else if (excLen < 120) {
      checks.push(check('ok', 'Meta descripción algo corta', excLen + ' caracteres — podés sumar un poco más (120-160 ideal).'));
    } else if (excLen <= 160) {
      checks.push(check('good', 'Largo de meta descripción ideal', excLen + ' caracteres.'));
    } else if (excLen <= 180) {
      checks.push(check('ok', 'Meta descripción algo larga', excLen + ' caracteres — Google podría cortarla.'));
    } else {
      checks.push(check('bad', 'Meta descripción demasiado larga', excLen + ' caracteres — se va a cortar en los resultados.'));
    }

    if (keyword) {
      checks.push(countOccurrences(excerpt, keyword) > 0
        ? check('good', 'La palabra clave aparece en la meta descripción', '')
        : check('bad', 'La palabra clave no aparece en la meta descripción', ''));
    }

    // --- Slug ---
    if (keyword && slug) {
      const slugified = normalize(keyword).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      checks.push(slug.includes(slugified) || countOccurrences(slug.replace(/-/g, ' '), keyword) > 0
        ? check('good', 'La palabra clave está en la URL', '')
        : check('ok', 'La palabra clave no está en la URL', 'La URL sale del título — si podés, incluí la palabra clave en el título.'));
    }

    // --- Contenido ---
    if (words === 0) {
      checks.push(check('bad', 'Falta el cuerpo de la nota', ''));
    } else if (words < 300) {
      checks.push(check('bad', 'Contenido corto', words + ' palabras — con menos de 300 es difícil competir en el buscador.'));
    } else if (words < 600) {
      checks.push(check('ok', 'Contenido de largo moderado', words + ' palabras — 600+ suele posicionar mejor en temas competitivos.'));
    } else {
      checks.push(check('good', 'Buen largo de contenido', words + ' palabras.'));
    }

    if (keyword && words > 0) {
      const occurrences = countOccurrences(plainBody, keyword);
      const density = (occurrences * wordCount(keyword)) / words * 100;
      const timesLabel = occurrences === 1 ? '1 vez' : occurrences + ' veces';
      if (occurrences === 0) {
        checks.push(check('bad', 'La palabra clave no aparece en el cuerpo', ''));
      } else if (density < 0.5) {
        checks.push(check('ok', 'Densidad de palabra clave baja', density.toFixed(1) + '% — aparece ' + timesLabel + '. Ideal: 0,5%-2,5%.'));
      } else if (density <= 2.5) {
        checks.push(check('good', 'Densidad de palabra clave saludable', density.toFixed(1) + '% (' + timesLabel + ').'));
      } else {
        checks.push(check('bad', 'Densidad de palabra clave demasiado alta', density.toFixed(1) + '% — riesgo de "keyword stuffing", puede perjudicar el posicionamiento.'));
      }

      const firstParagraph = plainBody.split(/\n\s*\n/)[0] || '';
      checks.push(countOccurrences(firstParagraph, keyword) > 0
        ? check('good', 'La palabra clave aparece en el primer párrafo', '')
        : check('ok', 'La palabra clave no está en el primer párrafo', 'Mencionarla temprano ayuda a Google a entender el tema.'));
    }

    // --- Estructura ---
    const hasSubheadings = /^#{2,3}\s+/m.test(body);
    if (words > 300) {
      checks.push(hasSubheadings
        ? check('good', 'Usa subtítulos (## o ###)', '')
        : check('ok', 'Sin subtítulos', 'Con contenido largo, dividir en subtítulos mejora la lectura y el SEO.'));
    }

    const paragraphs = plainBody.split(/\n\s*\n/).filter(p => p.trim());
    const longParagraphs = paragraphs.filter(p => wordCount(p) > 45).length;
    if (paragraphs.length > 0) {
      checks.push(longParagraphs === 0
        ? check('good', 'Párrafos de largo legible', '')
        : check('ok', longParagraphs + ' párrafo(s) muy largo(s)', 'Párrafos cortos se leen mejor en pantallas chicas.'));
    }

    const hasLink = /\[[^\]]+\]\([^)]+\)/.test(body);
    checks.push(hasLink
      ? check('good', 'El cuerpo tiene al menos un enlace', '')
      : check('ok', 'Sin enlaces en el cuerpo', 'Un enlace a otra nota o fuente externa suma valor y contexto.'));

    // --- Imagen ---
    checks.push(coverImage
      ? check('good', 'Tiene imagen de portada', '')
      : check('bad', 'Sin imagen de portada', 'Las notas con imagen tienen mejor rendimiento en redes y buscadores.'));

    // --- Puntaje ---
    const scored = checks.filter(c => c.status !== 'na');
    const points = scored.reduce((sum, c) => sum + (c.status === 'good' ? 2 : c.status === 'ok' ? 1 : 0), 0);
    const maxPoints = scored.length * 2;
    const score = maxPoints ? Math.round((points / maxPoints) * 100) : 0;

    return { score, points, maxPoints, checks };
  }

  /**
   * A partir de un resultado de analyzeSeo(), arma el camino más corto
   * (menos ítems) para alcanzar targetScore (90 por defecto): ordena lo
   * pendiente por cuántos puntos suma arreglarlo y va acumulando hasta
   * llegar a la meta, mostrando el puntaje proyectado en cada paso.
   */
  function getImprovementPlan(result, targetScore) {
    targetScore = targetScore == null ? 90 : targetScore;
    if (result.score >= targetScore || !result.maxPoints) {
      return { done: true, targetScore, items: [] };
    }

    const pending = result.checks
      .filter(c => c.status !== 'good' && c.status !== 'na')
      .map(c => Object.assign({}, c, { gain: c.status === 'ok' ? 1 : 2 }))
      .sort((a, b) => b.gain - a.gain);

    let cumPoints = result.points;
    const items = [];
    for (const c of pending) {
      cumPoints += c.gain;
      items.push(Object.assign({}, c, {
        projectedScore: Math.round((cumPoints / result.maxPoints) * 100)
      }));
      if (cumPoints / result.maxPoints * 100 >= targetScore) break;
    }
    return { done: false, targetScore, items };
  }

  // Corta texto en el último espacio antes de maxLen, sin agregar "..." —
  // pensado para título/meta descripción, que deben quedar completos y
  // legibles, no truncados visualmente. No es generación de contenido,
  // solo acorta lo que ya escribiste.
  function trimToLength(text, maxLen) {
    const t = String(text || '').trim();
    if (t.length <= maxLen) return t;
    const cut = t.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > maxLen * 0.5 ? cut.slice(0, lastSpace) : cut).trim();
  }

  global.MicroNoticias = global.MicroNoticias || {};
  global.MicroNoticias.analyzeSeo = analyzeSeo;
  global.MicroNoticias.getImprovementPlan = getImprovementPlan;
  global.MicroNoticias.trimToLength = trimToLength;
})(window);
