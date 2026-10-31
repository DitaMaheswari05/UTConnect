V.prof = () => {
  const m = S.me;
  return `<h2>Profil</h2><div class=card><div class=row><div class=av style="width:64px;height:64px"><div class=ph style="background:${hue(99)};filter:none"></div><span>${m.nm
    .split(' ')
    .map(x => x[0])
    .join('')
    .slice(
      0,
      2,
    )}</span></div><div class=f><h3>${m.nm}</h3><div class=m>NIM ${m.nim.slice(0, 3)}••••••</div><div class=m>${m.pr} · ${m.fk} · Sem ${m.sm}</div></div></div></div><div class=card><b>📍 Lokasi tersimpan</b><div class=m>Lat ${S.pin.lat.toFixed(4)}, Lng ${S.pin.lng.toFixed(4)} · hanya kamu yang bisa melihat ini</div><button class="btn ghost s" style="margin-top:6px" onclick="S.role=null;S.step=2;S.reg={ok:1};R()">Ubah pin</button></div><div class=card><label><input type=checkbox style="width:auto;margin-right:6px" ${S.show ? 'checked' : ''} onchange="S.show=this.checked;API.setShow(S.show);toast(this.checked?'Kamu tampil di peta (samar)':'Kamu disembunyikan dari peta')">Tampilkan saya di peta (jarak disamarkan)</label></div><button class="btn ghost w" onclick="go('priv')">🔒 Penjelasan Privasi</button><button class="btn ghost w" onclick="KB.reset();API.keluar();S={role:null,step:0,reg:{},pin:null,tab:'home',people:[],dir:[],forum:[],info:S.info,login:{},ch:{},f:{},it:'ut',ic:'Semua',ov:null,show:true};R()">Keluar</button>`;
};
