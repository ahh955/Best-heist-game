// The guards: night watchmen who walk fixed patrol routes and sweep the room
// with their vision cones. A guard who glimpses the Fox turns suspicious and
// walks to the last seen spot; a guard who keeps the Fox in sight chases.
// Vision is honest: a cone, a range, and walls that block the line of sight.

import { angleDiff, angleTo, distance, lineOfSightBlocked } from './geometry.js';

export const GUARD_RANGE = 195;
export const GUARD_FOV = 1.22; // ~70 degrees, full cone
export const GUARD_CHASE_SPEED = 132;

export function createGuard(def) {
  const [sx, sy] = def.path[0];
  return {
    path: def.path,
    speed: def.speed,
    waypoint: 1,
    x: sx,
    y: sy,
    facing: angleTo(sx, sy, def.path[1][0], def.path[1][1]),
    state: 'patrol', // patrol | suspicious | chase | converge
    pauseTimer: 0,
    investigateX: 0,
    investigateY: 0,
    lookTimer: 0,
    seenTimer: 0,
  };
}

function moveToward(guard, tx, ty, speed, dt) {
  const d = distance(guard.x, guard.y, tx, ty);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  guard.facing = angleTo(guard.x, guard.y, tx, ty);
  guard.x += ((tx - guard.x) / d) * step;
  guard.y += ((ty - guard.y) / d) * step;
  return d - step < 2;
}

export function updateGuard(guard, dt, room, thief, alarm, time) {
  if (guard.state === 'converge') {
    moveToward(guard, thief.x, thief.y, GUARD_CHASE_SPEED, dt);
    return;
  }
  if (guard.state === 'chase') {
    moveToward(guard, thief.x, thief.y, GUARD_CHASE_SPEED, dt);
    if (guard.seenTimer <= 0) {
      guard.state = 'suspicious';
      guard.investigateX = thief.x;
      guard.investigateY = thief.y;
      guard.lookTimer = 2.5;
    }
    return;
  }
  if (guard.state === 'suspicious') {
    if (moveToward(guard, guard.investigateX, guard.investigateY, guard.speed * 1.15, dt)) {
      guard.lookTimer -= dt;
      guard.facing += Math.sin(time * 2.2 + guard.x) * dt * 1.4;
      if (guard.lookTimer <= 0) guard.state = 'patrol';
    }
    return;
  }
  // Patrol: walk the waypoints, pausing and looking around at each one.
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    guard.facing += Math.sin(time * 1.8 + guard.y) * dt * 1.1;
    return;
  }
  const target = guard.path[guard.waypoint];
  if (moveToward(guard, target[0], target[1], guard.speed, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pauseTimer = 1.1;
  }
}

export function guardSeesThief(guard, thief, room, inShadow, inSmoke) {
  if (inSmoke) return false;
  const d = distance(guard.x, guard.y, thief.x, thief.y);
  const range = inShadow ? 70 : GUARD_RANGE;
  if (d > range) return false;
  if (Math.abs(angleDiff(angleTo(guard.x, guard.y, thief.x, thief.y), guard.facing)) > GUARD_FOV / 2) return false;
  if (lineOfSightBlocked(guard.x, guard.y, thief.x, thief.y, room.walls)) return false;
  return true;
}

export function guardNotice(guard, thief) {
  guard.investigateX = thief.x;
  guard.investigateY = thief.y;
  if (guard.state === 'patrol') {
    guard.state = 'suspicious';
    guard.lookTimer = 2.5;
  }
}

export function guardChase(guard) {
  if (guard.state !== 'converge') guard.state = 'chase';
}

export function guardConverge(guard) {
  guard.state = 'converge';
}

export function drawVisionCone(ctx, x, y, facing, range, fov, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, range);
  grad.addColorStop(0, color.replace('A', '0.34'));
  grad.addColorStop(1, color.replace('A', '0.05'));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, range, -fov / 2, fov / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color.replace('A', '0.5');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(-fov / 2) * range, Math.sin(-fov / 2) * range);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(fov / 2) * range, Math.sin(fov / 2) * range);
  ctx.stroke();
  ctx.restore();
}

export function guardConeColor(guard) {
  return guard.state === 'chase' || guard.state === 'converge'
    ? 'rgba(255, 60, 60, A)'
    : guard.state === 'suspicious'
      ? 'rgba(255, 176, 32, A)'
      : 'rgba(255, 80, 80, A)';
}

export function drawGuardCone(ctx, guard) {
  drawVisionCone(ctx, guard.x, guard.y, guard.facing, GUARD_RANGE, GUARD_FOV, guardConeColor(guard));
}

export function drawGuard(ctx, guard) {
  drawGuardCone(ctx, guard);
  drawGuardBody(ctx, guard);
}

export function drawGuardBody(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Navy uniform body.
  ctx.fillStyle = guard.state === 'patrol' ? '#274b73' : '#7a2a2a';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim points where the guard looks.
  ctx.rotate(guard.facing);
  ctx.fillStyle = '#16283f';
  ctx.beginPath();
  ctx.ellipse(7, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Torch dot.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(13, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Alert mark above a suspicious or chasing guard.
  if (guard.state === 'suspicious' || guard.state === 'chase' || guard.state === 'converge') {
    ctx.save();
    ctx.translate(guard.x, guard.y - 24);
    ctx.fillStyle = guard.state === 'patrol' ? '#ffb020' : '#ff3c3c';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.state === 'suspicious' ? '?' : '!', 0, 0);
    ctx.restore();
  }
}
