/**
 * === Build-time ad flag ===
 *
 * Rewarded ads (`platform.showRewarded`) only actually work on platforms
 * that provide a real ad bridge — currently Playgama. On builds where
 * there's no ad SDK at all (e.g. the itch.io build, which runs on
 * NullPlatform), `platform.showRewarded()` just resolves to `false` and the
 * "WATCH AD" / AFK-double-bonus buttons look broken because nothing ever
 * plays and nothing is ever granted.
 *
 * Flip this single flag per build target instead of touching any game logic:
 *
 *   - itch.io build (no ad SDK):        FORCE_ADS_UNLOCKED = true
 *   - Playgama build (real ad SDK):     FORCE_ADS_UNLOCKED = false
 *
 * When true, every place that would otherwise call platform.showRewarded()
 * instead behaves as if the player already has `adsUnlocked` — the reward
 * is granted instantly with no ad and buttons say "COLLECT" instead of
 * "WATCH AD".
 */
export const FORCE_ADS_UNLOCKED = true;

/** Use this instead of reading `state.adsUnlocked` directly anywhere ad-gating matters. */
export function adsEffectivelyUnlocked(adsUnlocked: boolean): boolean {
  return FORCE_ADS_UNLOCKED || adsUnlocked;
}
