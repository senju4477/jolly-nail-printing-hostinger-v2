import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createConnection } from "mysql2/promise";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixtures = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let preview;

async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function startApp(extra = {}, defaultPort = false) {
  const port = defaultPort ? 3000 : await freePort();
  const env = { ...process.env, SITE_INDEXABLE: "false", SITE_URL: `http://127.0.0.1:${port}` };
  for (const key of ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_SSL", "DB_SSL_CA", "PORT"]) delete env[key];
  if (!defaultPort) env.PORT = String(port);
  Object.assign(env, extra);
  const child = spawn(process.execPath, ["scripts/start-standalone.mjs"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout.on("data", value => { logs += value; });
  child.stderr.on("data", value => { logs += value; });
  const fixture = { child, origin: `http://127.0.0.1:${port}`, get logs() { return logs; } };
  fixtures.push(fixture);
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error(`Production server exited: ${logs}`);
    try { if ((await fetch(fixture.origin)).ok) return fixture; } catch { /* Startup in progress. */ }
    await delay(50);
  }
  throw new Error(`Production server did not become ready: ${logs}`);
}
async function stopApp(fixture) {
  if (fixture.child.exitCode !== null) return;
  fixture.child.kill("SIGTERM");
  const forced = setTimeout(() => fixture.child.kill("SIGKILL"), 2000);
  await new Promise(resolve => fixture.child.once("exit", resolve));
  clearTimeout(forced);
}
const enquiry = () => ({
  name: "[JOLLY TEST] Café 🦋", organisation: "[JOLLY TEST] Venue",
  email: "jolly-test@example.invalid", phone: "+61 400 000 000",
  venueType: "Shopping centre", city: "Melbourne", message: "Unicode 🦋 and a quote: ' ; DROP TABLE venue_enquiries; --\nSecond line.",
  website: "", consent: true, submissionId: randomUUID(),
});
const post = (fixture, body, headers = {}) => fetch(`${fixture.origin}/api/venue-enquiries`, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: fixture.origin, ...headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

before(async () => { preview = await startApp(); });
after(async () => { for (const fixture of fixtures) await stopApp(fixture); });

test("preview metadata, robots, empty sitemap, 404 and method handling", async () => {
  const response = await fetch(preview.origin);
  const html = await response.text();
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /Nail art,/);
  const robots = await (await fetch(`${preview.origin}/robots.txt`)).text();
  assert.match(robots, /Disallow: \//);
  assert.doesNotMatch(await (await fetch(`${preview.origin}/sitemap.xml`)).text(), /<loc>/);
  assert.equal((await fetch(`${preview.origin}/not-a-real-page`)).status, 404);
  assert.equal((await fetch(`${preview.origin}/api/venue-enquiries`)).status, 405);
});

test("every public asset is served byte-for-byte, plus compiled CSS and JS", async () => {
  async function inspect(directory, relative = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const rel = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) { await inspect(path.join(directory, entry.name), rel); continue; }
      const response = await fetch(`${preview.origin}/${rel}`);
      assert.equal(response.status, 200, rel);
      const local = await readFile(path.join(directory, entry.name));
      const served = Buffer.from(await response.arrayBuffer());
      assert.equal(createHash("sha256").update(served).digest("hex"), createHash("sha256").update(local).digest("hex"), rel);
    }
  }
  await inspect(path.join(root, "public"));
  const html = await (await fetch(preview.origin)).text();
  const css = [...html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map(match => match[1]);
  assert.ok(css.length);
  for (const asset of css) {
    const response = await fetch(`${preview.origin}${asset}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/css/);
    assert.match(await response.text(), /\.hero/);
  }
  const scripts = [...html.matchAll(/src="([^"]+\.js(?:\?[^"]*)?)"/g)].map(match => match[1]);
  assert.ok(scripts.length);
  for (const asset of scripts) assert.equal((await fetch(`${preview.origin}${asset}`)).status, 200);
});

test("enquiry validation, origin, honeypot and bounded request bodies", async () => {
  for (const [body, headers, status] of [
    ["{", {}, 400], [enquiry(), { "Content-Type": "text/plain" }, 415],
    [enquiry(), { Origin: "https://unrelated.example" }, 403],
    [{ ...enquiry(), website: "bot.example" }, {}, 400],
    [{ ...enquiry(), consent: false }, {}, 400],
    [{ ...enquiry(), submissionId: "invalid-id" }, {}, 400],
    [{ ...enquiry(), email: "invalid" }, {}, 400],
    [{ ...enquiry(), message: "x".repeat(3001) }, {}, 400],
    ["x".repeat(12001), {}, 413],
  ]) assert.equal((await post(preview, body, headers)).status, status);
});

test("missing database never returns saved:true", async () => {
  const response = await post(preview, enquiry());
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.ok(body.error);
  assert.notEqual(body.saved, true);
});

test("default port and injected hostname still bind on all interfaces", async () => {
  const fixture = await startApp({ HOSTNAME: "a-container-hostname.invalid" }, true);
  assert.equal((await fetch(fixture.origin)).status, 200);
  assert.match(fixture.logs, /0\.0\.0\.0:3000/);
  await stopApp(fixture);
});

test("offline export conversion preserves Unicode and rejects conflicting duplicate IDs", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "jolly-convert-"));
  try {
    const example = enquiry();
    const row = { id: example.submissionId, reference: "JLY-" + example.submissionId.replaceAll("-", "").slice(0, 8).toUpperCase(),
      name: example.name, organisation: example.organisation, email: example.email, phone: example.phone,
      venue_type: example.venueType, city: example.city, message: example.message, contact_consent: 1, created_at: 1780000000000 };
    async function convert(rows, name) {
      const input = path.join(dir, name + ".json");
      const output = path.join(dir, name + ".sql");
      await writeFile(input, JSON.stringify(rows));
      const child = spawn(process.execPath, ["scripts/convert-d1-export.mjs", input, output], { cwd: root, stdio: "ignore" });
      const code = await new Promise(resolve => child.once("exit", resolve));
      return { code, output };
    }
    const good = await convert([row, row], "good");
    assert.equal(good.code, 0);
    const sql = await readFile(good.output, "utf8");
    assert.match(sql, /Expected unique rows: 1; identical duplicate rows omitted: 1/);
    assert.ok(sql.includes(Buffer.from(row.message).toString("hex")));
    assert.doesNotMatch(sql, /INSERT INTO venue_enquiries \(/);
    const bad = await convert([row, { ...row, message: "changed" }], "conflict");
    assert.notEqual(bad.code, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("real isolated MySQL: setup retry, durable writes, replay, concurrency and connection failure", {
  skip: process.env.JOLLY_TEST_DATABASE !== "1", timeout: 60_000,
}, async () => {
  assert.match(process.env.DB_NAME ?? "", /^jolly_test_[a-z0-9_]+$/);
  const dbEnv = Object.fromEntries(["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"].map(key => [key, process.env[key]]));
  const db = await createConnection({ host: dbEnv.DB_HOST, port: Number(dbEnv.DB_PORT || 3306), user: dbEnv.DB_USER,
    password: dbEnv.DB_PASSWORD, database: dbEnv.DB_NAME, multipleStatements: true, charset: "utf8mb4", supportBigNumbers: true, bigNumberStrings: true });
  try {
    const [[engine]] = await db.query("SELECT VERSION() AS version");
    console.log(`Database engine tested: ${engine.version}`);
    const schema = await readFile(path.join(root, "deploy/schema.mysql.sql"), "utf8");
    await db.query(schema);
    await db.query(schema);
    const [[ledger]] = await db.query("SELECT COUNT(*) AS count FROM schema_migrations");
    assert.equal(Number(ledger.count), 1);
    await db.query("DELETE FROM venue_enquiries");
    const app = await startApp(dbEnv);
    const original = enquiry();
    const beforeWrite = Date.now();
    const first = await post(app, original);
    assert.equal(first.status, 201);
    assert.equal((await first.json()).saved, true);
    const replay = await post(app, { ...original, message: "A retry must not overwrite the committed details." });
    assert.equal(replay.status, 201);
    const [[saved]] = await db.execute("SELECT * FROM venue_enquiries WHERE id = ?", [original.submissionId]);
    assert.equal(saved.name, original.name);
    assert.equal(saved.message, original.message);
    assert.equal(saved.contact_consent, 1);
    assert.ok(Number(saved.created_at) >= beforeWrite && Number(saved.created_at) <= Date.now());
    const exportDir = await mkdtemp(path.join(tmpdir(), "jolly-mysql-export-"));
    try {
      const input = path.join(exportDir, "source.json");
      const output = path.join(exportDir, "staged.sql");
      const migratedId = randomUUID();
      const migrated = { ...saved, id: migratedId, reference: "JLY-" + migratedId.replaceAll("-", "").slice(0, 8).toUpperCase() };
      await writeFile(input, JSON.stringify([saved, migrated]), { mode: 0o600 });
      const converter = spawn(process.execPath, ["scripts/convert-d1-export.mjs", input, output], { cwd: root, stdio: "ignore" });
      assert.equal(await new Promise(resolve => converter.once("exit", resolve)), 0);
      const staging = await readFile(output, "utf8");
      const review = await readFile(output + ".review.sql", "utf8");
      await db.query(staging);
      await db.query(staging);
      const [checks] = await db.query(review);
      assert.equal(Number(checks[0][0].staged_count), 2);
      assert.equal(Number(checks[1][0].conflicting_existing_rows), 0);
      assert.equal(Number(checks[2][0].new_rows), 1);
      await db.execute("UPDATE venue_enquiries_import SET message=? WHERE id=?", ["A conflicting export", saved.id]);
      const [conflict] = await db.query(review);
      assert.equal(Number(conflict[1][0].conflicting_existing_rows), 1);
      await db.execute("UPDATE venue_enquiries_import SET message=? WHERE id=?", [saved.message, saved.id]);
      const merge = review.slice(review.indexOf("-- START TRANSACTION;")).replace(/^-- /gm, "");
      await db.query(merge);
      await db.query(merge);
      const [[imported]] = await db.execute("SELECT * FROM venue_enquiries WHERE id=?", [migrated.id]);
      assert.equal(imported.message, saved.message);
      assert.equal(String(imported.created_at), String(saved.created_at));
    } finally { await rm(exportDir, { recursive: true, force: true }); }
    const shared = enquiry();
    const requests = [...Array.from({ length: 8 }, () => post(app, shared)), ...Array.from({ length: 10 }, () => post(app, enquiry()))];
    for (const response of await Promise.all(requests)) assert.equal(response.status, 201);
    const [[count]] = await db.query("SELECT COUNT(*) AS count FROM venue_enquiries");
    assert.equal(Number(count.count), 13);
    await stopApp(app);
    // Read after the application process exits: writes must remain durable.
    const [[durable]] = await db.query("SELECT COUNT(*) AS count FROM venue_enquiries");
    assert.equal(Number(durable.count), 13);
    const offline = await startApp({ ...dbEnv, DB_PORT: "1" });
    const failed = await post(offline, enquiry());
    assert.equal(failed.status, 503);
    assert.notEqual((await failed.json()).saved, true);
    assert.ok(!offline.logs.includes(original.email) && !offline.logs.includes(original.message));
  } finally {
    await db.query("DELETE FROM venue_enquiries");
    await db.end();
  }
});
