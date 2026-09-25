# SloposFree

PS4/PS5 WebKit + kernel exploit host. Fork of
[ArabPixel/WebKitty](https://github.com/ArabPixel/WebKitty) (formerly
PSFree-Enhanced), itself based on
[Al-Azif/psfree-lapse](https://github.com/Al-Azif/psfree-lapse) 1.5.1.

> **Not for human consumption.** This is a stripped, minimalistic dev fork —
> personal tooling, English-only, one fixed skin, no switchers. If you want the
> full featured host (languages, themes, layouts, external mirror), use the
> upstreams above. No support, no releases. Works on my machines, probably bugs.

## Fork deltas

- English-only; language switcher and other locales removed.
- Single fixed skin: `conn` (meridian) Atari green-phosphor terminal
  (monospace, boxy frames, CRT scanlines).
- Theme/color/layout switcher system removed (`design.js` gone).
- Settings trimmed to the functional selectors (GoldHEN version, exploit chain).

## Chain selection

Chains are no longer dispatched from five disagreeing hardcoded sites. A single
registry (`includes/js/chains.js`) maps the detected target — encoded as
`0xC_MM_mm` (console bit, BCD major, BCD minor; see `src/config.mjs:26-36`) — to
the exploit chain. Detection reads the User-Agent, the registry picks the best
chain by rank, and the chooser is hidden behind advanced settings. Adding a chain
(PS4 or PS5) is: drop the directory in, add a row.

| id | chain | target range | caps |
| :- | :---- | :----------- | :--- |
| 0 | Default's PSFree Lapse (modular) | PS4 7.00–9.60 | kernel |
| 1 | Feyzee61's PSFree Lapse (bundle) | PS4 7.00–9.60 | kernel |
| 2 | 6.7x badhoist | PS4 6.70–6.72 | kernel |
| 3 | CSSFontFace + NetCtrl | PS4 9.00–11.02 | kernel |
| 4 | CSSFontFace + Lapse | PS4 6.00–11.02 | kernel |
| 5 | SlopKit + Lapse | PS4 11.00–12.02 | kernel |
| 6 | SlopKit + NetCtrl | PS4 12.50–13.00 | kernel |
| 7 | Relapse | PS4 13.02–13.52 | kernel |

PS5 is detected and named (`user.platform = 'PS5'`) but no PS5 chain is
registered yet — the public PS5 browser chains are userland-only, so a PS5 lands
on the "detected, no chain for this firmware" screen.

## Support

| Console | Kernel | GoldHEN PayLoader |
| :------ | :----- | :---------------- |
| PS4     | 6.00–13.52 | 5.05 – latest |
| PS5     | detected only (no chain) | — |

Below 5.05 has no GoldHEN payload support.

## License

AGPL-3.0-or-later (see [LICENSE](LICENSE)). Parts credited to the group `anonymous`.

## Credits

- Al-Azif — base exploit
- Feyzee61 — second PSFree Lapse and 6.7x implementations
- Nazky — code inspiration
- ChendoChap (pOOBs4) — kernel patches / payload loader
- ArabPixel — WebKitty / PSFree-Enhanced (this fork's upstream)
- Raw-Game — SlopKit and Relapse exploit chains
- ufm42 — CSSFontFace exploit chain
- anonymous — PS4 firmware kernel dumps
