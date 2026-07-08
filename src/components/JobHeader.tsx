import { useEffect } from 'react';
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

export default function JobHeader({ state, title, onClearMoneyFloater }: Props) {
  const words = title.split(' ');

  useEffect(() => {
    const timers = state.moneyFloaters.map((f) => window.setTimeout(() => onClearMoneyFloater(f.id), 1200));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [state.moneyFloaters, onClearMoneyFloater]);

  return (
    <header className="job-header">
      <div className={`job-title ${state.titleFlashMs > 0 ? 'title-flash' : ''}`}>
        <span className="job-title-eyebrow">Job Title</span>
        <h1>
          {words.map((word, i) =>
            state.titleFlashMs > 0 && i === 0 ? (
              <mark key={i}>{word}</mark>
            ) : (
              <span key={i}>{word} </span>
            ),
          )}
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
