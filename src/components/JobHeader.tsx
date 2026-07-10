import { useEffect, useMemo } from 'react';
import type { GameState } from '../game/types';
import MuteButton from './MuteButton';

interface Props {
  state: GameState;
  title: string;
  onClearMoneyFloater: (id: number) => void;
}

function formatMoneyDelta(amount: number): string {
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount);
  const formatted =
    abs >= 1000
      ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(abs)
      : abs.toLocaleString('en-US');
  return `${sign}$${formatted}`;
}

// Roughly constant scroll *speed* no matter how long the title has grown —
// a longer title just takes proportionally longer to cross, instead of
// racing past at the same fixed duration a short title also used.
const BASE_DURATION_S = 6;
const SECONDS_PER_CHAR = 0.16;

export default function JobHeader({ state, title, onClearMoneyFloater }: Props) {
  const words = title.split(' ');
  const duration = useMemo(
    () => Math.max(BASE_DURATION_S, title.length * SECONDS_PER_CHAR),
    [title],
  );

  useEffect(() => {
    const timers = state.moneyFloaters.map((f) => window.setTimeout(() => onClearMoneyFloater(f.id), 1200));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.moneyFloaters, onClearMoneyFloater]);

  return (
    <header className="job-header">
      <div className={`job-title ${state.titleFlashMs > 0 ? 'title-flash' : ''}`}>
        <span className="job-title-eyebrow">Job Title</span>
        {/* The title only ever grows (a modifier gets prepended on every
            promotion), so instead of a plain <h1> — which would make the
            header taller and taller forever — this is a constant-size
            "viewport" with the text scrolling through it via a CSS
            animation. Deliberately NOT the native <marquee> element:
            marquee's internal sizing doesn't reliably respect CSS
            width/overflow across browsers, and that was letting the full
            unwrapped text width leak into the header's flex layout,
            shoving the funds display out past the edge of the screen. */}
        <h1 className="job-title-marquee-viewport">
          <span
            className="job-title-marquee-track"
            style={{ animationDuration: `${duration}s` }}
          >
            {words.map((word, i) =>
              state.titleFlashMs > 0 && i === 0 ? (
                <mark key={i}>{word}&nbsp;</mark>
              ) : (
                <span key={i}>{word}&nbsp;</span>
              ),
            )}
          </span>
        </h1>
      </div>
      <MuteButton />
      <div className="funds-display">
        <span className="job-title-eyebrow">{state.currencyLabel}</span>
        <div className="funds-amount">${state.funds.toLocaleString('en-US')}</div>
        {state.moneyFloaters.map((f) => (
          <span
            key={f.id}
            className={`money-floater ${f.amount >= 0 ? 'money-floater-positive' : 'money-floater-negative'}`}
          >
            {formatMoneyDelta(f.amount)}
          </span>
        ))}
      </div>
    </header>
  );
}
