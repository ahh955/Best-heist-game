// Keyboard and mouse state for Night Fox. One module owns all input so the
// game loop only ever reads plain state: which keys are held, where the
// mouse is in canvas pixels, and which clicks happened since the last frame.

export const keysHeld = new Set();
export const keysPressed = new Set();
export const mouse = { x: 0, y: 0, down: false, clicked: false, clickX: 0, clickY: 0 };

const KEY_ALIASES = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyE: 'interact',
  Digit1: 'smoke', Digit2: 'emp', Digit3: 'coin',
  Enter: 'confirm', KeyR: 'retry', Space: 'confirm',
};

export function initInput(canvas) {
  window.addEventListener('keydown', (event) => {
    const name = KEY_ALIASES[event.code];
    if (!name) return;
    if (['up', 'down', 'left', 'right', 'confirm'].includes(name)) event.preventDefault();
    if (!keysHeld.has(name)) keysPressed.add(name);
    keysHeld.add(name);
  });
  window.addEventListener('keyup', (event) => {
    const name = KEY_ALIASES[event.code];
    if (name) keysHeld.delete(name);
  });
  window.addEventListener('blur', () => { keysHeld.clear(); keysPressed.clear(); });

  const toCanvas = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event.clientX, event.clientY);
    mouse.x = p.x; mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toCanvas(event.clientX, event.clientY);
    mouse.x = p.x; mouse.y = p.y;
    mouse.down = true; mouse.clicked = true; mouse.clickX = p.x; mouse.clickY = p.y;
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
}

// Call once per frame, after the game has read input, to clear edge events.
export function endFrameInput() {
  keysPressed.clear();
  mouse.clicked = false;
}

export function moveDirection() {
  let x = 0; let y = 0;
  if (keysHeld.has('left')) x -= 1;
  if (keysHeld.has('right')) x += 1;
  if (keysHeld.has('up')) y -= 1;
  if (keysHeld.has('down')) y += 1;
  if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  return { x, y };
}
