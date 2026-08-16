// src/components/VisualsButton.tsx
import { useEffect, useState } from 'react';
import { isVisualsMuted, toggleVisualsMuted, subscribeVisualsMuted } from '../lib/visuals';
import flash from "../assets/icons8-flash-on-48.png"
import flashOff from "../assets/icons8-flash-off-48.png"
export default function VisualsButton() {
  const [muted, setMuted] = useState(isVisualsMuted());

  // Picks up the value once initVisualsMuted()'s platform.storageGet() resolves,
  // in case that lands after this button has already mounted.
  useEffect(() => subscribeVisualsMuted(setMuted), []);

  return (
    <button
      type="button"
      className="mute-btn visuals-mute-btn"
      onClick={() => toggleVisualsMuted()}
      aria-label={muted ? 'Enable visual effects' : 'Disable visual effects (particles, floaters, confetti)'}
      aria-pressed={muted}
      title={muted ? 'Visual effects: off' : 'Visual effects: on'}
    >

      <img
        src={muted ? flashOff : flash}
        alt={muted ? 'Effects Off' : 'Effects enabled'}
        width={24}
        height={24}
      />

    </button>
  );
}
