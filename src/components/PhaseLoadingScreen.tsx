import { useMemo } from 'react';

const LOADING_LINES = [
  'Filing your promotion paperwork…',
  'Notifying HR of your new title…',
  'Reorganizing the org chart…',
  'Issuing your new business cards…',
  'Onboarding you into middle management…',
  'Updating your LinkedIn headline…',
  'Rebranding your inbox…',
  'Calibrating your new KPIs…',
];

function pickLine(): string {
  return LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)];
}

export default function PhaseLoadingScreen() {
  const line = useMemo(pickLine, []);
  return (
    <div className="phase-loading-overlay" role="status" aria-live="polite">
      <div className="phase-loading-card">
        <span className="phase-loading-spinner" aria-hidden="true" />
        <p className="phase-loading-text">{line}</p>
      </div>
    </div>
  );
}
