import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { createDashboard } from "../src/dashboard.js";
import { readConfig } from "../src/config.js";
import { handleMessage } from "../src/messages.js";

const webKey = "test-password-with-more-than-24-characters";
const valid = { DISCORD_TOKEN: "test-token", WEB_KEY: webKey };

test("configuration rejects missing secrets and unsafe port values", () => {
  for (const env of [{}, { DISCORD_TOKEN: "token" }, { ...valid, WEB_KEY: "short" },
    { ...valid, WEB_KEY: " " + webKey }, { ...valid, DISCORD_TOKEN: " " }])
    assert.throws(() => readConfig(env));
  for (const PORT of ["0", "-1", "65536", "3e3", "3000abc", "", "1.5"])
    assert.throws(() => readConfig({ ...valid, PORT }));
  assert.equal(readConfig(valid).host, "127.0.0.1");
  assert.equal(readConfig(valid).port, 3000);
  assert.equal(readConfig({ ...valid, PORT: "65535" }).port, 65535);
  assert.throws(() => createDashboard({ webKey: "" }));
});

test("web panel authentication, restart protection and status", async (t) => {
  let restarts = 0;
  const status = { connected: false, guilds: 0, uptimeSec: 12, readySec: null };
  const app = createDashboard({ webKey, port: 3000, getStatus: () => status, onRestart: () => { restarts++; } });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = "http://127.0.0.1:" + server.address().port;
  const api = { "x-api-key": webKey };
  const browser = { authorization: "Basic " + Buffer.from("admin:" + webKey).toString("base64") };
  await t.test("public liveness reveals no Discord details", async () => {
    const r = await fetch(url + "/healthz");
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { status: "ok" });
  });
  await t.test("dashboard and API reject missing or wrong credentials", async () => {
    for (const path of ["/", "/api/status", "/restart"]) {
      const r = await fetch(url + path, { method: path === "/restart" ? "POST" : "GET" });
      assert.equal(r.status, 401);
      assert.match(r.headers.get("www-authenticate"), /^Basic/);
    }
    for (const headers of [{ "x-api-key": "wrong" }, { authorization: "Basic malformed" },
      { authorization: "Basic " + Buffer.from("other:" + webKey).toString("base64") }]) {
      assert.equal((await fetch(url, { headers })).status, 401);
    }
    assert.equal(restarts, 0);
  });
  await t.test("browser login works without putting secrets in HTML", async () => {
    const r = await fetch(url, { headers: browser });
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /Not connected/);
    assert.match(html, /X-Requested-With/);
    assert.ok(!html.includes(webKey));
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  });
  await t.test("API key authentication exposes current status", async () => {
    const r = await fetch(url + "/api/status", { headers: api });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), status);
  });
  await t.test("cross-site form-style restart and GET cannot restart", async () => {
    for (const headers of [api, browser, { ...browser, "x-requested-with": "wrong" }])
      assert.equal((await fetch(url + "/restart", { method: "POST", headers })).status, 403);
    assert.equal((await fetch(url + "/restart", { headers: api })).status, 404);
    assert.equal(restarts, 0);
  });
  await t.test("authenticated explicit restart runs once", async () => {
    const headers = { ...browser, "x-requested-with": "discord-bot" };
    assert.equal((await fetch(url + "/restart", { method: "POST", headers })).status, 202);
    assert.equal(restarts, 1);
    assert.equal((await fetch(url + "/restart", { method: "POST", headers })).status, 409);
    assert.equal(restarts, 1);
  });
});

test("ping replies safely; bots, DMs and other commands are ignored", async () => {
  const replies = [];
  const message = { author: { bot: false }, inGuild: () => true, content: "!ping",
    reply: async (reply) => replies.push(reply) };
  await handleMessage(message);
  assert.deepEqual(replies, [{ content: "pong 🏓", allowedMentions: { repliedUser: false } }]);
  await handleMessage({ ...message, author: { bot: true } });
  await handleMessage({ ...message, inGuild: () => false });
  await handleMessage({ ...message, content: "!unknown" });
  assert.equal(replies.length, 1);
  const errors = [];
  await handleMessage({ ...message, reply: async () => { throw new Error("private details"); } },
    (error) => errors.push(error));
  assert.equal(errors.length, 1);
  assert.ok(!errors[0].includes("private details"));
});

test("invalid startup exits without revealing credentials or connecting to Discord", () => {
  const secret = "never-log-this-token";
  const result = spawnSync(process.execPath, ["index.js"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, DISCORD_TOKEN: secret, WEB_KEY: "short" },
    encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Startup failed/);
  assert.ok(!(result.stdout + result.stderr).includes(secret));
});
