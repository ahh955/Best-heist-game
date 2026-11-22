// The renderer: draws the room the way the thief sees it at night — a dark
// blue gallery floor, shadowed cover zones, gilt loot, red danger cones and
// amber camera sweeps. Draw order matters: floor, shadows, loot, vault and
// exit, then vision cones, then walls over the cones (so a wall truly hides
// the Fox), then the bodies, then smoke and coins on top.

import { FLOOR } from './levels.js';
import { drawGuardBody, drawGuardCone } from './guards.js';
import { drawCameraBody, drawCameraCone } from './cameras.js';
import { drawLoot, drawVault } from './loot.js';
import { drawThief, thiefInShadow } from './thief.js';
import { drawTools } from './tools.js';

function drawFloor(ctx, room) {
  // Night gallery floor: deep blue boards with a faint checker of parquet.
  ctx.fillStyle = '#0e1a2e';
  ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.fillStyle = '#12203a';
  const tile = 58;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const row = Math.floor((y - FLOOR.y) / tile);
      const col = Math.floor((x - FLOOR.x) / tile);
      if ((row + col) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // Skirting and a thin gold inlay border.
  ctx.strokeStyle = '#24365a';
  ctx.lineWidth = 6;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
  ctx.strokeStyle = 'rgba(201, 161, 59, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(FLOOR.x + 8, FLOOR.y + 8, FLOOR.w - 16, FLOOR.h - 16);
  void room;
}

function drawShadows(ctx, room) {
  for (const zone of room.shadows) {
    ctx.fillStyle = 'rgba(2, 6, 16, 0.72)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);
  }
  ctx.save();
  ctx.font = '10px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = 'rgba(94, 234, 212, 0.55)';
  ctx.textAlign = 'left';
  for (const zone of room.shadows) {
    if (zone.w >= 120) ctx.fillText('SHADOW — SAFE', zone.x + 6, zone.y + 14);
  }
  ctx.restore();
}

function drawWalls(ctx, room) {
  for (const wall of room.walls) {
    // Display case: dark plinth with a lit glass top.
    ctx.fillStyle = '#1c2b45';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = '#2e4266';
    ctx.fillRect(wall.x, wall.y, wall.w, Math.min(8, wall.h));
    ctx.fillStyle = 'rgba(255, 233, 168, 0.16)';
    ctx.fillRect(wall.x + 3, wall.y + 3, wall.w - 6, Math.min(6, wall.h - 6));
    ctx.strokeStyle = '#0a1220';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }
}

function drawExit(ctx, room, time) {
  const { x, y, w, h, label } = room.exit;
  const glow = 0.5 + 0.25 * Math.sin(time * 2);
  ctx.fillStyle = `rgba(126, 231, 135, ${0.25 + glow * 0.2})`;
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = '#123524';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#7ee787';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + w / 2, y + h / 2 - 2);
  ctx.font = '9px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(label, x + w / 2, y + h / 2 + 13);
}

// The whole room in one frame: floor, cover, loot, cones, walls, bodies.
export function drawScene(ctx, state, time) {
  const { room, thief, guards, cameras, lootItems, vaultCracked, toolkit } = state;
  drawFloor(ctx, room);
  drawShadows(ctx, room);
  for (const loot of lootItems) drawLoot(ctx, loot, time);
  if (room.vault) drawVault(ctx, room.vault, vaultCracked, thief.crackProgress, time);
  drawExit(ctx, room, time);
  for (const guard of guards) drawGuardCone(ctx, guard);
  for (const camera of cameras) drawCameraCone(ctx, camera);
  drawWalls(ctx, room);
  for (const camera of cameras) drawCameraBody(ctx, camera);
  for (const guard of guards) drawGuardBody(ctx, guard);
  drawThief(ctx, thief, thiefInShadow(thief, room));
  drawTools(ctx, toolkit, time);
  // Aim line while a coin is armed: the Fox throws where the mouse points.
  if (toolkit.coinArmed) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 214, 90, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(thief.x, thief.y);
    ctx.lineTo(state.mouseX, state.mouseY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK TO TOSS THE COIN', state.mouseX, state.mouseY - 14);
    ctx.restore();
  }
}
