import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_THEME, darkenHex, isHexColor, resolveTheme, themeCssVars } from "../src/lib/theme";

test("accepts six-digit hex only", () => {
  assert.equal(isHexColor("#FF4F00"), true);
  assert.equal(isHexColor("#ff4f00"), true);
  assert.equal(isHexColor("FF4F00"), false);
  assert.equal(isHexColor("#FFF"), false);
});

test("clinics inherit Santh Digital orange when no brand_primary is set", () => {
  const theme = resolveTheme({ brand_primary: null, logo_url: null });
  assert.equal(theme.brand, DEFAULT_THEME.brand);
  assert.equal(theme.custom, false);
  assert.equal(themeCssVars({ brand_primary: null }), undefined);
});

test("a clinic hex remaps --brand so buttons and nav follow", () => {
  const vars = themeCssVars({ brand_primary: "#0B6E4F" });
  assert.equal(vars?.["--brand"], "#0B6E4F");
  assert.equal(vars?.["--brand-hover"], darkenHex("#0B6E4F"));
});

test("invalid clinic colours are ignored", () => {
  assert.equal(themeCssVars({ brand_primary: "orange" }), undefined);
  assert.equal(resolveTheme({ brand_primary: "orange" }).brand, DEFAULT_THEME.brand);
});
