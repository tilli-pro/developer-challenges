import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyAcmeSignature } from "../src/services/signature";
import { NOW, NOW_SECONDS, SECRET, signatureHeader } from "./helpers";

const body = '{"id":"evt_001","type":"payment.succeeded"}';
const now = () => NOW;

describe("verifyAcmeSignature", () => {
  it("accepts a header signed with the secret", () => {
    assert.equal(
      verifyAcmeSignature(signatureHeader(body), body, SECRET, now),
      true,
    );
  });

  it("rejects a header signed with another secret", () => {
    const header = signatureHeader(body, "not-the-secret");
    assert.equal(verifyAcmeSignature(header, body, SECRET, now), false);
  });

  it("rejects a timestamp outside the five minute tolerance", () => {
    const stale = signatureHeader(body, SECRET, NOW_SECONDS - 301);
    const edge = signatureHeader(body, SECRET, NOW_SECONDS - 300);
    assert.equal(verifyAcmeSignature(stale, body, SECRET, now), false);
    assert.equal(verifyAcmeSignature(edge, body, SECRET, now), true);
  });

  it("rejects malformed headers", () => {
    const valid = signatureHeader(body);
    const [t, v1] = valid.split(",") as [string, string];
    for (const header of [
      "",
      t,
      v1,
      `${t},v1=`,
      `${t},v1=zz${v1.slice(5)}`,
      `t=soon,${v1}`,
      `${t},${v1.slice(0, -2)}`,
    ]) {
      assert.equal(
        verifyAcmeSignature(header, body, SECRET, now),
        false,
        header,
      );
    }
  });
});
