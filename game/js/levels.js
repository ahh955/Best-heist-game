// The three rooms of the Meridian Gallery, each one a small stealth puzzle.
// Every room offers several routes: a shadowed side passage, a guarded hall,
// and a gap in the dividers. Coordinates are canvas pixels on a 1280x720
// stage; the playable floor runs x 24..1256, y 76..656.

export const FLOOR = { x: 24, y: 76, w: 1232, h: 580 };

export const ROOMS = [
  {
    name: 'Room 1 — The Grand Gallery',
    brief: 'Slip in through the service door. The gallery sleeps, but two guards walk the floor and a camera sweeps the hall. Three pieces are worth taking.',
    entry: { x: 70, y: 590 },
    exit: { x: 1180, y: 92, w: 60, h: 60, label: 'SERVICE STAIR' },
    walls: [
      { x: 420, y: 150, w: 200, h: 30 },
      { x: 420, y: 470, w: 200, h: 30 },
      { x: 840, y: 280, w: 30, h: 200 },
      { x: 180, y: 300, w: 30, h: 120 },
      { x: 1000, y: 120, w: 140, h: 30 },
    ],
    shadows: [
      { x: 40, y: 480, w: 150, h: 150 },
      { x: 430, y: 200, w: 180, h: 60 },
      { x: 880, y: 300, w: 90, h: 160 },
      { x: 1050, y: 480, w: 180, h: 140 },
    ],
    loot: [
      { x: 520, y: 132, kind: 'painting', value: 800, name: 'Portrait of the Fox Queen' },
      { x: 855, y: 500, kind: 'relic', value: 1200, name: 'Sun Disk of Aurel' },
      { x: 1070, y: 102, kind: 'painting', value: 600, name: 'The Blue Hour' },
    ],
    vault: null,
    guards: [
      { path: [[380, 220], [700, 220], [700, 420], [380, 420]], speed: 55 },
      { path: [[950, 200], [1150, 200], [1150, 550], [950, 550]], speed: 60 },
    ],
    cameras: [
      { x: 640, y: 84, center: Math.PI / 2, sweep: 0.7, range: 260, fov: 0.9 },
    ],
  },
  {
    name: 'Room 2 — The Hall of Mirrors',
    brief: 'Three guards and two cameras now, and the mirrors hide nothing. Use the dark corners: the side passage on the left is the quiet way through.',
    entry: { x: 70, y: 100 },
    exit: { x: 1180, y: 580, w: 60, h: 60, label: 'VAULT LIFT' },
    walls: [
      { x: 300, y: 76, w: 26, h: 200 },
      { x: 300, y: 380, w: 26, h: 276 },
      { x: 700, y: 76, w: 26, h: 170 },
      { x: 700, y: 350, w: 26, h: 306 },
      { x: 980, y: 250, w: 200, h: 26 },
      { x: 480, y: 520, w: 160, h: 26 },
    ],
    shadows: [
      { x: 40, y: 300, w: 140, h: 200 },
      { x: 340, y: 90, w: 120, h: 90 },
      { x: 740, y: 480, w: 160, h: 140 },
      { x: 1030, y: 90, w: 200, h: 120 },
    ],
    loot: [
      { x: 380, y: 620, kind: 'gem', value: 1500, name: 'Emerald of the Deep Court' },
      { x: 1080, y: 232, kind: 'painting', value: 900, name: 'Mirrors at Midnight' },
      { x: 760, y: 130, kind: 'relic', value: 1100, name: 'The Gilded Scarab' },
    ],
    vault: null,
    guards: [
      { path: [[450, 200], [650, 200], [650, 450], [450, 450]], speed: 62 },
      { path: [[850, 150], [1150, 150], [1150, 400], [850, 400]], speed: 66 },
      { path: [[150, 500], [280, 500], [280, 300], [150, 300]], speed: 58 },
    ],
    cameras: [
      { x: 520, y: 84, center: Math.PI / 2, sweep: 0.6, range: 250, fov: 0.9 },
      { x: 1248, y: 330, center: Math.PI, sweep: 0.6, range: 240, fov: 0.9 },
    ],
  },
  {
    name: 'Room 3 — The Vault',
    brief: 'The Star of Meridian waits in its case. Hold E beside the vault to crack it — 2.5 seconds, in the open, under the cameras. Then run for the getaway door.',
    entry: { x: 70, y: 590 },
    exit: { x: 1180, y: 92, w: 60, h: 60, label: 'GETAWAY VAN' },
    walls: [
      { x: 400, y: 180, w: 26, h: 180 },
      { x: 400, y: 470, w: 26, h: 186 },
      { x: 850, y: 180, w: 26, h: 180 },
      { x: 850, y: 470, w: 26, h: 186 },
      { x: 560, y: 120, w: 160, h: 26 },
      { x: 560, y: 580, w: 160, h: 26 },
    ],
    shadows: [
      { x: 40, y: 90, w: 150, h: 140 },
      { x: 1060, y: 480, w: 180, h: 150 },
      { x: 450, y: 400, w: 120, h: 60 },
      { x: 700, y: 280, w: 120, h: 60 },
    ],
    loot: [
      { x: 1100, y: 620, kind: 'gem', value: 1400, name: 'Ruby of the North Wing' },
      { x: 120, y: 130, kind: 'painting', value: 700, name: 'The Last Fox' },
    ],
    vault: { x: 640, y: 330, w: 96, h: 72, value: 5000, name: 'The Star of Meridian', crackSeconds: 2.5 },
    guards: [
      { path: [[300, 150], [550, 150], [550, 550], [300, 550]], speed: 70 },
      { path: [[950, 150], [1150, 150], [1150, 550], [950, 550]], speed: 70 },
    ],
    cameras: [
      { x: 640, y: 84, center: Math.PI / 2, sweep: 0.65, range: 270, fov: 0.9 },
      { x: 32, y: 360, center: 0, sweep: 0.6, range: 240, fov: 0.9 },
    ],
  },
];

export function roomByIndex(index) {
  return ROOMS[index];
}

export function totalLootValue() {
  let total = 0;
  for (const room of ROOMS) {
    for (const item of room.loot) total += item.value;
    if (room.vault) total += room.vault.value;
  }
  return total;
}
