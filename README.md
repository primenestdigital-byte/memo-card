# MemoCard

A memory card-matching game with real 3D card flips, three themes, three difficulty levels, and persistent best scores.

## Features

- CSS 3D perspective flips (`rotateY` + `backface-visibility`)
- Themes: animals, food, space — switchable mid-session
- Difficulties: 12 / 16 / 24 cards
- Move counter, live timer, per-theme+difficulty best (moves & time) saved to localStorage
- Matched pairs bounce; mismatched pairs flip back after a short lock window

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## Motion

Cards flip with a 400ms `cubic-bezier(0.22, 1, 0.36, 1)` (openmotion style); matches bounce with a spring curve; the win banner rises in. `prefers-reduced-motion` respected.

## License

MIT
