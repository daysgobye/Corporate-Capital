import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onDismiss: () => void;
  onClaimBonus: () => void;
}

export default function AfkSummaryPopup({ state, onDismiss, onClaimBonus }: Props) {
  const summary = state.afkSummary;
  if (!summary) return null;

  const displayedFunds = summary.bonusClaimed ? summary.fundsGained * 2 : summary.fundsGained;

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
            <span className="afk-summary-stat-value">${displayedFunds.toLocaleString('en-US')}</span>
            <span className="afk-summary-stat-label">earned</span>
          </div>
        </div>

        {summary.fundsGained > 0 && (
          summary.bonusClaimed ? (
            <div className="afk-bonus-claimed">✓ EARNINGS DOUBLED</div>
          ) : (
            <button type="button" className="afk-bonus-btn" onClick={onClaimBonus}>
              ▶ WATCH AD TO DOUBLE EARNINGS
            </button>
          )
        )}

        <button type="button" className="afk-summary-btn" onClick={onDismiss}>
          BACK TO WORK
        </button>
      </div>
    </div>
  );
}
