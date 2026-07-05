// Drop matching files into /public/audio/ to make these real.
// Until then this just logs, so the hookup points are obvious.
const cache = new Map<string, HTMLAudioElement>();

export function playSound(file: string, volume = 0.5): void {
  console.log(`[AUDIO_PLAY: ${file}]`);
  try {
    let audio = cache.get(file);
    if (!audio) {
      audio = new Audio(`/audio/${file}`);
      cache.set(file, audio);
    }
    audio.currentTime = 0;
    audio.volume = volume;
    void audio.play().catch(() => {
      // No file on disk yet — that's fine, the console log above is enough for now.
    });
  } catch {
    // Audio not supported in this environment — ignore.
  }
}

const CLICK_SOUNDS = ['cherry_blue_click_1.mp3', 'cherry_blue_click_2.mp3', 'cherry_blue_click_3.mp3'];

export function playKeyClick(): void {
  const file = CLICK_SOUNDS[Math.floor(Math.random() * CLICK_SOUNDS.length)];
  playSound(file, 0.25);
}

export function playSendDing(): void {
  playSound('dot_matrix_ding.mp3', 0.5);
}

export function playCashRegister(): void {
  playSound('cash_register.mp3', 0.3);
}

export function playMilestoneFanfare(): void {
  playSound('milestone_fanfare.mp3', 0.6);
}
