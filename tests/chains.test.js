// Tests for the SloposFree exploit-chain registry (includes/js/chains.js).
//
// chains.js is a classic script that also exports via module.exports for this
// harness. Run with: bun test
//
// Coverage:
//   1. registry mapping  — detected target -> best chain id (plan's table)
//   2. parseTarget       — UA -> 0xC_MM_mm, plus regex-source agreement with
//                          src/config.mjs (guards the deliberate duplication)
//   3. registry/DOM/i18n — every non-null el has a radio in index.html and a
//                          matching label key in en.js
//   4. helpers           — console bits, bounds, float<->target bridges

import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const chains = require(join(ROOT, "includes/js/chains.js"));
const {
  EXPLOIT_CHAINS,
  parseTarget,
  targetIsPS4,
  targetIsPS5,
  chainById,
  chainsForTarget,
  bestChainForTarget,
  targetBounds,
  isTargetSupported,
  fwToTarget,
  targetToFloat,
} = chains;

const PS5 = 0x10000;

// ---------------------------------------------------------------------------
// 1. registry mapping — the regression the whole redesign exists to prevent
// ---------------------------------------------------------------------------

describe("bestChainForTarget", () => {
  const cases = [
    // PS4
    [0x00672, 2], // 6.7x badhoist (rank 90, specific window)
    [0x00700, 4], // cssfontface lapse (rank 25) outranks psfree bundle (20)
    [0x00900, 3], // cssfontface netctrl (rank 30) beats lapse (25) + psfree
    [0x00960, 3], // still cssfontface netctrl at the top of psfree's range
    [0x01102, 5], // slopkit lapse (11.00-11.02, rank 40) overlaps cssfontface
    [0x01100, 5], // slopkit lapse (rank 40) beats cssfontface (30)
    [0x01150, 5],
    [0x01202, 5], // last of slopkit lapse range
    [0x01250, 6], // slopkit netctrl
    [0x01300, 6], // last of slopkit netctrl range
    [0x01302, 7], // relapse
    [0x01351, 7], // inside relapse's 13.02-13.52 range (no gap)
    [0x01352, 7], // last of relapse range
    [0x00600, 4], // only cssfontface lapse covers 6.00
    // unsupported
    [0x00505, null], // below everything
    [0x01400, null], // above every PS4 chain
  ];

  for (const [target, expectedId] of cases) {
    test(`0x${target.toString(16).padStart(5, "0")} -> ${expectedId}`, () => {
      const best = bestChainForTarget(target);
      expect(best ? best.id : null).toBe(expectedId);
    });
  }

  test("PS5 11.00 returns null and NOT PS4's slopkit row 5", () => {
    const best = bestChainForTarget(PS5 | 0x01100); // 0x11100
    expect(best).toBeNull();
  });

  test("null / undefined targets are unsupported, not throwing", () => {
    expect(bestChainForTarget(null)).toBeNull();
    expect(bestChainForTarget(undefined)).toBeNull();
    expect(isTargetSupported(null)).toBe(false);
  });
});

describe("chainsForTarget ordering", () => {
  test("overlap at 0x00900 lists all matches by rank desc", () => {
    const ids = chainsForTarget(0x00900).map((c) => c.id);
    // 9.00 matches: netctrl(30), lapse(25), psfree bundle(20), modular(10)
    expect(ids).toEqual([3, 4, 1, 0]);
  });

  test("0x00700 lists both psfree rows plus cssfontface lapse", () => {
    const ids = chainsForTarget(0x00700).map((c) => c.id);
    // bundle(20) > psfree modular(10) but cssfontface lapse(25) outranks both
    expect(ids).toEqual([4, 1, 0]);
  });
});

// ---------------------------------------------------------------------------
// 2. parseTarget
// ---------------------------------------------------------------------------

describe("parseTarget", () => {
  const uaCases = [
    [
      "Mozilla/5.0 (PlayStation 4 11.00) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      0x01100,
    ],
    [
      "Mozilla/5.0 (PlayStation 4/11.00) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      0x01100,
    ],
    [
      "Mozilla/5.0 (PlayStation 4 13.02) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      0x01302,
    ],
    [
      "Mozilla/5.0 (PlayStation; PlayStation 5/9.60) AppleWebKit/605.1.15 (KHTML, like Gecko)",
      0x10960,
    ],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", null],
    ["totally not a playstation", null],
    ["", null],
  ];

  for (const [ua, expected] of uaCases) {
    test(JSON.stringify(ua).slice(0, 60), () => {
      expect(parseTarget(ua)).toBe(expected);
    });
  }

  test("PS4 UA is PS4, PS5 UA is PS5", () => {
    const ps4 = parseTarget(
      "Mozilla/5.0 (PlayStation 4 11.00) AppleWebKit/605.1.15 (KHTML, like Gecko)",
    );
    const ps5 = parseTarget(
      "Mozilla/5.0 (PlayStation; PlayStation 5/9.60) AppleWebKit/605.1.15 (KHTML, like Gecko)",
    );
    expect(targetIsPS4(ps4)).toBe(true);
    expect(targetIsPS5(ps4)).toBe(false);
    expect(targetIsPS5(ps5)).toBe(true);
    expect(targetIsPS4(ps5)).toBe(false);
  });

  // Guards the deliberate duplication: chains.js carries its own copy of
  // src/config.mjs get_target_from_ua's regex. Assert the regex SOURCE is
  // byte-identical between the two files so they cannot drift.
  test("regex source matches src/config.mjs", () => {
    const extract = (src) => {
      const m = src.match(/const pattern = (\/\^Mozilla[\s\S]*?\/);/);
      if (!m) throw new Error("could not locate pattern regex");
      return m[1];
    };
    const chainsSrc = readFileSync(
      join(ROOT, "includes/js/chains.js"),
      "utf8",
    ).replace("var pattern =", "const pattern =");
    const configSrc = readFileSync(join(ROOT, "src/config.mjs"), "utf8");
    expect(extract(chainsSrc)).toBe(extract(configSrc));
  });
});

// ---------------------------------------------------------------------------
// 3. registry <-> DOM <-> i18n consistency
// ---------------------------------------------------------------------------

describe("registry / DOM / en.js consistency", () => {
  const indexHtml = readFileSync(join(ROOT, "index.html"), "utf8");
  const enJs = readFileSync(join(ROOT, "includes/js/languages/en.js"), "utf8");

  for (const c of EXPLOIT_CHAINS) {
    if (!c.el) continue; // badhoist has no radio

    test(`${c.el}: radio has value="${c.id}"`, () => {
      // label wrapper exists
      expect(indexHtml).toContain(`id="${c.el}"`);
      // and its radio input carries this chain's persisted id
      const labelIdx = indexHtml.indexOf(`id="${c.el}"`);
      const slice = indexHtml.slice(labelIdx, labelIdx + 300);
      expect(slice).toContain(`value="${c.id}"`);
    });

    test(`${c.el}: <p> label key exists in en.js`, () => {
      // convention: label <p> id == el minus the "Exp" suffix
      const key = c.el.replace(/Exp$/, "");
      expect(indexHtml).toContain(`id="${key}"`);
      expect(enJs).toContain(`"${key}"`);
    });
  }

  test("chain ids are unique", () => {
    const ids = EXPLOIT_CHAINS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every row is kernel-caps (no PS5 userland row registered yet)", () => {
    for (const c of EXPLOIT_CHAINS) expect(c.caps).toBe("kernel");
  });
});

// ---------------------------------------------------------------------------
// 4. helpers
// ---------------------------------------------------------------------------

describe("targetBounds", () => {
  test("PS4 bounds span 6.00 (0x00600) to 13.52 (0x01352)", () => {
    const b = targetBounds(0);
    expect(b.min).toBe(0x00600);
    expect(b.max).toBe(0x01352);
  });

  test("PS5 has no registered chain -> null bounds", () => {
    const b = targetBounds(PS5);
    expect(b.min).toBeNull();
    expect(b.max).toBeNull();
  });
});

describe("fwToTarget / targetToFloat bridges", () => {
  test("fwToTarget PS4", () => {
    expect(fwToTarget("11.00", 0)).toBe(0x01100);
    expect(fwToTarget(9.6, 0)).toBe(0x00960);
    expect(fwToTarget("13.02", 0)).toBe(0x01302);
  });

  test("fwToTarget PS5 sets the console bit", () => {
    expect(fwToTarget("9.60", PS5)).toBe(0x10960);
  });

  test("fwToTarget garbage -> NaN (treated as unsupported)", () => {
    expect(Number.isNaN(fwToTarget("nope", 0))).toBe(true);
    expect(isTargetSupported(fwToTarget("nope", 0))).toBe(false);
  });

  test("targetToFloat round-trips", () => {
    expect(targetToFloat(0x01100)).toBe("11.00");
    expect(targetToFloat(0x00960)).toBe("9.60");
    expect(targetToFloat(0x01302)).toBe("13.02");
    expect(targetToFloat(null)).toBeNull();
  });
});

describe("chainById / runChain guard", () => {
  test("chainById returns the row or null", () => {
    expect(chainById(7).el).toBe("relapseExp");
    expect(chainById(99)).toBeNull();
  });

  test("runChain rejects an unknown id", async () => {
    await expect(chains.runChain(99)).rejects.toThrow(/no chain with id 99/);
  });
});
