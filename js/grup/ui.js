function modal(h) {
  $('#mb').innerHTML = h;
  $('#md').classList.add('on');
}
function kClose() {
  $('#md').classList.remove('on');
}
function conf(msg, fn, lbl) {
  CB = fn;
  modal(
    `<h3>Konfirmasi</h3><p>${msg}</p><div class=krow><button class="kbtn ghost" data-a=close>Batal</button><button class="kbtn red" data-a=cok>${lbl || 'Ya, lanjut'}</button></div>`,
  );
}
const em = (a, b) => `<div class=em><b>${a}</b><br>${b}</div>`;
const sc0 = b => {
  const m = document.querySelector('main');
  if (m) m.scrollTo(0, b ? m.scrollHeight : 0);
};
