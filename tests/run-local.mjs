import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";

const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", resolve);
});
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "pipe" });
let serverOutput = "";
server.stdout.on("data", chunk => serverOutput += chunk);
server.stderr.on("data", chunk => serverOutput += chunk);
server.once("error", error => { serverOutput += error.message; });
async function run(args) {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: { ...process.env, TEST_URL: origin } });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(new Error(`${args.join(" ")} exited ${code}`)));
  });
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Local server exited: ${serverOutput}`);
    try { ready = (await fetch(origin)).ok; } catch {}
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error(`Local server did not become ready: ${serverOutput}`);
  console.log(`Testing isolated local frontend at ${origin}`);
  await run(["--test", "tests/api.test.js", "tests/exports.test.js", "tests/rules.test.js", "tests/validation.test.js"]);
  for (const suite of ["startup", "buttons", "upgrades", "storage-upgrade", "ocr-errors", "ocr-browser", "documents"]) {
    console.log(`RUN ${suite}`);
    await run([`tests/${suite}.mjs`]);
  }
  console.log("PASS all local unit, button, batch, storage, OCR and documentation checks");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  server.kill();
}
