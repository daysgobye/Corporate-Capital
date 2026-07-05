export type MobileTab = 'queue' | 'dashboard' | 'upgrades';

interface Props {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'queue', label: 'Queue' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'upgrades', label: 'Upgrades' },
];

export default function MobileTabBar({ active, onChange }: Props) {
  return (
    <nav className="mobile-tab-bar" aria-label="Switch panel">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`mobile-tab ${active === tab.id ? 'mobile-tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
