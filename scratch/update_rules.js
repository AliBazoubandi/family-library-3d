import http from 'http';

async function superLogin() {
  const data = JSON.stringify({ identity: 'admin@library.local', password: 'Password123456!' });
  return new Promise((resolve) => {
    const req = http.request('http://127.0.0.1:8090/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        const auth = JSON.parse(b);
        console.log('Superuser login status:', res.statusCode, 'token:', auth.token ? 'OK' : 'FAIL');
        resolve(auth.token);
      });
    });
    req.write(data);
    req.end();
  });
}

async function updateCollection(token, name, updates) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:8090/api/collections/${name}`, {
      headers: { 'Authorization': token }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        const col = JSON.parse(b);
        const pData = JSON.stringify(updates);
        const pReq = http.request(`http://127.0.0.1:8090/api/collections/${name}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            'Content-Length': Buffer.byteLength(pData)
          }
        }, (pRes) => {
          let pb = '';
          pRes.on('data', c => pb += c);
          pRes.on('end', () => {
            console.log(`Updated ${name} status:`, pRes.statusCode);
            resolve();
          });
        });
        pReq.write(pData);
        pReq.end();
      });
    });
  });
}

(async () => {
  const token = await superLogin();
  if (!token) return;

  await updateCollection(token, 'users', {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''"
  });

  await updateCollection(token, 'shelves', {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''"
  });

  await updateCollection(token, 'books', {
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''"
  });

  // Verify
  http.get('http://127.0.0.1:8090/api/collections/users/records', {
    headers: { 'Authorization': token }
  }, (res) => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const users = JSON.parse(b);
      console.log('Total users in database:', users.totalItems, users.items.map(u => ({ id: u.id, name: u.name, color: u.house_color })));
    });
  });
})();
