// src/components/MuteButton.tsx
import { useEffect, useState } from 'react';
import { isMuted, toggleMute, subscribeMuted } from '../lib/audio';

export default function MuteButton() {
  const [muted, setMuted] = useState(isMuted());

  // Picks up the value once initMuted()'s platform.storageGet() resolves,
  // in case that lands after this button has already mounted.
  useEffect(() => subscribeMuted(setMuted), []);

  return (
    <button
      type="button"
      className="mute-btn"
      onClick={() => toggleMute()}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={muted}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
