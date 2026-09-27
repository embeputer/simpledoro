# simpledoro

A minimal pomodoro timer. No build, no dependencies — just HTML, CSS, and JS.

## Use

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Features

- 25 min focus / 5 min short break / 15 min long break (every 4 sessions)
- Auto-advances to the next phase with a soft chime and browser notification
- Progress ring, completed-session dots, tab-title countdown
- Keyboard: `space` start/pause, `r` reset, `s` skip
- Light/dark theme via `prefers-color-scheme`
