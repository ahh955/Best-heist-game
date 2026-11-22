// The alarm meter: the game's heartbeat. It fills while any guard or camera
// holds the Fox in sight, drains while the Fox stays hidden, and at full it
// trips the alarm — guards converge, and the run ends in a bust. A brief
// glimpse only raises it partway, so a fair escape is always possible.

export const ALARM_MAX = 100;
export const ALARM_GUARD_RATE = 42;
export const ALARM_CAMERA_RATE = 55;
export const ALARM_DRAIN_RATE = 14;

export function createAlarm() {
  return { level: 0, tripped: false, trips: 0, lastTickSecond: -1 };
}

export function raiseAlarm(alarm, rate, dt) {
  if (alarm.tripped) return;
  alarm.level = Math.min(ALARM_MAX, alarm.level + rate * dt);
  if (alarm.level >= ALARM_MAX) {
    alarm.tripped = true;
    alarm.trips += 1;
  }
}

export function drainAlarm(alarm, dt) {
  if (alarm.tripped) return;
  alarm.level = Math.max(0, alarm.level - ALARM_DRAIN_RATE * dt);
}

export function alarmFraction(alarm) {
  return alarm.level / ALARM_MAX;
}

export function alarmDanger(alarm) {
  if (alarm.level >= 70) return 'critical';
  if (alarm.level >= 35) return 'rising';
  return 'calm';
}
