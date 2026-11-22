// The loot: paintings, gems and relics, each with a name and a value in
// dollars. Touch one to pocket it. The vault diamond is different: it sits
// in its case until the thief cracks the vault, which takes time in the open.

import { distance } from './geometry.js';

export const LOOT_PICKUP_RADIUS = 26;

export function createLoot(def) {
  return { ...def, taken: false, bobPhase: Math.random() * Math.PI * 2 };
}

export function lootTaken(loot, thief) {
  if (loot.taken) return false;
  return distance(loot.x, loot.y, thief.x, thief.y) < LOOT_PICKUP_RADIUS + 8;
}

function goldGlow(ctx, x, y, radius, time, phase) {
  const pulse = 0.55 + 0.25 * Math.sin(time * 2.4 + phase);
  const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
  grad.addColorStop(0, `rgba(255, 214, 90, ${pulse})`);
  grad.addColorStop(1, 'rgba(255, 214, 90, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLoot(ctx, loot, time) {
  if (loot.taken) return;
  const bob = Math.sin(time * 2 + loot.bobPhase) * 2;
  const y = loot.y + bob;
  goldGlow(ctx, loot.x, y, 30, time, loot.bobPhase);
  ctx.save();
  ctx.translate(loot.x, y);
  if (loot.kind === 'gem') {
    ctx.fillStyle = loot.name.includes('Emerald') ? '#2fd07a' : '#ff5a6e';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(9, -3); ctx.lineTo(5, 10); ctx.lineTo(-5, 10); ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(9, -3); ctx.lineTo(0, 0); ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();
  } else if (loot.kind === 'relic') {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a12';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8a5a12';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Painting: a small gilt-framed canvas.
    ctx.fillStyle = '#c9a13b';
    ctx.fillRect(-11, -13, 22, 26);
    ctx.fillStyle = '#3f6ea5';
    ctx.fillRect(-8, -10, 16, 20);
    ctx.fillStyle = '#e8d27a';
    ctx.beginPath();
    ctx.arc(2, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c4a6e';
    ctx.fillRect(-8, 4, 16, 6);
  }
  ctx.restore();
  // Value tag under the piece.
  ctx.save();
  ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd65a';
  ctx.fillText(`$${loot.value.toLocaleString('en-US')}`, loot.x, loot.y + 30);
  ctx.restore();
}

export function drawVault(ctx, vault, cracked, crackProgress, time) {
  const { x, y, w, h } = vault;
  ctx.save();
  ctx.translate(x, y);
  goldGlow(ctx, 0, 0, 70, time, 0);
  // Vault case: brushed steel with a round dial door.
  ctx.fillStyle = '#2a3648';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#8fa8c8';
  ctx.lineWidth = 3;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#1a2534';
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a13b';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (cracked) {
    ctx.fillStyle = '#0d1526';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ee787';
    ctx.font = 'bold 10px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OPEN', 0, 4);
  } else {
    // The Star glints behind the glass.
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(9, -2); ctx.lineTo(4, 11); ctx.lineTo(-4, 11); ctx.lineTo(-9, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Crack progress ring.
    if (crackProgress > 0) {
      ctx.strokeStyle = '#ffd65a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + crackProgress * Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.save();
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd65a';
  ctx.fillText(cracked ? 'VAULT OPEN' : 'THE STAR OF MERIDIAN — $5,000', x, y + h / 2 + 20);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '11px "Trebuchet MS", Verdana, sans-serif';
  if (!cracked) ctx.fillText('Hold E beside the vault to crack it', x, y + h / 2 + 36);
  ctx.restore();
}
