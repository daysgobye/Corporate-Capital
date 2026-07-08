import { useState } from 'react';
import { isMuted, toggleMute } from '../lib/audio';

export default function MuteButton() {
  const [muted, setMuted] = useState(isMuted());

  return (
    <button
      type="button"
      className="mute-btn"
      onClick={() => setMuted(toggleMute())}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={muted}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
