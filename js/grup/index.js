V.grup = () => KB.html();
var KB;
try {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    e.stopPropagation();
    const d = b.dataset,
      g = KG(d.id || KV.id),
      f = ACT[d.a];
    if (f) Promise.resolve(f(g, d)).catch(x => toast(x.message));
  });
  document.addEventListener('change', async e => {
    const t = e.target,
      c = t.dataset.c,
      g = KS && KG(KV.id);
    if (!c || !KS) return;
    if (c == 'r') {
      collect();
      return drawForm();
    }
    if (c == 'co' || c == 'mm' || c == 'so') {
      KV[c] = t.value;
      return render();
    }
    if (c != 'tg' && c != 'tst') return;
    try {
      if (c == 'tg') await API.ubah('grup_target', t.dataset.i, { selesai: t.checked });
      else await API.ubah('grup_tugas', t.dataset.i, { status: t.value });
    } catch (x) {
      toast(x.message);
    }
    await segar();
  });
  document.addEventListener('input', e => {
    if (e.target.id == 'kq') {
      KV.q = e.target.value;
      $('#kcards').innerHTML = cards();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key == 'Enter' && e.target.id == 'kci') ACT.send(KG(KV.id)).catch(x => toast(x.message));
  });
  $('#md').addEventListener('click', e => {
    if (e.target.id == 'md') kClose();
  });
  KB = {
    html: () => `<div class="kb" id="kb">${inner()}</div>`,
    reset() {
      KS = null;
      KV = {
        v: 'list',
        id: null,
        tab: 'chat',
        q: '',
        ty: 'all',
        co: '',
        mm: 'all',
        so: 'new',
        reply: null,
      };
      FM = null;
      CB = null;
      kClose();
    },
  };
} catch (e) {
  KB = {
    html: function () {
      return '<p class=m>Fitur grup gagal dimuat: ' + e.message + '</p>';
    },
    reset: function () {},
  };
}
