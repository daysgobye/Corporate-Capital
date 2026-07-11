import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onWatch: () => void;
}

export default function AdPopup({ state, onWatch }: Props) {
  const popup = state.adPopup;
  if (!popup) return null;

  return (
    // Rendered at the app-shell's top level so it floats above every mobile
    // panel/tab, but — unlike a modal — it doesn't block or dim the rest of
    // the screen. Only the note itself is clickable (see pointer-events in
    // the CSS); everything behind it stays fully playable.
    <div className="ad-postit-wrap" aria-label="Insider Trading Opportunity">
      {/* Outer element handles the one-shot "stuck on" pop-in; inner element
          handles the continuous idle wobble — kept on separate elements so
          the two transform animations don't fight each other. `key` forces a
          fresh pop-in whenever a new popup (a new id, with its own freshly
          rolled eyebrow/copy/reward) overwrites the old one. */}
      <div key={popup.id} className="ad-postit-pop">
        <div className="ad-postit" role="dialog" aria-modal="false">
          <span className="ad-postit-pin" aria-hidden="true">📌</span>
          <span className="ad-postit-eyebrow">{popup.eyebrow}</span>
          <p className="ad-postit-copy">{popup.copy}</p>
          <div className="ad-postit-reward">+${popup.rewardAmount.toLocaleString('en-US')}</div>
          <button type="button" className="ad-postit-btn" onClick={onWatch}>
            {state.adsUnlocked ? 'COLLECT' : '▶ WATCH AD'}
          </button>
        </div>
      </div>
    </div>
  );
}
