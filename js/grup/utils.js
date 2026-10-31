const $$ = s => [...document.querySelectorAll(s)];
const H = s =>
  String(s == null ? '' : s).replace(
    /[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
const ok = u => /^https?:\/\//i.test(u || ''),
  tm = t => (t || '').replace(':', '.');
const fD = d =>
  d
    ? new Date(d + 'T00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
const fT = t => new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const fS = b =>
  b ? (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB') : '—';
