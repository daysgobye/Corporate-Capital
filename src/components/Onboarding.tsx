import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MobileTab } from './MobileTabBar';

interface OnboardingStep {
  id: string;
  selector: string;
  mobileTab: MobileTab;
  title: string;
  body: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'tickets',
    selector: '.chat-panel .queue-list',
    mobileTab: 'queue',
    title: "Congrats, you're hired.",
    body: 'This is your queue. Support tickets land here the second someone out there is having a bad day.',
  },
  {
    id: 'type',
    selector: '.workspace',
    mobileTab: 'queue',
    title: 'Look busy.',
    body: 'Mash your keyboard (or tap the on-screen keys) to draft a reply. Every keystroke fills the bar below.',
  },
  {
    id: 'send',
    selector: '.send-btn',
    mobileTab: 'queue',
    title: "That's a paycheck.",
    body: "Once the bar's full, hit SEND. You get paid for every ticket you close. Try not to feel anything.",
  },
  {
    id: 'upgrades',
    selector: '.upgrade-list',
    mobileTab: 'upgrades',
    title: "Spend it wisely. Or don't.",
    body: 'Upgrades live here. Some bring in more tickets, some pay more per ticket, and some quietly automate you out of a job. Synergy.',
  },
  {
    id: 'milestones',
    selector: '.milestone-list',
    mobileTab: 'upgrades',
    title: 'The big stuff.',
    body: 'Milestones unlock outsourced agents, AI bots, and eventually a promotion. Each one makes you a little more replaceable.',
  },
  {
    id: 'stats',
    selector: '.management-panel',
    mobileTab: 'dashboard',
    title: 'The Management Pane.',
    body: 'Track your income, your queue, and how automated your job has become. All the numbers that matter, allegedly.',
  },
];

function computeCardStyle(rect: DOMRect | null): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(300, vw - 32);

  if (!rect) {
    return { top: '50%', left: '50%', width, transform: 'translate(-50%, -50%)' };
  }

  const spaceBelow = vh - rect.bottom;
  const placeBelow = spaceBelow > 190 || rect.top < 190;
  const top = placeBelow
    ? Math.min(rect.bottom + 18, vh - 210)
    : Math.max(16, rect.top - 200);

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(16, Math.min(left, vw - width - 16));

  return { top, left, width };
}

interface Props {
  active: boolean;
  onSetMobileTab: (tab: MobileTab) => void;
  onFinish: () => void;
}

export default function Onboarding({ active, onSetMobileTab, onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const isFinalStep = stepIndex >= STEPS.length;
  const step = STEPS[stepIndex];

  useEffect(() => {
    if (active) setStepIndex(0);
  }, [active]);

  useEffect(() => {
    if (!active || isFinalStep) return;
    onSetMobileTab(step.mobileTab);
  }, [active, isFinalStep, step, onSetMobileTab]);

  useEffect(() => {
    if (!active || isFinalStep) {
      setRect(null);
      return;
    }
    function measure() {
      const el = document.querySelector(step.selector);
      setRect(el ? el.getBoundingClientRect() : null);
    }
    // Give the mobile-tab class swap a frame to land before measuring.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(measure);
    });
    window.addEventListener('resize', measure);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
    };
  }, [active, isFinalStep, step]);

  if (!active) return null;

  if (isFinalStep) {
    return (
      <div className="onboarding-overlay onboarding-overlay-final">
        <div className="onboarding-final-card">
          <span className="onboarding-eyebrow">Orientation Complete</span>
          <h2 className="onboarding-final-title">
            Now hit your KPI&apos;s and enjoy working at hell on earth.
          </h2>
          <button type="button" className="onboarding-final-btn" onClick={onFinish}>
            LET&apos;S GO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      {rect && (
        <div
          className="onboarding-spotlight"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}
      <div className="onboarding-card" style={computeCardStyle(rect)}>
        <span className="onboarding-step-count">{stepIndex + 1} / {STEPS.length}</span>
        <h3 className="onboarding-card-title">{step.title}</h3>
        <p className="onboarding-card-body">{step.body}</p>
        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip-btn" onClick={onFinish}>SKIP</button>
          <button type="button" className="onboarding-next-btn" onClick={() => setStepIndex((i) => i + 1)}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}
