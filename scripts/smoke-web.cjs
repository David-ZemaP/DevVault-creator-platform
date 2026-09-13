// Read-only HTTP smoke checks. Start pnpm dev first; never signs or sends transactions.
const assert = require('node:assert/strict');
const base = process.env.APP_ORIGIN || 'http://localhost:3000';
(async () => {
  let failures = 0;
  const check = async (path, expected, inspect) => {
    try {
      const response = await fetch(new URL(path, base));
      assert.equal(response.status, expected, `HTTP ${response.status}; expected ${expected}`);
      if (inspect) await inspect(response);
      console.log(`PASS ${path} (${response.status})`);
    } catch (error) { failures++; console.error(`FAIL ${path}: ${error.message}`); }
  };
  for (const path of ['/', '/create', '/purchases']) await check(path, 200);
  await check('/api/auth/session', 401, async response => assert.equal((await response.json()).code, 'UNAUTHENTICATED'));
  await check('/api/publications/smoke-anonymous/source', 401);
  await check('/api/publications', 200, async response => {
    const body = await response.json();
    assert.ok(Array.isArray(body.publications));
    assert.doesNotMatch(JSON.stringify(body), /"(?:object_key|zipUrl|repositoryUrl|demoPreviewCode|premiumContent)"\s*:/);
    const id = body.publications[0]?.id;
    if (id) {
      await check(`/api/publications/${encodeURIComponent(id)}`, 200);
      await check(`/content/${encodeURIComponent(id)}`, 200);
    } else console.log('SKIP public project: publish a development project first');
  });
  await check('/api/health', 200);
  process.exitCode = failures ? 1 : 0;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
