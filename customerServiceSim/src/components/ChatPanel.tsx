import { useEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { CANNED_LABELS } from '../game/content';
import VirtualKeyboard from './Virtualkeyboard';

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

  // Typing works anywhere on the page — no need to click into a box first.
  // It only does anything if there's a ticket open to apply it to.
  const hasTicketRef = useRef(!!ticket);
  hasTicketRef.current = !!ticket;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const onKeypressRef = useRef(onKeypress);
  onKeypressRef.current = onKeypress;
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!hasTicketRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLElement && ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'Enter') {
        if (readyRef.current) onSendRef.current();
        else onKeypressRef.current();
        return;
      }
      if (e.key.length !== 1 && e.key !== ' ' && e.key !== 'Backspace') return;
      onKeypressRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className={`panel chat-panel ${state.shake ? 'panic-shake' : ''}`} aria-label="Ticket queue and reply workspace">
      <div className="panel-heading">
        <h2>Incoming Tickets</h2>
        <div className="queue-badge-wrap">
          {state.arrivalPulse > 0 && (
            <span key={state.arrivalPulse} className="arrival-ping" aria-hidden="true">✉️</span>
          )}
          <span className={`queue-badge ${state.shake ? 'queue-badge-hot' : ''}`}>
            {state.queue.length + (ticket ? 1 : 0)}/40
          </span>
        </div>
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

      <div className="workspace">
        <div className="workspace-history">
          {state.typedPreview ? state.typedPreview : <span className="placeholder">Mash your keyboard to draft a reply…</span>}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <VirtualKeyboard onKeypress={onKeypress} disabled={!ticket} />

      {state.milestonesUnlocked.cannedResponses && (
        <div className="canned-row">
          {CANNED_LABELS[state.phase].map((c) => (
            <button key={c.pct} type="button" disabled={!cannedReady || !ticket} onClick={() => onCanned(c.pct)} className="canned-btn">
              [{c.label}]
            </button>
          ))}
        </div>
      )}

      <button type="button" className={`send-btn ${ready ? 'send-btn-ready' : ''}`} disabled={!ready} onClick={onSend}>
        SEND REPLY
      </button>
    </section>
  );
}
