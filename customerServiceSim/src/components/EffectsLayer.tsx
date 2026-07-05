import { useEffect, useMemo } from 'react';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onClearParticle: (id: number) => void;
  onClearFloater: (id: number) => void;
}

const CONFETTI_COLORS = ['--accent', '--toner-red', '--synergy-green', '--highlight-yellow'];

export default function EffectsLayer({ state, onClearParticle, onClearFloater }: Props) {
  useEffect(() => {
    const timers = state.particles.map((p) => window.setTimeout(() => onClearParticle(p.id), 1100));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.particles, onClearParticle]);

  useEffect(() => {
    const timers = state.floaters.map((f) => window.setTimeout(() => onClearFloater(f.id), 1400));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.floaters, onClearFloater]);

  const confettiPieces = useMemo(() => {
    if (!state.confetti) return [];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 0.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    }));
  }, [state.confetti]);

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

      {state.confetti && (
        <div className="confetti-field">
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
    </div>
  );
}
