import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlocked } from "../src/index.js";

test("blocks core stock agencies", () => {
  assert.ok(isBlocked("https://www.alamy.com/foo.jpg"));
  assert.ok(isBlocked("https://image.shutterstock.com/x/photo.jpg"));
  assert.ok(isBlocked("https://media.gettyimages.com/id/1/photo.jpg"));
  assert.ok(isBlocked("https://as2.ftcdn.net/v2/jpg/123.jpg"));
});

test("blocks editorial wire + paparazzi agencies", () => {
  assert.ok(isBlocked("https://www.reuters.com/x.jpg"));
  assert.ok(isBlocked("https://backgrid.com/y.jpg"));
  assert.ok(isBlocked("https://cdn.zumapress.com/z.jpg"));
});

test("blocks aggregators and pinterest cdn", () => {
  assert.ok(isBlocked("https://i.pinimg.com/564x/ab/cd.jpg"));
  assert.ok(isBlocked("https://www.pinterest.com/pin/1.jpg"));
});

test("blocks hotlinked stock slug on a clean-looking host", () => {
  assert.ok(isBlocked("https://some-random-blog.co.uk/uploads/shutterstock_123456.jpg"));
  assert.ok(isBlocked("https://tradesite.com/img/watermark-hero.jpg"));
});

test("blocks trade-service competitors", () => {
  assert.ok(isBlocked("https://www.checkatrade.com/logo.jpg"));
  assert.ok(isBlocked("https://servicetitan.com/hero.png"));
});

test("allows genuinely free CC0 hosts", () => {
  assert.equal(isBlocked("https://images.unsplash.com/photo-1.jpg"), false);
  assert.equal(isBlocked("https://images.pexels.com/photos/1/x.jpg"), false);
  assert.equal(isBlocked("https://cdn.pixabay.com/photo/2020/x.jpg"), false);
});

test("allows a neutral third-party host with no stock markers", () => {
  assert.equal(isBlocked("https://myplumbingclient.co.uk/assets/team.jpg"), false);
});

test("handles malformed urls without throwing", () => {
  assert.equal(isBlocked("not a url"), false);
});
