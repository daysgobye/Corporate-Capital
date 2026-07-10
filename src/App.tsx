import { useEffect, useRef, useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import JobHeader from './components/JobHeader';
import ChatPanel from './components/ChatPanel';
import ManagementPanel from './components/ManagementPanel';
import UpgradesPanel from './components/UpgradesPanel';
import EffectsLayer from './components/EffectsLayer';
import MobileTabBar from './components/MobileTabBar';
import AdPopup from './components/AdPopup';
import type { MobileTab } from './components/MobileTabBar';
import './game/game.css';

function App() {
  const {
    state, currentTitle, keypress, send, useCanned, buyUpgrade, buyMilestone,
    clearParticle, clearFloater, clearMoneyFloater, watchAd,
  } = useGameEngine();
  const [mobileTab, setMobileTab] = useState<MobileTab>('queue');

  const [cashShake, setCashShake] = useState(false);
  const prevMoneyShakeId = useRef(state.moneyShakeId);
  useEffect(() => {
    if (state.moneyShakeId !== prevMoneyShakeId.current) {
      prevMoneyShakeId.current = state.moneyShakeId;
      setCashShake(true);
      const t = window.setTimeout(() => setCashShake(false), 450);
      return () => window.clearTimeout(t);
    }
  }, [state.moneyShakeId]);

  return (
    <div className={`app-shell ${cashShake ? 'cash-shake' : ''}`}>
      <JobHeader state={state} title={currentTitle} onClearMoneyFloater={clearMoneyFloater} />

      <main className={`panels-grid mobile-show-${mobileTab}`}>
        <ChatPanel state={state} onKeypress={keypress} onSend={send} onCanned={useCanned} />
        <ManagementPanel state={state} />
        <UpgradesPanel state={state} onBuyUpgrade={buyUpgrade} onBuyMilestone={buyMilestone} />
      </main>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} />

      <EffectsLayer state={state} onClearParticle={clearParticle} onClearFloater={clearFloater} />

      {/* Rendered at the app-shell's top level (outside panels-grid) so it always
          shows on top regardless of which mobile tab is currently active. */}
      <AdPopup state={state} onWatch={watchAd} />
    </div>
  );
}

export default App;
