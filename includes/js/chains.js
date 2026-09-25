// chains.js — the single source of truth mapping a detected console+firmware
// target to the exploit chain(s) that can run on it.
//
// This is a CLASSIC script on purpose. It is consumed by checkFw.js and
// index.js (both classic) and must run on consoles down to FW 6.00, where
// relying on <script type="module"> for the page's core logic risks a silently
// dead page. It therefore carries its own parseTarget() mirroring
// src/config.mjs:69-81 rather than importing it. A test (tests/) asserts the
// two implementations agree over a UA table so they cannot drift.
//
// Target encoding (see src/config.mjs:26-36): 0xC_MM_mm
//   C  console bit  — PS4 (0x0....) or PS5 (0x1....)
//   MM major version, BCD (integer part of the firmware version)
//   mm minor version, BCD (fractional part)
// examples: PS4 9.60 -> 0x00960 ; PS4 13.02 -> 0x01302 ; PS5 9.60 -> 0x10960

// ---------------------------------------------------------------------------
// Detection — mirror of src/config.mjs get_target_from_ua()
// ---------------------------------------------------------------------------

// Parse a User-Agent into a 0xC_MM_mm target, or null if it is not a
// recognised PlayStation browser. Kept byte-for-byte equivalent to
// src/config.mjs:69-81 (guarded by the agreement test).
function parseTarget(ua) {
  var pattern = /^Mozilla\/5\.0 \(?(?:PlayStation; )?PlayStation (4|5)[ \/]([0-9]{1,2}\.[0-9]{2})\)? AppleWebKit\/[0-9.]+ \(KHTML, like Gecko\)(?: Version\/[0-9.]+ Safari\/[0-9.]+)?$/;
  var match = pattern.exec(ua);
  if (!match) {
    return null;
  }
  var digits = match[2].replace(".", "").padStart(4, "0");
  if (match[1] === "4") {
    return parseInt("0x0" + digits);
  } else if (match[1] === "5") {
    return parseInt("0x1" + digits);
  }
  return null;
}

// console bit helpers
function targetIsPS4(t) { return t !== null && (t & 0x10000) === 0; }
function targetIsPS5(t) { return t !== null && (t & 0x10000) !== 0; }

// Convert a 0xC_MM_mm target back to a display "MM.mm" firmware string (BCD
// nibbles map straight to decimal digits). Used for the cosmetic fw highlight
// and the legacy window.ps4Fw / network-send value. null for garbage.
function targetToFloat(t) {
  if (t === null || t === undefined || isNaN(t)) return null;
  var mm = (t >> 8) & 0xff; // BCD major
  var lo = t & 0xff;        // BCD minor
  var major = ((mm >> 4) & 0xf) * 10 + (mm & 0xf);
  var minorStr = String((lo >> 4) & 0xf) + String(lo & 0xf);
  return major + "." + minorStr;
}

// Convert a legacy float/string firmware (e.g. "11.00", 9.6) to a 0xC_MM_mm
// target. platformBit is 0 for PS4, 0x10000 for PS5. Returns NaN for garbage,
// which every range check below treats as "no match". This is the bridge for
// the PS4-only float call sites (payloads.js, autoJbRetry.js, language.js) that
// still pass window.ps4Fw around.
function fwToTarget(fw, platformBit) {
  var n = Number(fw);
  if (isNaN(n)) return NaN;
  var digits = n.toFixed(2).replace(".", "").padStart(4, "0");
  return parseInt((platformBit ? "0x1" : "0x0") + digits);
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------
//
// One row per chain. Rows are keyed by target RANGE, not by float. Ids keep
// their historical numbers — they are persisted in localStorage and bound to
// index.html radio value= attributes, so renumbering silently re-points every
// existing user's saved choice. Id 2 (badhoist) has no radio (el:null).
//
// fields:
//   id      persisted chain id (localStorage 'exploitChain', radio value)
//   el      wrapper element id in index.html, or null if it has no radio
//   min/max inclusive target range this chain supports (0xC_MM_mm)
//   rank    higher wins when several chains match — the auto-select order
//   caps    'kernel'  full jailbreak: payload injection + success flow
//           'userland' code execution only: no payload, no success flow
//   load()  perform the chain (calls page-provided loader globals)
//   prepare optional pre-step run by runChain() before load()
var EXPLOIT_CHAINS = [
  { id: 0, el: 'modularLapseExp',       min: 0x00700, max: 0x00960, rank: 10, caps: 'kernel',
    load: function () { return psfreeLapse('modular'); } },

  { id: 1, el: 'bundleLapseExp',        min: 0x00700, max: 0x00960, rank: 20, caps: 'kernel',
    load: function () { return psfreeLapse('bundle'); } },

  { id: 2, el: null,                    min: 0x00670, max: 0x00672, rank: 90, caps: 'kernel',
    prepare: function () { return badHoistPrepare(); },
    load: function () { return badHoistJailbreak(); } },

  { id: 3, el: 'cssFontFaceNetCtrlExp', min: 0x00900, max: 0x01102, rank: 30, caps: 'kernel',
    load: function () { return cssFontFaceJailbreak('netctrl'); } },

  { id: 4, el: 'cssFontFaceLapseExp',   min: 0x00600, max: 0x01102, rank: 25, caps: 'kernel',
    load: function () { return cssFontFaceJailbreak('lapse'); } },

  { id: 5, el: 'slopKitLapseExp',       min: 0x01100, max: 0x01202, rank: 40, caps: 'kernel',
    load: function () { return slopKit('lapse'); } },

  { id: 6, el: 'slopKitNetCtrlExp',     min: 0x01250, max: 0x01300, rank: 40, caps: 'kernel',
    load: function () { return slopKit('netctrl'); } },

  { id: 7, el: 'relapseExp',            min: 0x01302, max: 0x01352, rank: 40, caps: 'kernel',
    load: function () { return relapseJailbreak(); } },

  // PS5 rows (0x1_xx_xx) land here — none shipped yet, see plan Step 5.
  // The public PS5 browser chains are userland-only (caps:'userland').
];

// ---------------------------------------------------------------------------
// Lookup helpers (pure)
// ---------------------------------------------------------------------------

function chainById(id) {
  for (var i = 0; i < EXPLOIT_CHAINS.length; i++) {
    if (EXPLOIT_CHAINS[i].id === id) return EXPLOIT_CHAINS[i];
  }
  return null;
}

// Every chain whose range covers this target, highest rank first.
function chainsForTarget(t) {
  if (t === null || t === undefined) return [];
  return EXPLOIT_CHAINS
    .filter(function (c) { return t >= c.min && t <= c.max; })
    .sort(function (a, b) { return b.rank - a.rank; });
}

// The single best chain for a target (highest rank), or null.
function bestChainForTarget(t) {
  var matches = chainsForTarget(t);
  return matches.length ? matches[0] : null;
}

// Derived per-platform min/max, replacing the hardcoded webKitMin/webKitMax.
// Registering a new chain automatically widens the supported window.
function targetBounds(platformBit) {
  var lo = null, hi = null;
  for (var i = 0; i < EXPLOIT_CHAINS.length; i++) {
    var c = EXPLOIT_CHAINS[i];
    if ((c.min & 0x10000) !== platformBit) continue; // wrong console
    if (lo === null || c.min < lo) lo = c.min;
    if (hi === null || c.max > hi) hi = c.max;
  }
  return { min: lo, max: hi };
}

// Is there any chain at all for this target? (derived isSupportedFw)
function isTargetSupported(t) {
  return chainsForTarget(t).length > 0;
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

// Run a chain by id: prepare (if any) then load. The load()/prepare() closures
// call loader globals that each host page (index.js, exploit.html) provides.
async function runChain(id) {
  var chain = chainById(id);
  if (!chain) {
    throw new Error("runChain: no chain with id " + id);
  }
  if (typeof chain.prepare === 'function') {
    await chain.prepare();
  }
  return chain.load();
}

// Export for the test harness (Node/Bun) without touching browser globals.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EXPLOIT_CHAINS: EXPLOIT_CHAINS,
    parseTarget: parseTarget,
    targetIsPS4: targetIsPS4,
    targetIsPS5: targetIsPS5,
    chainById: chainById,
    chainsForTarget: chainsForTarget,
    bestChainForTarget: bestChainForTarget,
    targetBounds: targetBounds,
    isTargetSupported: isTargetSupported,
    fwToTarget: fwToTarget,
    targetToFloat: targetToFloat,
    runChain: runChain,
  };
}
