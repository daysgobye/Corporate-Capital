import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onWatch: () => void;
}

export default function AdPopup({ state, onWatch }: Props) {
  const popup = state.adPopup;
  if (!popup) return null;
  return (<>
  </>)
  return (
    <div className="ad-popup-overlay" role="dialog" aria-modal="true" aria-label="Insider Trading Opportunity">
      <div key={popup.id} className="ad-popup">
        <span className="ad-popup-eyebrow">Confidential Tip</span>
        <h2>Insider Trading Opportunity</h2>
        <p className="ad-popup-copy">
          {state.adsUnlocked
            ? 'Your broker already cleared this one. No video required.'
            : 'A guy who definitely works at the SEC has a tip. Watch a short video to hear him out.'}
        </p>
        <div className="ad-popup-reward">+${popup.rewardAmount.toLocaleString('en-US')}</div>
        <button type="button" className="ad-popup-btn" onClick={onWatch}>
          {state.adsUnlocked ? 'COLLECT TIP' : '▶ WATCH AD FOR REWARD'}
        </button>
      </div>
    </div>
  );
}
