import assert from "node:assert/strict";

const [mode, baseUrl = "http://127.0.0.1:3000"] = process.argv.slice(2);
assert.ok(["development", "production"].includes(mode), "Usage: node scripts/check-access-preview.mjs development|production [baseUrl]");
const isDevelopment = mode === "development";
const publications = ["membership-experiences", "creator-toolkit", "behind-the-proof"];
const clientScripts = new Set();

async function checkPage(path, unlocked, expectedStatus = 200) {
  const response = await fetch(new URL(path, baseUrl));
  const html = await response.text();
  assert.equal(response.status, expectedStatus, `HTTP status: ${path}`);
  assert.equal(html.includes("Premium demo:"), unlocked, `Premium delivery: ${path}`);
  assert.equal(html.includes("CONTENT UNLOCKED"), unlocked, `Access status: ${path}`);
  if (expectedStatus === 200) {
    assert.equal(html.includes("Development preview · Fictional content"), isDevelopment);
    assert.equal(/<button[^>]*disabled[^>]*>Subscribe<\/button>/.test(html), !unlocked);
    assert.ok(html.includes("Public preview"));
    if (unlocked) {
      assert.ok(html.includes("Demo access · No membership verified"));
      assert.equal((html.match(/<p[^>]*>Premium demo:/g) ?? []).length, 1);
    }
  }
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    if (match[1].startsWith("/")) clientScripts.add(match[1].replaceAll("&amp;", "&"));
  }
  console.log(`PASS ${mode}: ${path}`);
}

for (const id of publications) {
  await checkPage(`/content/${id}`, false);
  await checkPage(`/content/${id}?previewAccess=unlocked`, isDevelopment);
  // A later Locked response must not retain the preceding preview's body.
  await checkPage(`/content/${id}`, false);
}
await checkPage("/content/membership-experiences?previewAccess=invalid", false);
await checkPage("/content/membership-experiences?previewAccess=unlocked&previewAccess=locked", false);
await checkPage("/content/missing?previewAccess=unlocked", false, 404);

for (const path of clientScripts) {
  const response = await fetch(new URL(path, baseUrl));
  assert.equal(response.status, 200, `Client script: ${path}`);
  assert.ok(!(await response.text()).includes("Premium demo:"), `Fixtures bundled for client: ${path}`);
}
console.log(`PASS: premium fixtures absent from ${clientScripts.size} client scripts`);
