import type { GameState } from '../game/types';

interface Props {
  state: GameState;
}

export default function ManagementPanel({ state }: Props) {
  return (
    <section className="panel management-panel" aria-label="Management dashboard">
      <div className="panel-heading">
        <h2>Management Pane</h2>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Active Load</span>
          <span className="stat-value">{state.queue.length + (state.activeTicket ? 1 : 0)}/40</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Resolution Rate</span>
          <span className="stat-value">{state.ticketsPerSec}/sec</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Closed</span>
          <span className="stat-value">{state.ticketsClosed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Promotions</span>
          <span className="stat-value">{state.promotions}</span>
        </div>
      </div>

      <div className="ops-list">
        <h3>Automated Operations</h3>
        {state.aiBotNodes === 0 && state.agentCount === 0 && (
          <p className="ops-empty">Nothing automated yet. Everything runs through you.</p>
        )}
        {state.aiBotNodes > 0 && (
          <div className="ops-row">
            <span>{state.phase === 3 ? 'HR Bots' : 'SynergyBot'}</span>
            <span>{state.aiBotNodes} node{state.aiBotNodes === 1 ? '' : 's'}</span>
          </div>
        )}
        {state.agentCount > 0 && (
          <div className="ops-row">
            <span>{state.phase === 3 ? 'Middle Managers' : 'Overseas Team'}</span>
            <span>{state.agentCount} agent{state.agentCount === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>

      <div className="afk-status">
        <h3>AFK Play</h3>
        {!state.afkUnlocked && (
          <p className="ops-empty">
            Locked. Unlock your first autopilot upgrade to let the office keep working while you&apos;re away.
          </p>
        )}
        {state.afkUnlocked && (
          <div className="afk-status-row">
            <span>Time Banked</span>
            <span className="afk-status-value">{state.afkMinutesCap} min</span>
          </div>
        )}
      </div>
    </section>
  );
}
