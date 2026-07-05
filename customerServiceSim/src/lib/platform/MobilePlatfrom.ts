import type { IPlatform, LeaderboardPlatformEntry } from './IPlatform'

export class MobilePlatform implements IPlatform {
  readonly language = (window as any).__NATIVE_LOCALE__?.split('-')[0]
    ?? navigator.language?.split('-')[0]
    ?? 'en'

  readonly isRewardedSupported = false

  // Mobile wrapper has no leaderboard backend wired up yet — fill this in
  // when you add one (Game Center / Play Games / your own backend, etc.)
  readonly leaderboardType: 'not_available' = 'not_available'

  async init(): Promise<void> {
    console.log('[Platform] MobilePlatform: init — fill in your SDK here')
  }

  gameReady(): void {
    console.log('[Platform] MobilePlatform: gameReady — fill in your SDK here')
  }

  async storageGet(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  async storageSet(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  }

  async showInterstitial(_placement?: string): Promise<void> {
    console.log('[Platform] MobilePlatform: showInterstitial (stub)')
  }

  async showRewarded(_placement?: string): Promise<boolean> {
    console.log('[Platform] MobilePlatform: showRewarded (stub) → false')
    return false
  }

  async setLeaderboardScore(_leaderboardId: string, _score: number): Promise<void> {
    console.log('[Platform] MobilePlatform: setLeaderboardScore (stub, no-op)')
  }

  async getLeaderboardEntries(_leaderboardId: string): Promise<LeaderboardPlatformEntry[]> {
    console.log('[Platform] MobilePlatform: getLeaderboardEntries (stub) → []')
    return []
  }

  async showLeaderboardPopup(_leaderboardId: string): Promise<void> {
    console.log('[Platform] MobilePlatform: showLeaderboardPopup (stub, no-op)')
  }
}
