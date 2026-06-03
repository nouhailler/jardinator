const MAX = 150;
let _logs = [];
let _subs = new Set();

function notify() {
  const snap = [..._logs];
  _subs.forEach(fn => fn(snap));
}

export function addLog(level, msg, detail = '') {
  _logs.unshift({
    id: Date.now() + Math.random(),
    ts: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    level,  // 'info' | 'ok' | 'warn' | 'error'
    msg,
    detail,
  });
  if (_logs.length > MAX) _logs.length = MAX;
  notify();
}

export function clearLogs() {
  _logs = [];
  notify();
}

export function subscribeLogs(fn) {
  _subs.add(fn);
  fn([..._logs]);
  return () => _subs.delete(fn);
}
