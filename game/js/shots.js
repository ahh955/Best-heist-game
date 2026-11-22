// Screenshot staging: the game reads ?shot= from the URL and sets up one
// frozen, fully legible scene per screenshot, all rendered by the game's own
// code — cover (the whole heist in one frame), plan (the briefing map),
// busted (the fair caught moment) and getaway (the payoff score screen).
// Nothing here edits pixels; it only poses the game, then freezes time.

export function readShotParam() {
  try {
    return new URLSearchParams(window.location.search).get('shot');
  } catch {
    return null;
  }
}

function freeze(state, time) {
  state.frozen = true;
  state.frozenTime = time;
}

export function applyShot(state, loadRoom) {
  const shot = readShotParam();
  if (!shot) return;
  if (shot === 'plan') {
    state.screen = 'briefing';
    freeze(state, 0);
    return;
  }
  if (shot === 'getaway') {
    state.screen = 'getaway';
    state.lootValue = 12300;
    state.lootCount = 8;
    state.time = 272;
    state.alarmsTripped = 1;
    freeze(state, 2);
    return;
  }
  if (shot === 'busted') {
    loadRoom(0);
    state.screen = 'busted';
    // The Fox caught out in the open on the left, where the panel leaves
    // the room visible: two guards closing in, the camera swung around.
    state.thief.x = 250;
    state.thief.y = 520;
    state.thief.facing = 0.6;
    state.alarm.level = 100;
    state.alarm.tripped = true;
    state.alarmsTripped = 1;
    state.lootValue = 800;
    state.lootCount = 1;
    state.time = 96;
    const g1 = state.guards[0];
    const g2 = state.guards[1];
    g1.x = 200; g1.y = 470; g1.state = 'converge';
    g1.facing = Math.atan2(520 - 470, 250 - 200);
    g2.x = 310; g2.y = 565; g2.state = 'converge';
    g2.facing = Math.atan2(520 - 565, 250 - 310);
    state.cameras[0].angle = 2.25;
    state.message = '';
    freeze(state, 3);
    return;
  }
  if (shot === 'cover') {
    loadRoom(0);
    state.screen = 'playing';
    // The Fox mid-room, one step out of the shadow, a guard's cone sweeping
    // in from the left and the camera's amber cone from above.
    state.thief.x = 520;
    state.thief.y = 285;
    state.thief.facing = 0.4;
    state.thief.sneaking = true;
    state.alarm.level = 35;
    state.lootValue = 800;
    state.lootCount = 1;
    state.time = 84;
    state.lootItems[0].taken = true;
    const g1 = state.guards[0];
    const g2 = state.guards[1];
    g1.x = 400; g1.y = 220; g1.facing = 0.5; g1.state = 'patrol'; g1.pauseTimer = 5;
    g2.x = 950; g2.y = 350; g2.facing = Math.PI; g2.state = 'patrol'; g2.pauseTimer = 5;
    state.cameras[0].angle = Math.PI / 2 + 0.45;
    state.cameras[0].phase = 0;
    state.message = 'The camera sweeps — time your move';
    state.messageColor = '#ffd65a';
    state.messageTimer = 999;
    freeze(state, 1.6);
  }
}
