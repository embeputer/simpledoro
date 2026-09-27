const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LONG_EVERY = 4; // long break after every 4 focus sessions
const RING_LEN = 2 * Math.PI * 92;

const timeEl = document.getElementById("time");
const ringEl = document.getElementById("ring");
const dialEl = document.getElementById("dial");
const toggleEl = document.getElementById("toggle");
const dotsEl = document.getElementById("dots");
const modeEls = [...document.querySelectorAll(".mode")];

let mode = "focus";
let remaining = DURATIONS[mode];
let endsAt = 0;
let timer = null;
let completed = 0;

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function render() {
  const label = fmt(remaining);
  timeEl.textContent = label;
  document.title = `${label} · simpledoro`;
  ringEl.style.strokeDashoffset = String(RING_LEN * (1 - remaining / DURATIONS[mode]));
  toggleEl.textContent = timer ? "pause" : "start";
  dialEl.classList.toggle("running", Boolean(timer));
  modeEls.forEach((el) => {
    const active = el.dataset.mode === mode;
    el.classList.toggle("active", active);
    el.setAttribute("aria-selected", String(active));
  });
  dotsEl.innerHTML = "";
  for (let i = 0; i < LONG_EVERY; i++) {
    const d = document.createElement("span");
    d.className = "dot" + (i < completed % LONG_EVERY ? " done" : "");
    dotsEl.appendChild(d);
  }
}

function stop() {
  clearInterval(timer);
  timer = null;
}

function start() {
  if (timer) return;
  endsAt = Date.now() + remaining * 1000;
  timer = setInterval(tick, 200);
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission();
  }
  render();
}

function tick() {
  remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  if (remaining === 0) finish();
  render();
}

function setMode(next, autostart = false) {
  stop();
  mode = next;
  remaining = DURATIONS[mode];
  render();
  if (autostart) start();
}

function nextMode() {
  if (mode !== "focus") return "focus";
  return completed % LONG_EVERY === 0 ? "long" : "short";
}

function finish() {
  stop();
  if (mode === "focus") completed++;
  chime();
  notify();
  setMode(nextMode(), true);
}

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.3);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* audio unavailable */
  }
}

function notify() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const body = mode === "focus" ? "Focus done — take a break." : "Break over — back to focus.";
  new Notification("simpledoro", { body });
}

function toggle() {
  if (timer) {
    stop();
  } else {
    start();
  }
  render();
}

function reset() {
  stop();
  remaining = DURATIONS[mode];
  render();
}

toggleEl.addEventListener("click", toggle);
document.getElementById("reset").addEventListener("click", reset);
document.getElementById("skip").addEventListener("click", () => setMode(nextMode()));
modeEls.forEach((el) => el.addEventListener("click", () => setMode(el.dataset.mode)));

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.code === "Space") { e.preventDefault(); toggle(); }
  else if (e.key === "r") reset();
  else if (e.key === "s") setMode(nextMode());
});

render();
