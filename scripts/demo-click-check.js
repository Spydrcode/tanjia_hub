const fetch = global.fetch || require('node-fetch');

(async () => {
  const base = 'http://localhost:3000';
  const owner = '20000000-0000-0000-0000-000000000001';
  console.log('POST /api/demo/reset');
  try {
    const res = await fetch(base + '/api/demo/reset', {
      method: 'POST',
      headers: {
        'x-dev-bypass': '1',
        'x-dev-owner': owner,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => null);
    console.log('reset status', res.status, json && json.ok ? 'ok' : json);
    if (!res.ok) process.exitCode = 2;
  } catch (err) {
    console.error('reset error', err);
    process.exitCode = 2;
    return;
  }

  const paths = [
    '/',
    '/demo/today',
    '/demo/leads',
    '/demo/meetings',
    '/demo/groups',
    '/demo/referrals',
    '/demo/support',
  ];

  const results = [];
  for (const p of paths) {
    const url = base + p;
    try {
      const r = await fetch(url, { redirect: 'manual' });
      const redirected = r.status >= 300 && r.status < 400;
      const ok = r.status === 200;
      const length = (await r.text()).length;
      results.push({ path: p, status: r.status, redirected, ok, length });
      console.log(p, 'status', r.status, 'redirected', redirected, 'len', length);
      if (redirected || !ok) process.exitCode = 3;
    } catch (err) {
      console.error(p, 'error', err);
      results.push({ path: p, error: err.message });
      process.exitCode = 4;
    }
  }

  console.log('\nSummary:');
  for (const r of results) {
    if (r.error) console.log('-', r.path, 'ERROR', r.error);
    else console.log('-', r.path, r.ok ? 'OK' : `FAIL status=${r.status} redirected=${r.redirected}`);
  }
})();
