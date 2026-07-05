import type { KeyboardEvent } from 'react';
import type { GameState } from '../game/types';
import { CANNED_LABELS } from '../game/content';

interface Props {
  state: GameState;
  onKeypress: () => void;
  onSend: () => void;
  onCanned: (pct: number) => void;
}

export default function ChatPanel({ state, onKeypress, onSend, onCanned }: Props) {
  const ticket = state.activeTicket;
  const progressPct = ticket ? Math.min(100, (state.manualProgress / ticket.requiredChars) * 100) : 0;
  const ready = ticket ? state.manualProgress >= ticket.requiredChars : false;
  const cannedReady = state.milestonesUnlocked.cannedResponses && state.cannedCooldownMs <= 0;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key.length !== 1 && e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Backspace') return;
    if (!ticket) return;
    onKeypress();
  }

  return (
    <section className={`panel chat-panel ${state.shake ? 'panic-shake' : ''}`} aria-label="Ticket queue and reply workspace">
      <div className="panel-heading">
        <h2>Incoming Tickets</h2>
        <span className={`queue-badge ${state.shake ? 'queue-badge-hot' : ''}`}>
          {state.queue.length + (ticket ? 1 : 0)}/40
        </span>
      </div>

      <ul className="queue-list">
        {ticket && (
          <li className="queue-item queue-item-active">
            Ticket #{ticket.id} <span>— open</span>
          </li>
        )}
        {state.queue.slice(0, 6).map((t) => (
          <li key={t.id} className="queue-item">
            Ticket #{t.id} <span>— waiting</span>
          </li>
        ))}
        {state.queue.length > 6 && <li className="queue-item queue-item-more">+{state.queue.length - 6} more</li>}
        {!ticket && state.queue.length === 0 && <li className="queue-item queue-item-empty">Inbox zero. Enjoy it while it lasts.</li>}
      </ul>

      <div
        className="workspace"
        tabIndex={0}
        role="textbox"
        aria-label="Type anywhere in this box to draft your reply"
        onKeyDown={handleKeyDown}
      >
        <div className="workspace-history">
          {state.typedPreview ? state.typedPreview : <span className="placeholder">Click here, then mash your keyboard to draft a reply…</span>}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {state.milestonesUnlocked.cannedResponses && (
        <div className="canned-row">
          {CANNED_LABELS[state.phase].map((c) => (
            <button key={c.pct} type="button" disabled={!cannedReady || !ticket} onClick={() => onCanned(c.pct)} className="canned-btn">
              [{c.label}]
            </button>
          ))}
        </div>
      )}

      <button type="button" className="send-btn" disabled={!ready} onClick={onSend}>
        SEND REPLY
      </button>
    </section>
  );
}
