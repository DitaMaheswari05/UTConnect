window.onerror = function (m, s, l) {
  var d = document.createElement('pre');
  d.style.cssText =
    'position:fixed;left:0;right:0;top:0;z-index:99;background:#fee;color:#900;padding:8px;font:12px monospace;white-space:pre-wrap';
  d.textContent = 'Error: ' + m + ' (' + (s || '').split('/').pop() + ' baris ' + l + ')';
  document.body.appendChild(d);
};
const $ = s => document.querySelector(s),
  V = {};
let S = {
  role: null,
  step: 0,
  reg: {},
  pin: null,
  tab: 'home',
  people: [],
  dir: [],
  forum: [],
  info: [],
  login: {},
  ch: {},
  f: {},
  it: 'ut',
  ic: 'Semua',
  ov: null,
  show: true,
  form: null,
};
