import { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import JobHeader from './components/JobHeader';
import ChatPanel from './components/ChatPanel';
import ManagementPanel from './components/ManagementPanel';
import UpgradesPanel from './components/UpgradesPanel';
import EffectsLayer from './components/EffectsLayer';
import MobileTabBar from './components/MobileTabBar';
import type { MobileTab } from './components/MobileTabBar';
import './game/game.css';

function App() {
  const { state, currentTitle, keypress, send, useCanned, buyUpgrade, buyMilestone, clearParticle, clearFloater } =
    useGameEngine();
  const [mobileTab, setMobileTab] = useState<MobileTab>('queue');

  return (
    <div className="app-shell">
      <JobHeader state={state} title={currentTitle} />

      <main className={`panels-grid mobile-show-${mobileTab}`}>
        <ChatPanel state={state} onKeypress={keypress} onSend={send} onCanned={useCanned} />
        <ManagementPanel state={state} />
        <UpgradesPanel state={state} onBuyUpgrade={buyUpgrade} onBuyMilestone={buyMilestone} />
      </main>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} />

      <EffectsLayer state={state} onClearParticle={clearParticle} onClearFloater={clearFloater} />
    </div>
  );
}

export default App;
