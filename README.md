# PSFree

PS4 WebKit + Lapse kernel exploit host. Fork of
[ArabPixel/PSFree-Enhanced](https://github.com/ArabPixel/PSFree-Enhanced),
itself based on [Al-Azif/psfree-lapse](https://github.com/Al-Azif/psfree-lapse) 1.5.1.

> **Not for human consumption.** This is a stripped, minimalistic dev fork —
> personal tooling, English-only, one fixed skin, no switchers. If you want the
> full featured host (languages, themes, layouts, external mirror), use the
> upstreams above. No support, no releases, no promises.

## Fork deltas

- English-only; language switcher and other locales removed.
- Single fixed skin: `conn` (meridian) Atari green-phosphor terminal
  (monospace, boxy frames, CRT scanlines).
- Theme/color/layout switcher system removed (`design.js` gone).
- Settings trimmed to the functional selectors (GoldHEN version, exploit chain).

## Chain

- **WebKit (PSFree)** — arbitrary R/W in the browser (`src/psfree.mjs`, `src/module/`).
- **Kernel (Lapse)** — privilege escalation (`src/lapse.mjs`, `src/kpatch/`).
- **Payload loader** — listens on port 9020 after kernel exploitation.

## Support

| Console | Userland | Kernel | GoldHEN PayLoader |
| :------ | :------- | :----- | :---------------- |
| PS4     | 6.70–9.60 | 6.70–9.60 | 5.05 – latest |

Below 5.05 has no GoldHEN payload support.

## License

AGPL-3.0-or-later (see [LICENSE](LICENSE)). Parts credited to the group `anonymous`.

## Credits

- Al-Azif — base exploit
- Feyzee61 — second PSFree Lapse and 6.7x implementations
- Nazky — code inspiration
- ChendoChap (pOOBs4) — kernel patches / payload loader
- ArabPixel — PSFree-Enhanced (this fork's upstream)
- anonymous — PS4 firmware kernel dumps
