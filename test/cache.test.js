import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fetchImages } from "../src/index.js";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "erl-images-test-"));
}

// A cache hit must return existing files WITHOUT any network call. We prove
// "no network" by pointing fetch at a dir that already satisfies count: if the
// function tried to reach Bing this test would still pass offline, so we also
// assert the returned files are exactly the seeded ones.
test("cache hit returns existing files and does not add new ones", async () => {
  const dir = tmpDir();
  const seeded = [
    "area-0123456789ab.webp",
    "area-abcdef012345.webp",
  ];
  for (const f of seeded) fs.writeFileSync(path.join(dir, f), Buffer.alloc(6000, 1));

  const before = fs.readdirSync(dir).length;
  const results = await fetchImages("anything at all", {
    count: 2,
    outDir: dir,
    namePrefix: "area",
  });
  const after = fs.readdirSync(dir).length;

  assert.equal(after, before, "no files were downloaded");
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.cached === true));
  assert.deepEqual(results.map((r) => r.filename).sort(), seeded.sort());
  fs.rmSync(dir, { recursive: true, force: true });
});

test("prefix match is exact — 'area' does not consume 'area-harbour' files", async () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, "area-harbour-0123456789ab.webp"), Buffer.alloc(6000, 1));

  // Only 'area-harbour' exists; asking for prefix 'area' count 1 must NOT treat
  // the harbour file as a cache hit. With no network in this offline test the
  // fetch simply yields nothing, so results should be empty (not the harbour file).
  const results = await fetchImages("x", {
    count: 1,
    outDir: dir,
    namePrefix: "area",
    timeoutMs: 1,
  }).catch(() => []);

  assert.ok(!results.some((r) => r.filename === "area-harbour-0123456789ab.webp"));
  fs.rmSync(dir, { recursive: true, force: true });
});
