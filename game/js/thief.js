// The thief: the Fox. Moves with WASD or arrows, sneaks while Shift is held
// (slower, harder to hear), and cannot pass through walls or leave the floor.
// Position, facing and motion state live here; the game loop owns the rest.

import { FLOOR } from './levels.js';
import { circleRectOverlap, pointInRect, resolveCircleRect } from './geometry.js';

export const THIEF_RADIUS = 13;
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 105;

export function createThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    facing: 0,
    moving: false,
    sneaking: false,
    stepTimer: 0,
    crackProgress: 0,
  };
}

export function updateThief(thief, dir, dt, room, sneaking) {
  thief.sneaking = sneaking;
  const speed = sneaking ? SNEAK_SPEED : WALK_SPEED;
  thief.moving = dir.x !== 0 || dir.y !== 0;
  if (thief.moving) {
    thief.facing = Math.atan2(dir.y, dir.x);
    thief.x += dir.x * speed * dt;
    thief.y += dir.y * speed * dt;
    thief.stepTimer += dt;
  }
  // Stay inside the floor.
  thief.x = Math.max(FLOOR.x + THIEF_RADIUS, Math.min(FLOOR.x + FLOOR.w - THIEF_RADIUS, thief.x));
  thief.y = Math.max(FLOOR.y + THIEF_RADIUS, Math.min(FLOOR.y + FLOOR.h - THIEF_RADIUS, thief.y));
  // Slide out of walls.
  for (const wall of room.walls) {
    if (circleRectOverlap(thief.x, thief.y, THIEF_RADIUS, wall)) {
      const fixed = resolveCircleRect(thief.x, thief.y, THIEF_RADIUS, wall);
      thief.x = fixed.x;
      thief.y = fixed.y;
    }
  }
  if (room.vault) {
    const v = room.vault;
    const vaultRect = { x: v.x - v.w / 2, y: v.y - v.h / 2, w: v.w, h: v.h };
    if (circleRectOverlap(thief.x, thief.y, THIEF_RADIUS, vaultRect)) {
      const fixed = resolveCircleRect(thief.x, thief.y, THIEF_RADIUS, vaultRect);
      thief.x = fixed.x;
      thief.y = fixed.y;
    }
  }
}

export function thiefInShadow(thief, room) {
  for (const zone of room.shadows) {
    if (pointInRect(thief.x, thief.y, zone)) return true;
  }
  return false;
}

export function thiefAtExit(thief, room) {
  return pointInRect(thief.x, thief.y, room.exit);
}

export function thiefNearVault(thief, room) {
  if (!room.vault) return false;
  return Math.hypot(thief.x - room.vault.x, thief.y - room.vault.y) < 78;
}

// The thief's silhouette: a hooded figure with fox ears and a pale mask,
// drawn from canvas shapes so the art is code, not an image file.
export function drawThief(ctx, thief, inShadow) {
  const { x, y } = thief;
  ctx.save();
  ctx.translate(x, y);
  // Soft ground shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak.
  ctx.fillStyle = inShadow ? '#1d2f52' : '#2b3f66';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Fox ears.
  ctx.fillStyle = '#e8823c';
  ctx.beginPath();
  ctx.moveTo(-9, -8); ctx.lineTo(-5, -19); ctx.lineTo(-1, -9);
  ctx.moveTo(9, -8); ctx.lineTo(5, -19); ctx.lineTo(1, -9);
  ctx.fill();
  // Pale mask.
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.ellipse(0, -1, 7.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mask eyes, looking where the thief faces.
  const ex = Math.cos(thief.facing) * 2.2;
  const ey = Math.sin(thief.facing) * 2.2;
  ctx.fillStyle = '#101826';
  ctx.beginPath();
  ctx.arc(-3 + ex, -2 + ey, 1.6, 0, Math.PI * 2);
  ctx.arc(3 + ex, -2 + ey, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Sneak ring: a thin teal circle while sneaking, so quiet is visible.
  if (thief.sneaking) {
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
