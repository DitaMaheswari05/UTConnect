function go(t) {
  S.tab = t;
  S.ov = null;
  R();
}
function R() {
  const a = $('#app');
  if (!S.role) {
    a.innerHTML =
      (S.priv
        ? `<div class=wel>${V.priv()}<button class="btn" onclick="S.priv=0;R()">Kembali</button></div>`
        : welcome()) + (S.ov == 'guide' ? ovH() : '');
    return;
  }
  const g = S.role == 'guest';
  if (g && S.tab != 'info' && S.tab != 'priv') S.tab = 'info';
  const T = g
    ? [['info', '📢', 'Info Hub']]
    : [
        ['home', '🗺️', 'Beranda'],
        ['match', '🤝', 'Matching'],
        ['forum', '💬', 'Forum'],
        ['grup', '👥', 'Grup'],
        ['prof', '🙍', 'Profil'],
      ];
  a.innerHTML = `<div class=shell><nav>${T.map(t => `<button class="${S.tab == t[0] ? 'on' : ''}" onclick="go('${t[0]}')"><i>${t[1]}</i>${t[2]}</button>`).join('')}${g ? `<button onclick="S.role=null;S.step=1;R()"><i>🎓</i>Daftar UT</button>` : ''}</nav>
 <div class=col><header><div class=logo>UT<b>Connect</b></div><div>${g ? '<span class=m style="color:#fff9">Mode Guest</span>' : `<button onclick="go('info')">📢 Info</button>`}<button onclick="ov('guide')" aria-label="Panduan penggunaan" title="Panduan penggunaan">❓</button><button onclick="go('priv')">🔒 Privasi</button></div></header><main>${V[S.tab]()}</main></div></div>${S.ov ? ovH() : ''}`;
  const c = $('.msgs');
  if (c) {
    c.scrollTop = 1e9;
    const i = $('#ci');
    if (i && S.foc) {
      i.focus();
      S.foc = 0;
    }
  }
}
const ov = k => {
  S.ov = k;
  R();
};
