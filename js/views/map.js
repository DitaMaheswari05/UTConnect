const MAPSVG = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="#e6eee2"/><rect x="8" y="10" width="22" height="16" fill="#c9e2c0"/><rect x="62" y="58" width="26" height="20" fill="#c9e2c0"/><path d="M0 70 Q30 55 55 68 T100 50" stroke="#a9d0ef" stroke-width="4" fill="none"/><g stroke="#fff" stroke-width="2.2" fill="none"><path d="M0 35H100M0 82H100M40 0V100M75 0V100M15 0L60 100"/></g><g stroke="#fff" stroke-width="1" fill="none"><path d="M0 18H100M0 55H100M20 0V100M58 0V100M90 0V100"/></g></svg>`;
const mapH = (inner, click) =>
  `<div class=map ${click ? 'onclick="pinAt(event)" style="cursor:crosshair"' : ''}>${MAPSVG}${inner}</div>`;
const meMk = () => {
  if (!S.pin) return '';
  const [x, y] = xy(S.pin);
  return `<div class="mk me" style="left:${x}%;top:${y}%;display:grid;place-items:center">${S.role ? 'Kamu' : '📍'}</div>`;
};
function pinAt(e) {
  const r = e.currentTarget.getBoundingClientRect();
  S.pin = {
    lat: -6.89 - ((e.clientY - r.top) / r.height) * 0.06,
    lng: 107.58 + ((e.clientX - r.left) / r.width) * 0.07,
  };
  R();
}
