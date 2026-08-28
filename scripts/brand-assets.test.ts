import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const brandDir = join(process.cwd(), "public", "brand");

test("required brand assets are present", () => {
  for (const file of ["favicon.png", "mark.png", "wordmark.png", "lockup.png"]) {
    const path = join(brandDir, file);
    assert.equal(existsSync(path), true, `missing ${file}`);
    assert.ok(statSync(path).size > 1000, `${file} is too small`);
  }
});
