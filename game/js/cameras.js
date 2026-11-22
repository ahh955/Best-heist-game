// The security cameras: wall-mounted domes that sweep their cones back and
// forth on a fixed arc. A camera never moves, never tires, and raises the
// alarm faster than a guard — but an EMP pulse freezes one cold for seconds.

import { angleDiff, angleTo, distance, lineOfSightBlocked } from './geometry.js';
import { drawVisionCone } from './guards.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    center: def.center,
    sweep: def.sweep,
    range: def.range,
    fov: def.fov,
    phase: Math.random() * Math.PI * 2,
    frozen: 0,
    angle: def.center,
  };
}

export function updateCamera(camera, dt, time) {
  if (camera.frozen > 0) {
    camera.frozen -= dt;
    return;
  }
  camera.angle = camera.center + Math.sin(time * 0.55 + camera.phase) * camera.sweep;
}

export function cameraSeesThief(camera, thief, room, inShadow, inSmoke) {
  if (camera.frozen > 0 || inSmoke) return false;
  const d = distance(camera.x, camera.y, thief.x, thief.y);
  const range = inShadow ? 60 : camera.range;
  if (d > range) return false;
  if (Math.abs(angleDiff(angleTo(camera.x, camera.y, thief.x, thief.y), camera.angle)) > camera.fov / 2) return false;
  if (lineOfSightBlocked(camera.x, camera.y, thief.x, thief.y, room.walls)) return false;
  return true;
}

export function freezeCamera(camera, seconds) {
  camera.frozen = seconds;
}

export function drawCameraCone(ctx, camera) {
  const color = camera.frozen > 0 ? 'rgba(120, 140, 160, A)' : 'rgba(255, 176, 32, A)';
  drawVisionCone(ctx, camera.x, camera.y, camera.angle, camera.range, camera.fov, color);
}

export function drawCamera(ctx, camera) {
  drawCameraCone(ctx, camera);
  drawCameraBody(ctx, camera);
}

export function drawCameraBody(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  // Mount plate.
  ctx.fillStyle = '#1a2636';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Dome lens, aimed along the cone.
  ctx.rotate(camera.angle);
  ctx.fillStyle = camera.frozen > 0 ? '#5a6b80' : '#ffd34d';
  ctx.beginPath();
  ctx.arc(4, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101826';
  ctx.beginPath();
  ctx.arc(5, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (camera.frozen > 0) {
    ctx.save();
    ctx.translate(camera.x, camera.y - 20);
    ctx.fillStyle = '#9fd8ff';
    ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FROZEN', 0, 0);
    ctx.restore();
  }
}
