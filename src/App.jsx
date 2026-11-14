import React, { useEffect, useMemo, useState } from 'react'

const THEMES = {
  animals: ['🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐸', '🐵', '🦉', '🐺', '🦄', '🐢'],
  food: ['🍕', '🍔', '🌮', '🍣', '🍩', '🍎', '🥑', '🍉', '🍰', '🍟', '🍪', '🥨'],
  space: ['🚀', '🌙', '⭐', '🪐', '☄️', '🛸', '🌌', '🔭', '👽', '🌍', '🌟', '🌠'],
}

const DIFFS = {
  easy: { pairs: 6, cols: 4, label: 'easy (12 cards)' },
  medium: { pairs: 8, cols: 4, label: 'medium (16 cards)' },
  hard: { pairs: 12, cols: 6, label: 'hard (24 cards)' },
}

const KEY = 'memocard-best'

function buildDeck(theme, pairs) {
  const chosen = THEMES[theme].slice(0, pairs)
  const deck = [...chosen, ...chosen].map((emoji, i) => ({
    id: i,
    key: emoji,
    flipped: false,
    matched: false,
  }))
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function loadBest() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}

export default function App() {
  const [theme, setTheme] = useState('animals')
  const [diff, setDiff] = useState('easy')
  const [deck, setDeck] = useState(() => buildDeck('animals', DIFFS.easy.pairs))
  const [flippedIds, setFlippedIds] = useState([])
  const [moves, setMoves] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [won, setWon] = useState(false)
  const [best, setBest] = useState(loadBest)
  const [lockBoard, setLockBoard] = useState(false)

  const matchedPairs = deck.filter(c => c.matched).length / 2
  const totalPairs = DIFFS[diff].pairs

  // timer
  useEffect(() => {
    if (startedAt == null || won) return
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(iv)
  }, [startedAt, won])

  const newGame = (t = theme, d = diff) => {
    setDeck(buildDeck(t, DIFFS[d].pairs))
    setFlippedIds([])
    setMoves(0)
    setStartedAt(Date.now())
    setElapsed(0)
    setWon(false)
    setLockBoard(false)
  }

  const flip = (id) => {
    if (lockBoard || won) return
    const card = deck.find(c => c.id === id)
    if (card.flipped || card.matched) return
    if (flippedIds.length === 2) return

    const nextFlipped = [...flippedIds, id]
    setDeck(d => d.map(c => c.id === id ? { ...c, flipped: true } : c))
    setFlippedIds(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = nextFlipped.map(fid => deck.find(c => c.id === fid))
      if (a.key === b.key) {
        // match
        setTimeout(() => {
          setDeck(d => d.map(c => nextFlipped.includes(c.id) ? { ...c, matched: true, flipped: true } : c))
          setFlippedIds([])
        }, 350)
      } else {
        setLockBoard(true)
        setTimeout(() => {
          setDeck(d => d.map(c => nextFlipped.includes(c.id) ? { ...c, flipped: false } : c))
          setFlippedIds([])
          setLockBoard(false)
        }, 750)
      }
    }
  }

  // win detection
  useEffect(() => {
    if (!deck.length || startedAt == null) return
    if (deck.every(c => c.matched) && !won) {
      setWon(true)
      const time = Math.floor((Date.now() - startedAt) / 1000)
      const key = `${theme}-${diff}`
      setBest(b => {
        const prev = b[key]
        if (!prev || moves < prev.moves || (moves === prev.moves && time < prev.time)) {
          const next = { ...b, [key]: { moves, time } }
          localStorage.setItem(KEY, JSON.stringify(next))
          return next
        }
        return b
      })
    }
  }, [deck, won, startedAt, moves, theme, diff])

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const cols = DIFFS[diff].cols

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Memo<span style={{ color: '#60a5fa' }}>Card</span></h1>
        <div className="mono flex gap-4 text-sm">
          <span>moves <strong>{moves}</strong></span>
          <span style={{ color: 'var(--muted)' }}>time {fmtTime(elapsed)}</span>
        </div>
      </header>

      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {Object.keys(THEMES).map(t => (
          <button key={t} className={`diff-btn ${theme === t ? 'active' : ''}`}
            onClick={() => { setTheme(t); newGame(t, diff) }}>{t}</button>
        ))}
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--border)' }} />
        {Object.entries(DIFFS).map(([d, cfg]) => (
          <button key={d} className={`diff-btn ${diff === d ? 'active' : ''}`}
            onClick={() => { setDiff(d); newGame(theme, d) }}>{cfg.label}</button>
        ))}
        <span className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          best: {best[`${theme}-${diff}`] ? `${best[`${theme}-${diff}`].moves} moves / ${fmtTime(best[`${theme}-${diff}`].time)}` : '—'}
        </span>
      </div>

      {/* board */}
      <div className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {deck.map(card => (
          <div key={card.id}
            className={`card3d ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            style={{ height: 84 }}
            onClick={() => flip(card.id)}
            role="button"
            aria-label={card.flipped || card.matched ? card.key : 'hidden card'}>
            <div className="card-face card-front">
              <span style={{ color: 'var(--muted)', fontSize: 22, opacity: 0.5 }}>?</span>
            </div>
            <div className="card-face card-back-face">
              {card.key}
            </div>
          </div>
        ))}
      </div>

      {/* progress + win */}
      <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
        {matchedPairs}/{totalPairs} pairs found
      </p>

      {won && (
        <div className="win-banner mt-4 rounded-2xl p-5 text-center"
          style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.4)' }}>
          <p className="text-lg font-bold">🎉 all pairs found!</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {moves} moves · {fmtTime(elapsed)}
            {best[`${theme}-${diff}`]?.moves === moves ? ' · new best!' : ''}
          </p>
          <button onClick={() => newGame()}
            className="mt-3 rounded-xl px-6 py-2 text-sm font-semibold"
            style={{ background: '#60a5fa', color: '#101421' }}>
            play again
          </button>
        </div>
      )}
    </div>
  )
}
