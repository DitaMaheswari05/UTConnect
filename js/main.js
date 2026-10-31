R();
API.info()
  .then(i => {
    S.info = i;
    R();
  })
  .catch(e => toast(e.message));
API.sesi()
  .then(m => m && mulai(m))
  .catch(e => toast(e.message));
