# Night Fox — The Meridian Heist

[![make.fun competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun rank](https://make.fun/badge/best-heist-game-20261122-0559/ahh955/Best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun reward](https://make.fun/badge/best-heist-game-20261122-0559/ahh955/Best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A complete top-down stealth heist game for the [make.fun "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559). You are the Fox, a thief slipping through the Meridian Gallery of Antiquities at night: three rooms, six patrolling guards, sweeping security cameras, and one diamond — the Star of Meridian, worth $5,000 — waiting in its vault.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No build step, no network requests, no libraries: vanilla canvas + JavaScript, with sounds synthesized live in WebAudio.

```sh
node serve.ts   # then open http://localhost:8080
```

## How it plays

- **Sneak.** Move with WASD or arrows; hold Shift to sneak. Guards walk patrol routes with red vision cones; cameras sweep amber cones. Walls block sight, and teal shadow zones hide you — a guard must be close to spot you in the dark.
- **Read the cones.** Every room has several routes: a shadow passage, a guarded hall, gaps between the display cases. Time your crossing to the patrols.
- **Steal.** Touch paintings, gems and relics to pocket them. The Star of Meridian sits in its vault case: hold E beside it for 2.5 seconds, out in the open, to crack it.
- **Tools, at a cost.** Smoke bombs (2) break every line of sight; EMP pulses (2) freeze all cameras for 6 seconds; coin tosses (3) lure a guard to the noise. Charges carry across all three rooms, so every use is a decision.
- **The alarm.** Being seen fills the alarm meter; hiding drains it. A brief glimpse only raises it partway — a fair escape is always possible. At full, the guards converge and the run ends in a bust. Retry restarts the room, keeping earlier loot.
- **Get away.** Reach the green exit with the loot to score: loot value, time inside, alarms tripped, and a rank from Ghost to Loud But Rich.

## Files

- `game/index.html` + `game/css/style.css` — the page and its chrome
- `game/js/main.js` — game loop and state machine (title, briefing, playing, busted, getaway)
- `game/js/levels.js` — the three rooms: walls, shadows, loot, patrols, cameras
- `game/js/thief.js`, `guards.js`, `cameras.js` — the actors and their vision
- `game/js/loot.js`, `alarm.js`, `tools.js` — what you steal, what catches you, what saves you
- `game/js/render.js`, `hud.js` — the night-gallery look and the on-screen HUD
- `game/js/input.js`, `audio.js`, `geometry.js` — keyboard/mouse, WebAudio blips, line-of-sight math
- `game/js/shots.js` — screenshot staging (`?shot=cover|plan|busted|getaway` poses the game, frozen, for its screenshots)
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
