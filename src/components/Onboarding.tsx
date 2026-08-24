import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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

// Fallback estimate used only for the very first paint, before we've
// measured the real card. Real placement is corrected in the layout
// effect below once the card's actual height is known.
const ESTIMATED_CARD_HEIGHT = 190;
const VIEWPORT_MARGIN = 16;

function computeCardStyle(rect: DOMRect | null): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(300, vw - 32);

  if (!rect) {
    return { top: '50%', left: '50%', width, transform: 'translate(-50%, -50%)' };
  }

  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  // Prefer whichever side actually has more room, instead of assuming
  // "below" just because the target starts near the top of the screen —
  // a tall target (like the whole management panel) can start near the
  // top AND still leave no usable space below it.
  const placeBelow = spaceBelow >= spaceAbove;
  const top = placeBelow
    ? Math.min(rect.bottom + 18, vh - ESTIMATED_CARD_HEIGHT - VIEWPORT_MARGIN)
    : Math.max(VIEWPORT_MARGIN, rect.top - ESTIMATED_CARD_HEIGHT - 18);

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - width - VIEWPORT_MARGIN));

  return { top: Math.max(VIEWPORT_MARGIN, top), left, width };
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
  const cardRef = useRef<HTMLDivElement | null>(null);

  const isFinalStep = stepIndex >= STEPS.length;
  const step = STEPS[stepIndex];

  const [cardStyle, setCardStyle] = useState<CSSProperties>(() => computeCardStyle(null));

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

  // Initial placement, based on the estimated card height.
  useEffect(() => {
    if (!active || isFinalStep) return;
    setCardStyle(computeCardStyle(rect));
  }, [active, isFinalStep, rect]);

  // Correction pass: once the card has actually rendered, measure its
  // real height (title/body length varies per step) and clamp `top` so
  // it can never run off the bottom (or top) of the viewport — this is
  // what was missing before, causing the last step's taller copy to spill
  // past the screen edge.
  useLayoutEffect(() => {
    if (!active || isFinalStep) return;
    const el = cardRef.current;
    if (!el) return;

    const vh = window.innerHeight;
    const height = el.getBoundingClientRect().height;
    const currentTop = typeof cardStyle.top === 'number' ? cardStyle.top : parseFloat(String(cardStyle.top));
    if (Number.isNaN(currentTop)) return;

    const maxTop = Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN);
    const clampedTop = Math.max(VIEWPORT_MARGIN, Math.min(currentTop, maxTop));

    if (Math.abs(clampedTop - currentTop) > 0.5) {
      setCardStyle((s) => ({ ...s, top: clampedTop }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isFinalStep, step, cardStyle.top, cardStyle.left, cardStyle.width]);

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
      <div className="onboarding-card" ref={cardRef} style={cardStyle}>
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
