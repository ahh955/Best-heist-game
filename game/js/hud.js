// The HUD: the alarm meter, the loot tally, the clock and the tool belt.
// Drawn on the canvas so the screenshots carry exactly what the player sees.
// Tool buttons are real click targets; their rects are exported for input.

import { alarmDanger, alarmFraction } from './alarm.js';
import { totalLootValue } from './levels.js';

export const TOOL_BUTTONS = [
  { key: 'smoke', label: 'SMOKE', hint: '1', x: 24, y: 668, w: 150, h: 40 },
  { key: 'emp', label: 'EMP', hint: '2', x: 186, y: 668, w: 150, h: 40 },
  { key: 'coin', label: 'COIN TOSS', hint: '3', x: 348, y: 668, w: 150, h: 40 },
];

export function toolButtonAt(x, y) {
  for (const button of TOOL_BUTTONS) {
    if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) return button;
  }
  return null;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function alarmColor(danger) {
  if (danger === 'critical') return '#ff3c3c';
  if (danger === 'rising') return '#ffb020';
  return '#7ee787';
}

export function drawHud(ctx, state) {
  // Top bar.
  ctx.fillStyle = 'rgba(5, 10, 20, 0.92)';
  ctx.fillRect(0, 0, 1280, 66);
  ctx.strokeStyle = '#24365a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 66);
  ctx.lineTo(1280, 66);
  ctx.stroke();

  // Brand + room.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8823c';
  ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('NIGHT FOX', 24, 28);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(state.room.name, 24, 50);

  // Alarm meter, centered and impossible to miss.
  const meterX = 470; const meterY = 16; const meterW = 340; const meterH = 24;
  const danger = alarmDanger(state.alarm);
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', meterX + meterW / 2, meterY - 4);
  ctx.fillStyle = '#1a2534';
  ctx.fillRect(meterX, meterY + 6, meterW, meterH);
  ctx.strokeStyle = '#3a4f73';
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX, meterY + 6, meterW, meterH);
  ctx.fillStyle = alarmColor(danger);
  ctx.fillRect(meterX + 2, meterY + 8, (meterW - 4) * alarmFraction(state.alarm), meterH - 4);
  ctx.fillStyle = danger === 'calm' ? '#7ee787' : '#ffffff';
  ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
  const alarmWord = state.alarm.tripped ? 'TRIPPED!' : danger === 'critical' ? 'RUN!' : danger === 'rising' ? 'SPOTTED' : 'QUIET';
  ctx.fillText(alarmWord, meterX + meterW / 2, meterY + 24);

  // Loot tally + clock, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 19px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`LOOT $${state.lootValue.toLocaleString('en-US')}`, 1256, 29);
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`${state.lootCount} pieces · of $${totalLootValue().toLocaleString('en-US')} · ${formatTime(state.time)}`, 1256, 50);

  // Message line under the top bar.
  if (state.message && state.messageTimer > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = state.messageColor || '#ffffff';
    ctx.fillText(state.message, 640, 112);
  }

  // Bottom bar: the tool belt.
  ctx.fillStyle = 'rgba(5, 10, 20, 0.92)';
  ctx.fillRect(0, 660, 1280, 60);
  ctx.strokeStyle = '#24365a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 660);
  ctx.lineTo(1280, 660);
  ctx.stroke();
  for (const button of TOOL_BUTTONS) {
    const charges = state.toolkit[button.key];
    const armed = button.key === 'coin' && state.toolkit.coinArmed;
    ctx.fillStyle = charges > 0 ? (armed ? '#5a4a12' : '#1a2534') : '#121a28';
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeStyle = armed ? '#ffd65a' : '#3a4f73';
    ctx.lineWidth = 2;
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.textAlign = 'left';
    ctx.fillStyle = charges > 0 ? '#ffffff' : '#5a6b80';
    ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`[${button.hint}] ${button.label}`, button.x + 10, button.y + 25);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`x${charges}`, button.x + button.w - 10, button.y + 25);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9fb4d0';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('WASD / arrows move · SHIFT sneak · E crack vault · R retry room', 1256, 693);
}
