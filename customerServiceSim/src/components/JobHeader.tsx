import type { GameState } from '../game/types';
import MuteButton from './MuteButton';

interface Props {
  state: GameState;
  title: string;
}

export default function JobHeader({ state, title }: Props) {
  const words = title.split(' ');
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
      </div>
    </header>
  );
}
