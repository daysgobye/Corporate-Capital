

import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onDismiss: () => void;
}

export default function AfkSummaryPopup({ state, onDismiss }: Props) {
  const summary = state.afkSummary;
  if (!summary) return null;

  return (
    <div className="afk-summary-overlay" role="dialog" aria-modal="true" aria-label="Welcome back summary">
      <div key={summary.id} className="afk-summary-card">
        <span className="afk-summary-eyebrow">AFK Play Report</span>
        <h2 className="afk-summary-headline">{summary.headline}</h2>
        <p className="afk-summary-subline">{summary.subline}</p>

        <div className="afk-summary-stats">
          <div className="afk-summary-stat">
            <span className="afk-summary-stat-value">{summary.minutes}</span>
            <span className="afk-summary-stat-label">minutes away</span>
          </div>
          <div className="afk-summary-stat">
            <span className="afk-summary-stat-value">{summary.ticketsClosed.toLocaleString('en-US')}</span>
            <span className="afk-summary-stat-label">tickets closed</span>
          </div>
          <div className="afk-summary-stat">
            <span className="afk-summary-stat-value">${summary.fundsGained.toLocaleString('en-US')}</span>
            <span className="afk-summary-stat-label">earned</span>
          </div>
        </div>

        <button type="button" className="afk-summary-btn" onClick={onDismiss}>
          BACK TO WORK
        </button>
      </div>
    </div>
  );
}
