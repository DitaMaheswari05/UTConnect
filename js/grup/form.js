/* ---------- form generik ---------- */
function form(title, fs, vals, cb) {
  FM = { title, fs, vals: { ...vals }, cb };
  drawForm();
}
function drawForm(err) {
  const { title, fs, vals } = FM;
  modal(
    `<h3>${title}</h3>` +
      fs
        .filter(f => !f.w || f.w(vals))
        .map(
          f =>
            `<label>${f.l}${f.req ? ' *' : ''}${f.t == 'textarea' ? `<textarea data-f="${f.k}" rows=3>${H(vals[f.k])}</textarea>` : f.t == 'select' ? `<select data-f="${f.k}" data-c="r">${f.o.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${H(v)}" ${v == vals[f.k] ? 'selected' : ''}>${H(l)}</option>`; }).join('')}</select>` : `<input data-f="${f.k}" type="${f.t || 'text'}" ${f.t == 'file' ? '' : `value="${H(vals[f.k])}"`} ${f.t == 'number' ? 'min=2' : ''}>`}</label>`,
        )
        .join('') +
      (err ? `<p class=err>${H(err)}</p>` : '') +
      `<div class=krow><button class="kbtn ghost" data-a=close>Batal</button><button class="kbtn" data-a=fsave>Simpan</button></div>`,
  );
}
function collect() {
  $$('#mb [data-f]').forEach(el => {
    const k = el.dataset.f;
    if (el.type == 'file') {
      const f = el.files[0];
      if (f) {
        FM.vals[k + 'N'] = f.name;
        FM.vals[k + 'KS'] = f.size;
      }
    } else FM.vals[k] = el.value.trim();
  });
}
function fsave() {
  collect();
  const { fs, vals, cb } = FM;
  for (const f of fs) {
    if (f.req && (!f.w || f.w(vals)) && !vals[f.k]) return drawForm(f.l + ' wajib diisi');
  }
  const e = cb(vals);
  if (e) drawForm(e);
  else {
    kClose();
    save();
    render();
  }
}
function gfields() {
  return [
    { k: 'name', l: 'Nama kelompok', req: 1 },
    { k: 'course', l: 'Mata kuliah', req: 1 },
    { k: 'desc', l: 'Deskripsi', t: 'textarea' },
    { k: 'goal', l: 'Tujuan belajar', t: 'textarea' },
    { k: 'type', l: 'Tipe kelompok', t: 'select', o: ['Online', 'Offline'] },
    { k: 'cap', l: 'Kapasitas maksimal', t: 'number', req: 1 },
    { k: 'day', l: 'Hari', t: 'select', o: DAY },
    { k: 'start', l: 'Jam mulai', t: 'time', req: 1 },
    { k: 'end', l: 'Jam selesai', t: 'time', req: 1 },
    { k: 'platform', l: 'Platform', t: 'select', o: PL, w: v => v.type == 'Online' },
    { k: 'link', l: 'Link meeting', w: v => v.type == 'Online', req: 1 },
    { k: 'loc', l: 'Lokasi', w: v => v.type == 'Offline', req: 1 },
    { k: 'addr', l: 'Alamat', w: v => v.type == 'Offline' },
    { k: 'join', l: 'Pengaturan bergabung', t: 'select', o: JM },
    { k: 'rules', l: 'Aturan kelompok', t: 'textarea' },
  ];
}
function gcheck(v, min) {
  const c = +v.cap;
  if (!(c >= 2 && c <= 100)) return 'Kapasitas harus 2–100';
  if (c < min) return 'Kapasitas tidak boleh kurang dari jumlah anggota (' + min + ')';
  if (v.end <= v.start) return 'Jam selesai harus setelah jam mulai';
  if (v.type == 'Online' && !ok(v.link)) return 'Link meeting harus diawali http(s)://';
}
function apply(g, v) {
  Object.assign(g, {
    name: v.name,
    course: v.course.toUpperCase(),
    desc: v.desc,
    goal: v.goal,
    type: v.type.toLowerCase(),
    cap: +v.cap,
    day: v.day,
    start: v.start,
    end: v.end,
    platform: v.type == 'Online' ? v.platform : '',
    link: v.type == 'Online' ? v.link : '',
    loc: v.type == 'Offline' ? v.loc : '',
    addr: v.type == 'Offline' ? v.addr : '',
    join: JK[JM.indexOf(v.join)],
    rules: v.rules,
  });
}
