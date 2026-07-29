import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../game/types';
import { isVisualsMuted, subscribeVisualsMuted } from '../lib/visuals';

interface Props {
  state: GameState;
  onClearParticle: (id: number) => void;
  onClearFloater: (id: number) => void;
}

const CONFETTI_COLORS = ['--accent', '--toner-red', '--synergy-green', '--highlight-yellow'];

export default function EffectsLayer({ state, onClearParticle, onClearFloater }: Props) {
  const [visualsMuted, setVisualsMuted] = useState(isVisualsMuted());
  useEffect(() => subscribeVisualsMuted(setVisualsMuted), []);

  // These clear-out effects stay active even while visuals are muted, so the
  // underlying arrays don't quietly grow forever — they just never get
  // rendered below.
  useEffect(() => {
    const timers = state.particles.map((p) => window.setTimeout(() => onClearParticle(p.id), 1100));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.particles, onClearParticle]);

  useEffect(() => {
    const timers = state.floaters.map((f) => window.setTimeout(() => onClearFloater(f.id), 1400));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.floaters, onClearFloater]);

  const confettiPieces = useMemo(() => {
    if (visualsMuted || state.confettiBurst === 'none') return [];
    const count = state.confettiBurst === 'big' ? 36 : 16;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 0.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    }));
  }, [state.confettiBurst, visualsMuted]);

  // Visual effects toggled off — skip rendering the particles/floaters/
  // confetti/stamp entirely. This is the main perf win: no DOM nodes, no
  // CSS animations running, regardless of how much automation is spawning
  // "pop" events under the hood.
  if (visualsMuted) return null;

  return (
    <div className="effects-layer" aria-hidden="true">
      {state.particles.map((p) => (
        <span
          key={p.id}
          className="jargon-particle"
          style={{ left: `${p.left}%`, color: `var(${p.colorVar})` }}
        >
          {p.text}
        </span>
      ))}

      {state.floaters.map((f) => (
        <span key={f.id} className="income-floater" style={{ left: `${f.left}%` }}>
          +${f.amount}
        </span>
      ))}

      {state.confettiBurst !== 'none' && (
        <div className={`confetti-field confetti-${state.confettiBurst}`}>
          {confettiPieces.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                background: `var(${c.color})`,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {state.stamp.id > 0 && (
        <div key={state.stamp.id} className="stamp-mark">
          {state.stamp.text.replace(/[,!]+$/, '').trim() || 'SENT!'}
        </div>
      )}
    </div>
  );
}
