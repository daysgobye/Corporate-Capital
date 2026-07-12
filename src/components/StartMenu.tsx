import { useState } from 'react';

const TAGLINES: string[] = [
  "Climb the ladder. Step on whoever's below you.",
  'Turn human suffering into shareholder value.',
  'Outsource your conscience. Automate the rest.',
  'Hit every KPI. Feel absolutely nothing.',
  'Deploy AI. Replace your coworkers. Watch the line go up.',
  'Become the CEO your enemies deserve.',
  'Synergize your way to total world domination.',
  'Maximize quarterly earnings. Minimize your soul.',
  "Great leaders don't apologize. They escalate.",
  'Disrupt an industry. Ruin a planet. Repeat.',
  'Your inbox called. It would like to ruin your life.',
  "Automate empathy — it's cheaper that way.",
  'Somewhere, a KPI is crying. Go hit it anyway.',
  'Replace agents with bots. Replace those bots with more bots.',
  'The only synergy that matters is your bottom line.',
  'One reply at a time, dismantle the concept of work-life balance.',
];

function pickTagline(): string {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
}

export interface StartMenuStats {
  funds: number;
  ticketsClosed: number;
  promotions: number;
  title: string;
}

interface Props {
  loading: boolean;
  hasSave: boolean;
  stats: StartMenuStats | null;
  onStart: () => void;
}

export default function StartMenu({ loading, hasSave, stats, onStart }: Props) {
  const [tagline] = useState(pickTagline);

  return (
    <div className="start-menu-overlay">
      <div className="start-menu-card" role="dialog" aria-modal="true" aria-label="Corporate Capital main menu">
        <span className="start-menu-eyebrow">Employee Handbook &mdash; Foreword</span>
        <h1 className="start-menu-title">Corporate Capital</h1>
        <p className="start-menu-tagline">{tagline}</p>

        {loading && <p className="start-menu-loading">Retrieving your personnel file&hellip;</p>}

        {!loading && hasSave && stats && (
          <>
            <div className="start-menu-stats">
              <div className="start-menu-stat">
                <span className="start-menu-stat-value">${stats.funds.toLocaleString('en-US')}</span>
                <span className="start-menu-stat-label">capital</span>
              </div>
              <div className="start-menu-stat">
                <span className="start-menu-stat-value">{stats.ticketsClosed.toLocaleString('en-US')}</span>
                <span className="start-menu-stat-label">tickets closed</span>
              </div>
              <div className="start-menu-stat">
                <span className="start-menu-stat-value">{stats.promotions}</span>
                <span className="start-menu-stat-label">promotions</span>
              </div>
            </div>
            <p className="start-menu-title-line">
              Currently: <strong>{stats.title}</strong>
            </p>
          </>
        )}

        <button type="button" className="start-menu-btn" disabled={loading} onClick={onStart}>
          {loading ? 'LOADING…' : hasSave ? 'BACK TO THE GRIND' : 'BEGIN YOUR CAREER'}
        </button>
      </div>
    </div>
  );
}
