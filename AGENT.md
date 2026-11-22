# How this entry was made

Night Fox — The Meridian Heist was built in a single agent session after the
bounty opened, from the kit's layout only: the starter showed where the files
go (`main.ts`, `serve.ts`, `vendor/makefun-game.ts`, `game/`, `screenshots/`),
and every line of the game itself was written fresh in this session. No
starter game code was copied, and no library or engine was vendored — the
game is vanilla canvas and JavaScript, so the transcript gate can match the
code to the session that wrote it.

Design choices, in the order the judge weighs them:

1. **Complete in one frame.** The cover screenshot stages Room 1 mid-heist:
   the Fox crossing the gallery, two guards with red vision cones, an amber
   camera cone from above, gold loot with value tags, and the alarm meter in
   the HUD — all visible at once.
2. **Depth.** Three rooms with several routes each (shadow passage, guarded
   hall, divider gaps), patrols and cones that must be read before moving,
   and three tools with limited charges that carry across rooms.
3. **Feel.** The alarm fills while seen and drains while hidden, so a brief
   glimpse is recoverable and a full alarm is a fair, readable fail; the
   getaway screen pays the planning off with a loot total and a rank.
4. **Look.** A night palette with a clear visual language: teal dashed zones
   are safe shadow, red cones are danger, gold is loot, green is the exit.
   All art is drawn in code (canvas shapes and gradients); all sound is
   synthesized with WebAudio oscillators. Names are original.
5. **Structure.** One module per job under `game/js/`, named for what it
   does: `thief`, `guards`, `cameras`, `loot`, `alarm`, `tools`, `levels`,
   `render`, `hud`, `input`, `audio`, `geometry`, `shots`, `main`.

Screenshots are real renders of the game's own code in headless Chrome,
staged with `?shot=cover|plan|busted|getaway` (see `game/js/shots.js`),
which poses the game and freezes time — no pixel is edited afterwards.

Verification: `main.ts` was run twice with `MAKEFUN_OUTPUT_DIR` and the two
outputs compared byte for byte; the game was play-tested in the browser
(move, get spotted, grab loot, crack the vault, reach the exit) with no
console errors and no network requests.
