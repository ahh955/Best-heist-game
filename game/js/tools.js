// The Fox's toolkit: three gadgets, each with limited charges, so every use
// is a decision. Smoke breaks line of sight, the EMP freezes every camera,
// and a tossed coin pulls a guard's patrol off its route toward the noise.

import { distance } from './geometry.js';

export const SMOKE_DURATION = 4;
export const SMOKE_RADIUS = 95;
export const EMP_DURATION = 6;
export const COIN_LURE_RADIUS = 170;
export const COIN_LURE_SECONDS = 5;

export function createToolKit() {
  return {
    smoke: 2,
    emp: 2,
    coin: 3,
    coinArmed: false,
    smokes: [], // {x, y, left}
    coins: [], // {x, y, left}
  };
}

export function useSmoke(toolkit, x, y) {
  if (toolkit.smoke <= 0) return false;
  toolkit.smoke -= 1;
  toolkit.smokes.push({ x, y, left: SMOKE_DURATION });
  return true;
}

export function useEmp(toolkit, cameras) {
  if (toolkit.emp <= 0) return false;
  toolkit.emp -= 1;
  for (const camera of cameras) camera.frozen = EMP_DURATION;
  return true;
}

export function armCoin(toolkit) {
  if (toolkit.coin <= 0) return false;
  toolkit.coinArmed = true;
  return true;
}

export function throwCoin(toolkit, x, y) {
  if (!toolkit.coinArmed || toolkit.coin <= 0) return false;
  toolkit.coinArmed = false;
  toolkit.coin -= 1;
  toolkit.coins.push({ x, y, left: COIN_LURE_SECONDS });
  return true;
}

export function updateTools(toolkit, dt) {
  for (const smoke of toolkit.smokes) smoke.left -= dt;
  toolkit.smokes = toolkit.smokes.filter((s) => s.left > 0);
  for (const coin of toolkit.coins) coin.left -= dt;
  toolkit.coins = toolkit.coins.filter((c) => c.left > 0);
}

export function pointInSmoke(toolkit, x, y) {
  for (const smoke of toolkit.smokes) {
    if (distance(x, y, smoke.x, smoke.y) < SMOKE_RADIUS) return true;
  }
  return false;
}

// The nearest live coin within lure range of a guard, if any.
export function coinLuringGuard(toolkit, guard) {
  for (const coin of toolkit.coins) {
    if (distance(guard.x, guard.y, coin.x, coin.y) < COIN_LURE_RADIUS) return coin;
  }
  return null;
}

export function drawTools(ctx, toolkit, time) {
  for (const smoke of toolkit.smokes) {
    const alpha = Math.min(0.85, smoke.left / 1.2) * 0.8;
    const grad = ctx.createRadialGradient(smoke.x, smoke.y, 4, smoke.x, smoke.y, SMOKE_RADIUS);
    grad.addColorStop(0, `rgba(190, 200, 215, ${alpha})`);
    grad.addColorStop(1, 'rgba(190, 200, 215, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const coin of toolkit.coins) {
    const ring = 1 - coin.left / COIN_LURE_SECONDS;
    ctx.strokeStyle = `rgba(255, 214, 90, ${0.8 - ring * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 8 + ring * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a12';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    void time;
  }
}
