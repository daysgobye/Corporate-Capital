import { useEffect, useRef, useState } from 'react';

import Onboarding from './components/Onboarding';
import { isOnboardingSeen, markOnboardingSeen } from './lib/onboarding';
import { useGameEngine } from './hooks/useGameEngine';
import JobHeader from './components/JobHeader';
import ChatPanel from './components/ChatPanel';
import ManagementPanel from './components/ManagementPanel';
import UpgradesPanel from './components/UpgradesPanel';
import EffectsLayer from './components/EffectsLayer';
import MobileTabBar from './components/MobileTabBar';
import AdPopup from './components/AdPopup';
import AfkSummaryPopup from './components/AfkSummaryPopup';
import PhaseLoadingScreen from './components/PhaseLoadingScreen';
import type { MobileTab } from './components/MobileTabBar';
import './game/game.css';
import StartMenu from './components/StartMenu';

function App() {
  const {
    state, currentTitle, keypress, send, useCanned, buyUpgrade, buyMilestone,
    clearParticle, clearFloater, clearMoneyFloater, watchAd, clearAfkSummary,
    claimAfkBonus, phaseTransitioning,
    saveChecked, hasSave, hasStarted, start,
    cheatAddFunds,
    setEnginePaused, isPaused
  } = useGameEngine();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingSeenRef = useRef(false);


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
  useEffect(() => {
    isOnboardingSeen().then((seen) => { onboardingSeenRef.current = seen; });
  }, []);
  useEffect(() => {
    setEnginePaused(showOnboarding);
  }, [showOnboarding, setEnginePaused]);
  const handleStart = () => {
    start();
    if (!hasSave && !onboardingSeenRef.current) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
    onboardingSeenRef.current = true;
    markOnboardingSeen();
  };


  if (!hasStarted) {
    return (
      <StartMenu
        loading={!saveChecked}
        hasSave={hasSave}
        stats={
          hasSave
            ? {
              funds: state.funds,
              ticketsClosed: state.ticketsClosed,
              promotions: state.promotions,
              title: currentTitle,
            }
            : null
        }
        onStart={handleStart}
      />
    );
  }

  return (
    <div className={`app-shell ${cashShake ? 'cash-shake' : ''} ${isPaused ? 'game-paused' : ''}`}>
      <JobHeader state={state} title={currentTitle} onClearMoneyFloater={clearMoneyFloater} />

      <main className={`panels-grid mobile-show-${mobileTab}`}>
        <ChatPanel state={state} onKeypress={keypress} onSend={send} onCanned={useCanned} />
        <ManagementPanel state={state} />
        <UpgradesPanel state={state} onBuyUpgrade={buyUpgrade} onBuyMilestone={buyMilestone} />
      </main>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} />
      <Onboarding
        active={showOnboarding}
        onSetMobileTab={setMobileTab}
        onFinish={handleOnboardingFinish}
      />
      <EffectsLayer state={state} onClearParticle={clearParticle} onClearFloater={clearFloater} />

      <AdPopup state={state} onWatch={watchAd} />

      <AfkSummaryPopup state={state} onDismiss={clearAfkSummary} onClaimBonus={claimAfkBonus} />

      {phaseTransitioning && <PhaseLoadingScreen />}
      <button
        type="button"
        onClick={() => cheatAddFunds(100_000)}
        aria-label="Dev cheat: add 100k funds"
        title="Dev cheat: +$100,000"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 32,
          height: 32,
          padding: 0,
          margin: 0,
          border: 'none',
          background: 'transparent',
          opacity: 0,
          cursor: 'default',
          zIndex: 9999,
        }}
      />
    </div>
  );
}

export default App;
