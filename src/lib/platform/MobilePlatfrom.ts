import type { IPlatform, LeaderboardPlatformEntry } from './IPlatform'

export class MobilePlatform implements IPlatform {
  readonly language = (window as any).__NATIVE_LOCALE__?.split('-')[0]
    ?? navigator.language?.split('-')[0]
    ?? 'en'

  readonly isRewardedSupported = false
  readonly leaderboardType: 'not_available' = 'not_available'
  // No native mute/pause bridge wired up yet — wire these to your SDK's
  // real audio-focus / lifecycle-pause callbacks when you add one.
  readonly isAudioEnabled = true

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

  onAudioStateChanged(_cb: (enabled: boolean) => void): () => void {
    console.log('[Platform] MobilePlatform: onAudioStateChanged (stub, never fires)')
    return () => { }
  }

  onPauseStateChanged(_cb: (paused: boolean) => void): () => void {
    console.log('[Platform] MobilePlatform: onPauseStateChanged (stub, never fires)')
    return () => { }
  }
}
