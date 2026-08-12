/**
 * Minimal, safe markdown -> HTML renderer for Micro Noticias.
 * Escapes all input first, then applies a small allow-listed set of
 * markdown transforms. No raw HTML is ever passed through, so note
 * bodies authored in the admin panel cannot inject scripts/markup.
 */
(function (global) {
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isSafeUrl(url) {
    return /^(https?:\/\/|\/|#|mailto:)/i.test(url.trim());
  }

  function inline(text) {
    let out = escapeHtml(text);

    // links: [label](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, label, url) {
      if (!isSafeUrl(url)) return label;
      return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });

    // bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic *text*
    out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
    // inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

    return out;
  }

  function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let i = 0;
    let listBuffer = null; // { type: 'ul'|'ol', items: [] }

    function flushList() {
      if (!listBuffer) return;
      const tag = listBuffer.type;
      html.push('<' + tag + '>' + listBuffer.items.map(it => '<li>' + inline(it) + '</li>').join('') + '</' + tag + '>');
      listBuffer = null;
    }

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === '') { flushList(); i++; continue; }

      let m;
      if ((m = trimmed.match(/^###\s+(.*)$/))) {
        flushList(); html.push('<h3>' + inline(m[1]) + '</h3>'); i++; continue;
      }
      if ((m = trimmed.match(/^##\s+(.*)$/))) {
        flushList(); html.push('<h2>' + inline(m[1]) + '</h2>'); i++; continue;
      }
      if ((m = trimmed.match(/^>\s?(.*)$/))) {
        flushList();
        const quoteLines = [m[1]];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        html.push('<blockquote>' + quoteLines.map(inline).join('<br>') + '</blockquote>');
        continue;
      }
      if ((m = trimmed.match(/^[-*]\s+(.*)$/))) {
        if (!listBuffer || listBuffer.type !== 'ul') { flushList(); listBuffer = { type: 'ul', items: [] }; }
        listBuffer.items.push(m[1]);
        i++; continue;
      }
      if ((m = trimmed.match(/^\d+\.\s+(.*)$/))) {
        if (!listBuffer || listBuffer.type !== 'ol') { flushList(); listBuffer = { type: 'ol', items: [] }; }
        listBuffer.items.push(m[1]);
        i++; continue;
      }

      // paragraph: collect until blank line or block-starter
      flushList();
      const paraLines = [trimmed];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(#{2,3}\s|>|[-*]\s|\d+\.\s)/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      html.push('<p>' + paraLines.map(inline).join(' ') + '</p>');
    }
    flushList();
    return html.join('\n');
  }

  global.MicroNoticias = global.MicroNoticias || {};
  global.MicroNoticias.renderMarkdown = renderMarkdown;
  global.MicroNoticias.escapeHtml = escapeHtml;
})(window);
