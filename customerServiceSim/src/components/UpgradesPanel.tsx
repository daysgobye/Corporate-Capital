import type { GameState } from '../game/types';
import { UPGRADES, MILESTONES, upgradeCost } from '../game/content';

interface Props {
  state: GameState;
  onBuyUpgrade: (id: string) => void;
  onBuyMilestone: (id: string) => void;
}

export default function UpgradesPanel({ state, onBuyUpgrade, onBuyMilestone }: Props) {
  const visibleUpgrades = UPGRADES.filter(
    (u) => u.phase === state.phase && (!u.requiresMilestone || state.milestonesUnlocked[u.requiresMilestone]),
  );
  const visibleMilestones = MILESTONES.filter(
    (m) => m.phase === state.phase && (!m.requires || state.milestonesUnlocked[m.requires]) && !state.milestonesUnlocked[m.id],
  );

  return (
    <section className="panel upgrades-panel" aria-label="Upgrades and milestones">
      <div className="panel-heading">
        <h2>Upgrades &amp; Milestones</h2>
        {state.upgradeFlashId > 0 && (
          <span key={state.upgradeFlashId} className="upgrade-flash-toast">
            ⚡ {state.upgradeFlashLabel}!
          </span>
        )}
      </div>

      <h3 className="section-label">Active Upgrades</h3>
      <ul className="upgrade-list">
        {visibleUpgrades.map((u) => {
          const level = state.upgradeLevels[u.id] ?? 0;
          const maxed = level >= u.maxLevel;
          const cost = upgradeCost(u, level);
          const affordable = state.funds >= cost;
          return (
            <li key={u.id} className="upgrade-item">
              <div className="upgrade-info">
                <strong>{u.name}</strong>
                <span className="upgrade-desc">{u.description}</span>
                <span className="upgrade-level">Lv. {level}/{u.maxLevel}</span>
              </div>
              <button type="button" disabled={maxed || !affordable} onClick={() => onBuyUpgrade(u.id)} className="buy-btn">
                {maxed ? 'MAXED' : `$${cost.toLocaleString('en-US')}`}
              </button>
            </li>
          );
        })}
        {visibleUpgrades.length === 0 && <li className="upgrade-empty">Unlock a milestone below to reveal more upgrades.</li>}
      </ul>

      <h3 className="section-label">Core Milestones</h3>
      <ul className="milestone-list">
        {visibleMilestones.map((m) => {
          const affordable = state.funds >= m.cost;
          return (
            <li key={m.id} className="milestone-item">
              <div className="upgrade-info">
                <strong>{m.name}</strong>
                <span className="upgrade-desc">{m.description}</span>
              </div>
              <button type="button" disabled={!affordable} onClick={() => onBuyMilestone(m.id)} className="milestone-btn">
                {m.buttonLabel}
                <span className="milestone-cost">${m.cost.toLocaleString('en-US')}</span>
              </button>
            </li>
          );
        })}
        {visibleMilestones.length === 0 && <li className="upgrade-empty">No further milestones on this rung. Keep grinding.</li>}
      </ul>
    </section>
  );
}
