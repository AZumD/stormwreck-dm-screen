/**
 * LocalApiClient per-key write serialization.
 * Run: node test/validate-write-queue.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function pass(msg) {
  console.log("OK:", msg);
}

const src = fs.readFileSync(path.join(root, "js/core/local-api-client.js"), "utf8");
if (!src.includes(".catch(() => undefined)") || !src.includes("startWrite")) {
  fail("trackWrite must chain factories and ignore prior rejection");
} else pass("trackWrite chains factories");

(async () => {
  const order = [];
  const saveLog = [];

  const sandbox = {
    window: {
      SaveStatus: {
        saving: () => saveLog.push("saving"),
        saved: () => saveLog.push("saved"),
        failed: () => saveLog.push("failed")
      }
    },
    fetch: async () => ({
      ok: true,
      text: async () => JSON.stringify({ ok: true })
    }),
    console
  };
  sandbox.window = Object.assign(sandbox.window, sandbox);
  /* LocalApiClient attaches to window */
  vm.runInNewContext(src, { window: sandbox.window, fetch: sandbox.fetch, console });

  const client = sandbox.window.LocalApiClient;
  if (!client?._trackWrite) {
    fail("LocalApiClient._trackWrite missing");
  } else {
    pass("LocalApiClient loaded");

    /* Same-key ordering */
    const key = "doc:test:notes";
    const p1 = client._trackWrite(key, async () => {
      order.push("start-1");
      await new Promise((r) => setTimeout(r, 40));
      order.push("end-1");
      return "one";
    });
    const p2 = client._trackWrite(key, async () => {
      order.push("start-2");
      await new Promise((r) => setTimeout(r, 10));
      order.push("end-2");
      return "two";
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    if (r1 !== "one" || r2 !== "two") fail("write results wrong");
    else pass("write results");

    const expected = ["start-1", "end-1", "start-2", "end-2"];
    if (order.join(",") !== expected.join(",")) {
      fail(`order was ${order.join(",")} expected ${expected.join(",")}`);
    } else pass("same-key writes execute in order");

    /* Failed write does not block next */
    const key2 = "cat:npc:gideon";
    let failedWrite = false;
    const f1 = client._trackWrite(key2, async () => {
      throw new Error("boom");
    }).catch(() => {
      failedWrite = true;
    });
    const f2 = client._trackWrite(key2, async () => "recovered");
    await f1;
    const recovered = await f2;
    if (!failedWrite) fail("first write should fail");
    else pass("failed write surfaces");
    if (recovered !== "recovered") fail("second write blocked by prior failure");
    else pass("failed write does not block next");

    if (!saveLog.includes("saving") || !saveLog.includes("saved") || !saveLog.includes("failed")) {
      fail(`SaveStatus not exercised: ${saveLog.join(",")}`);
    } else pass("SaveStatus saving/saved/failed");

    /* Different keys may overlap */
    const parallel = [];
    const a = client._trackWrite("key-a", async () => {
      parallel.push("a-start");
      await new Promise((r) => setTimeout(r, 30));
      parallel.push("a-end");
    });
    const b = client._trackWrite("key-b", async () => {
      parallel.push("b-start");
      await new Promise((r) => setTimeout(r, 5));
      parallel.push("b-end");
    });
    await Promise.all([a, b]);
    const bStartedBeforeAEnd = parallel.indexOf("b-start") < parallel.indexOf("a-end");
    if (!bStartedBeforeAEnd) fail("different keys should allow concurrency");
    else pass("different keys concurrent");
  }

  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll write-queue checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
