// Night Fox — The Meridian Heist. The main loop and the state machine:
// title, briefing, playing, busted, getaway. This file owns the run — the
// rooms, the loot tally, the clock — and asks each small module to do its
// one job: the thief moves, the guards patrol, the cameras sweep, the alarm
// fills and drains, the tools cost charges, the HUD tells the truth.

import { initInput, keysHeld, keysPressed, mouse, moveDirection, endFrameInput } from './input.js';
import { initAudio, playPickup, playVaultCrack, playAlarmTick, playSpotted, playBusted, playGetaway, playSmoke, playEmp, playCoin, playClick, playStep } from './audio.js';
import { roomByIndex, totalLootValue } from './levels.js';
import { createThief, updateThief, thiefInShadow, thiefAtExit, thiefNearVault } from './thief.js';
import { createGuard, updateGuard, guardSeesThief, guardNotice, guardChase, guardConverge } from './guards.js';
import { createCamera, updateCamera, cameraSeesThief } from './cameras.js';
import { createLoot, lootTaken } from './loot.js';
import { createAlarm, raiseAlarm, drainAlarm, ALARM_GUARD_RATE, ALARM_CAMERA_RATE } from './alarm.js';
import { createToolKit, useSmoke, useEmp, armCoin, throwCoin, updateTools, pointInSmoke, coinLuringGuard } from './tools.js';
import { drawScene } from './render.js';
import { drawHud, toolButtonAt, TOOL_BUTTONS } from './hud.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const TITLE_BUTTON = { x: 490, y: 520, w: 300, h: 56 };
const BRIEF_BUTTON = { x: 490, y: 620, w: 300, h: 52 };
const RETRY_BUTTON = { x: 490, y: 470, w: 300, h: 52 };
const AGAIN_BUTTON = { x: 490, y: 560, w: 300, h: 52 };

const state = {
  screen: 'title',
  roomIndex: 0,
  room: null,
  thief: null,
  guards: [],
  cameras: [],
  lootItems: [],
  vaultCracked: false,
  alarm: createAlarm(),
  toolkit: createToolKit(),
  time: 0,
  lootValue: 0,
  lootCount: 0,
  alarmsTripped: 0,
  message: '',
  messageColor: '#ffffff',
  messageTimer: 0,
  mouseX: 0,
  mouseY: 0,
  snapshot: null,
  frozen: false,
  frozenTime: 0,
  lastAlarmTick: 0,
};

function setMessage(text, color, seconds) {
  state.message = text;
  state.messageColor = color || '#ffffff';
  state.messageTimer = seconds || 2.6;
}

function loadRoom(index) {
  state.roomIndex = index;
  state.room = roomByIndex(index);
  state.thief = createThief(state.room.entry);
  state.guards = state.room.guards.map(createGuard);
  state.cameras = state.room.cameras.map(createCamera);
  state.lootItems = state.room.loot.map(createLoot);
  state.vaultCracked = false;
  state.alarm = createAlarm();
  state.snapshot = { lootValue: state.lootValue, lootCount: state.lootCount, time: state.time };
  state.lastAlarmTick = 0;
}

function newRun() {
  state.roomIndex = 0;
  state.lootValue = 0;
  state.lootCount = 0;
  state.time = 0;
  state.alarmsTripped = 0;
  state.toolkit = createToolKit();
  loadRoom(0);
  state.screen = 'briefing';
}

function retryRoom() {
  const snap = state.snapshot || { lootValue: 0, lootCount: 0, time: 0 };
  state.lootValue = snap.lootValue;
  state.lootCount = snap.lootCount;
  state.time = snap.time;
  loadRoom(state.roomIndex);
  state.screen = 'playing';
  setMessage('Back in the shadows. The guards reset — so do you.', '#7ee787', 3);
}

function tripAlarm() {
  state.alarmsTripped += 1;
  state.screen = 'busted';
  for (const guard of state.guards) guardConverge(guard);
  playBusted();
}

function advanceRoom() {
  if (state.roomIndex < 2) {
    loadRoom(state.roomIndex + 1);
    state.screen = 'briefing';
    setMessage('', '#ffffff', 0);
  } else {
    state.screen = 'getaway';
    playGetaway();
  }
}

function heistRank() {
  const share = state.lootValue / totalLootValue();
  if (state.alarmsTripped === 0 && share >= 0.8) return 'GHOST — unseen, unheard, untouched';
  if (state.alarmsTripped === 0) return 'GHOST — never spotted once';
  if (state.alarmsTripped === 1) return 'CLEAN — one close call, no harm done';
  if (share >= 0.8) return 'LOUD BUT RICH — the vault is empty anyway';
  return 'MESSY — the Fox still got away';
}

function useSmokeNow() {
  if (useSmoke(state.toolkit, state.thief.x, state.thief.y)) {
    playSmoke();
    setMessage('Smoke out — their cones cannot see through it.', '#9fd8ff');
  } else setMessage('No smoke bombs left.', '#ff9d9d');
}

function useEmpNow() {
  if (useEmp(state.toolkit, state.cameras)) {
    playEmp();
    setMessage('EMP pulse — every camera frozen for 6 seconds.', '#9fd8ff');
  } else setMessage('No EMP charges left.', '#ff9d9d');
}

function armCoinNow() {
  if (state.toolkit.coinArmed) { state.toolkit.coinArmed = false; return; }
  if (armCoin(state.toolkit)) {
    playClick();
    setMessage('Coin armed — click the floor to toss it.', '#ffd65a');
  } else setMessage('No coins left.', '#ff9d9d');
}

function updatePlaying(dt) {
  const { thief, room } = state;
  state.time += dt;
  state.mouseX = mouse.x;
  state.mouseY = mouse.y;

  // Tools: keys 1/2/3, or clicks on the tool belt.
  if (keysPressed.has('smoke')) useSmokeNow();
  if (keysPressed.has('emp')) useEmpNow();
  if (keysPressed.has('coin')) armCoinNow();
  if (mouse.clicked) {
    const button = toolButtonAt(mouse.x, mouse.y);
    if (button) {
      if (button.key === 'smoke') useSmokeNow();
      if (button.key === 'emp') useEmpNow();
      if (button.key === 'coin') armCoinNow();
    } else if (state.toolkit.coinArmed) {
      if (throwCoin(state.toolkit, mouse.x, mouse.y)) {
        playCoin();
        setMessage('The coin clinks across the floor...', '#ffd65a');
      }
    }
  }
  if (keysPressed.has('retry')) { retryRoom(); return; }

  updateThief(thief, moveDirection(), dt, room, keysHeld.has('sneak'));
  if (thief.moving && !thief.sneaking && thief.stepTimer > 0.45) {
    playStep();
    thief.stepTimer = 0;
  }
  updateTools(state.toolkit, dt);
  for (const camera of state.cameras) updateCamera(camera, dt, state.time);

  // Vault cracking: hold E beside the case, out in the open.
  if (room.vault && !state.vaultCracked) {
    if (thiefNearVault(thief, room) && keysHeld.has('interact')) {
      thief.crackProgress += dt / room.vault.crackSeconds;
      if (thief.crackProgress >= 1) {
        state.vaultCracked = true;
        state.lootValue += room.vault.value;
        state.lootCount += 1;
        playVaultCrack();
        setMessage(`CRACKED! The Star of Meridian is yours — $${room.vault.value.toLocaleString('en-US')}`, '#ffd65a', 3.5);
      }
    } else {
      thief.crackProgress = Math.max(0, thief.crackProgress - dt * 0.8);
    }
  }

  // Detection: guards and cameras against the Fox.
  const inShadow = thiefInShadow(thief, room);
  const inSmoke = pointInSmoke(state.toolkit, thief.x, thief.y);
  let seen = false;
  let seenByCamera = false;
  for (const guard of state.guards) {
    const coin = coinLuringGuard(state.toolkit, guard);
    if (coin && guard.state === 'patrol') {
      guard.state = 'suspicious';
      guard.investigateX = coin.x;
      guard.investigateY = coin.y;
      guard.lookTimer = 3;
    }
    if (guardSeesThief(guard, thief, room, inShadow, inSmoke)) {
      seen = true;
      guard.seenTimer += dt;
      guardNotice(guard, thief);
      if (guard.seenTimer > 1.0) guardChase(guard);
      raiseAlarm(state.alarm, ALARM_GUARD_RATE, dt);
    } else {
      guard.seenTimer = Math.max(0, guard.seenTimer - dt * 2);
    }
    updateGuard(guard, dt, room, thief, state.alarm, state.time);
  }
  for (const camera of state.cameras) {
    if (cameraSeesThief(camera, thief, room, inShadow, inSmoke)) {
      seen = true;
      seenByCamera = true;
      raiseAlarm(state.alarm, ALARM_CAMERA_RATE, dt);
    }
  }
  if (!seen) drainAlarm(state.alarm, dt);
  if (seen && state.messageTimer <= 0) {
    playSpotted();
    setMessage(seenByCamera ? 'The camera has you — break its line of sight!' : 'A guard sees you — get to shadow!', '#ff9d9d', 2);
  }
  const tick = Math.floor(state.alarm.level / 25);
  if (tick > state.lastAlarmTick && state.alarm.level < 100) {
    state.lastAlarmTick = tick;
    playAlarmTick();
  }
  if (state.alarm.tripped) { tripAlarm(); return; }

  // Loot: touch a piece to pocket it.
  for (const loot of state.lootItems) {
    if (lootTaken(loot, thief)) {
      loot.taken = true;
      state.lootValue += loot.value;
      state.lootCount += 1;
      playPickup();
      setMessage(`+$${loot.value.toLocaleString('en-US')} — ${loot.name}`, '#ffd65a');
    }
  }

  if (thiefAtExit(thief, room)) advanceRoom();
  if (state.messageTimer > 0) state.messageTimer -= dt;
}

function pointInButton(x, y, button) {
  return x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h;
}

function drawButton(ctx, button, label, enabled) {
  ctx.fillStyle = enabled ? '#c9a13b' : '#3a4f73';
  ctx.fillRect(button.x, button.y, button.w, button.h);
  ctx.strokeStyle = '#0a1220';
  ctx.lineWidth = 2;
  ctx.strokeRect(button.x, button.y, button.w, button.h);
  ctx.fillStyle = '#0a1220';
  ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, button.x + button.w / 2, button.y + button.h / 2 + 6);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawFoxEmblem(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8823c';
  ctx.beginPath();
  ctx.moveTo(-42, -18); ctx.lineTo(-30, -58); ctx.lineTo(-12, -26);
  ctx.moveTo(42, -18); ctx.lineTo(30, -58); ctx.lineTo(12, -26);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 44, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101826';
  ctx.beginPath();
  ctx.ellipse(-16, -4, 7, 9, 0.2, 0, Math.PI * 2);
  ctx.ellipse(16, -4, 7, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTitleScreen(ctx, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, '#0a1120');
  grad.addColorStop(1, '#131f38');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  // Moon and skyline.
  ctx.fillStyle = '#e8e2c8';
  ctx.beginPath();
  ctx.arc(1060, 120, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8d2b2';
  ctx.beginPath();
  ctx.arc(1040, 105, 12, 0, Math.PI * 2);
  ctx.arc(1080, 140, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#070d18';
  const skyline = [[0, 560, 140, 160], [140, 600, 180, 120], [320, 540, 120, 180], [900, 580, 160, 140], [1060, 540, 220, 180]];
  for (const [x, y, w, h] of skyline) ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 233, 168, 0.8)';
  for (let i = 0; i < 26; i++) {
    const wx = 20 + (i * 47) % 1220;
    const wy = 560 + (i * 31) % 130;
    ctx.fillRect(wx, wy, 5, 7);
  }
  drawFoxEmblem(ctx, 640, 190, 1.5 + Math.sin(time * 0.8) * 0.02);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 84px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('NIGHT FOX', 640, 340);
  ctx.fillStyle = '#e8823c';
  ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('THE MERIDIAN HEIST', 640, 384);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Three rooms. Seven guards. One diamond worth $5,000. Do not get seen.', 640, 424);
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('WASD / arrows — move    SHIFT — sneak    1 smoke · 2 EMP · 3 coin    E — crack the vault', 640, 470);
  drawButton(ctx, TITLE_BUTTON, 'PLAN THE HEIST', true);
  ctx.fillStyle = '#5a6b80';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('A top-down stealth game — keyboard and mouse, no download, plays offline', 640, 620);
}

function drawBriefingScreen(ctx, state) {
  ctx.fillStyle = '#0a1120';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8823c';
  ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('THE PLAN', 60, 70);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(state.room.name, 60, 106);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  const lines = wrapText(ctx, state.room.brief, 520);
  lines.forEach((line, i) => ctx.fillText(line, 60, 140 + i * 24));
  // The plan: routes, tools, rules.
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('THREE WAYS THROUGH', 60, 240);
  ctx.fillStyle = '#c8d6ea';
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  const routes = [
    '• The shadow passage — slow, quiet, safe. Watch the cones sweep.',
    '• The grand hall — the direct line, past the patrols. Time it.',
    '• The divider gaps — cut between the cases when a guard turns away.',
  ];
  routes.forEach((line, i) => ctx.fillText(line, 60, 268 + i * 24));
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('YOUR KIT — EVERY USE COSTS A CHARGE', 60, 370);
  ctx.fillStyle = '#c8d6ea';
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  const kit = [
    `• Smoke bomb ×${state.toolkit.smoke} — breaks every line of sight for 4 seconds.`,
    `• EMP pulse ×${state.toolkit.emp} — freezes all cameras for 6 seconds.`,
    `• Coin toss ×${state.toolkit.coin} — click the floor; a guard walks to the noise.`,
  ];
  kit.forEach((line, i) => ctx.fillText(line, 60, 398 + i * 24));
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Loot so far: $' + state.lootValue.toLocaleString('en-US') + '  ·  Alarms tripped: ' + state.alarmsTripped, 60, 500);
  // Mini-map: the real room, drawn small, with cones and loot.
  ctx.save();
  ctx.translate(640, 60);
  ctx.scale(0.48, 0.48);
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, 1280, 720);
  drawScene(ctx, state, 1.2);
  ctx.restore();
  ctx.strokeStyle = '#c9a13b';
  ctx.lineWidth = 2;
  ctx.strokeRect(640, 60, 614, 346);
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FLOOR PLAN — RED IS DANGER, GOLD IS LOOT, TEAL IS COVER', 947, 428);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Guards walk their routes. Cameras sweep. Read the cones before you move.', 947, 460);
  ctx.fillText('Reach the green EXIT with the loot. Full alarm means the run ends here.', 947, 484);
  drawButton(ctx, BRIEF_BUTTON, state.roomIndex === 0 ? 'BEGIN THE HEIST' : 'ENTER THE ROOM', true);
}

function drawBustedOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(60, 5, 10, 0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = 'rgba(10, 5, 8, 0.88)';
  ctx.fillRect(340, 150, 600, 380);
  ctx.strokeStyle = '#ff3c3c';
  ctx.lineWidth = 3;
  ctx.strokeRect(340, 150, 600, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3c3c';
  ctx.font = 'bold 54px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('BUSTED!', 640, 230);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('The alarm filled. The guards closed in from every side.', 640, 272);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('The Fox was seen too long, out in the open, under the cones.', 640, 300);
  ctx.fillText('Shadow, smoke and patience would have carried the night.', 640, 326);
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Loot kept from earlier rooms: $${state.snapshot.lootValue.toLocaleString('en-US')}  ·  Time: ${Math.floor(state.snapshot.time / 60)}:${String(Math.floor(state.snapshot.time % 60)).padStart(2, '0')}`, 640, 380);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Retry restarts this room — the guards forget, and so does the alarm.', 640, 420);
  drawButton(ctx, RETRY_BUTTON, 'RETRY THIS ROOM  (R)', true);
}

function drawGetawayScreen(ctx, state) {
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, '#0a1a12');
  grad.addColorStop(1, '#0a1120');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  drawFoxEmblem(ctx, 640, 130, 1.2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 52px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('CLEAN GETAWAY', 640, 250);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '19px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('The van pulls away as the gallery lights come on behind you.', 640, 288);
  // Score table.
  ctx.fillStyle = 'rgba(5, 10, 20, 0.8)';
  ctx.fillRect(390, 320, 500, 190);
  ctx.strokeStyle = '#c9a13b';
  ctx.lineWidth = 2;
  ctx.strokeRect(390, 320, 500, 190);
  const rows = [
    ['Loot stolen', `$${state.lootValue.toLocaleString('en-US')} of $${totalLootValue().toLocaleString('en-US')}`],
    ['Pieces taken', `${state.lootCount}`],
    ['Time inside', `${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}`],
    ['Alarms tripped', `${state.alarmsTripped}`],
  ];
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  rows.forEach(([label, value], i) => {
    const y = 356 + i * 38;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fb4d0';
    ctx.fillText(label, 420, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(value, 860, y);
    ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8823c';
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(heistRank(), 640, 548);
  drawButton(ctx, AGAIN_BUTTON, 'RUN IT AGAIN  (R)', true);
}

function draw(ctx, renderTime) {
  if (state.screen === 'title') { drawTitleScreen(ctx, renderTime); return; }
  if (state.screen === 'briefing') { drawBriefingScreen(ctx, state); return; }
  if (state.screen === 'getaway') { drawGetawayScreen(ctx, state); return; }
  drawScene(ctx, state, renderTime);
  drawHud(ctx, state);
  if (state.screen === 'busted') drawBustedOverlay(ctx, state);
}

function handleClicks() {
  if (!mouse.clicked) return;
  initAudio();
  if (state.screen === 'title') {
    if (pointInButton(mouse.x, mouse.y, TITLE_BUTTON)) {
      playClick();
      state.screen = 'briefing';
      statusLine.textContent = 'Briefing: plan the heist.';
    }
    return;
  }
  if (state.screen === 'briefing') {
    if (pointInButton(mouse.x, mouse.y, BRIEF_BUTTON)) {
      playClick();
      state.screen = 'playing';
      statusLine.textContent = 'Playing: sneak, steal, escape.';
      setMessage(state.roomIndex === 0 ? 'Stay out of the red cones. Shadow is safe.' : 'New room, new patrols. Read the cones first.', '#7ee787', 3.5);
    }
    return;
  }
  if (state.screen === 'busted') {
    if (pointInButton(mouse.x, mouse.y, RETRY_BUTTON)) {
      playClick();
      retryRoom();
    }
    return;
  }
  if (state.screen === 'getaway') {
    if (pointInButton(mouse.x, mouse.y, AGAIN_BUTTON)) {
      playClick();
      newRun();
    }
  }
}

function handleKeys() {
  if (keysPressed.has('confirm')) {
    initAudio();
    if (state.screen === 'title') { state.screen = 'briefing'; return; }
    if (state.screen === 'briefing') {
      state.screen = 'playing';
      setMessage('Stay out of the red cones. Shadow is safe.', '#7ee787', 3.5);
    }
  }
  if (keysPressed.has('retry')) {
    if (state.screen === 'busted') retryRoom();
    else if (state.screen === 'getaway') newRun();
  }
}

initInput(canvas);
loadRoom(0);
applyShot(state, loadRoom);

// Debug handle for play-testing: window.__nightfox exposes the live state.
window.__nightfox = { state };

let lastTime = performance.now();
let renderTime = state.frozen ? state.frozenTime : 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  handleClicks();
  handleKeys();
  if (!state.frozen) {
    renderTime += dt;
    if (state.screen === 'playing') updatePlaying(dt);
  }
  draw(ctx, renderTime);
  endFrameInput();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
