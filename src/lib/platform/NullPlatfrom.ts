import type { IPlatform, LeaderboardPlatformEntry } from './IPlatform'

export class NullPlatform implements IPlatform {
  readonly language = navigator.language?.split('-')[0] ?? 'en'
  readonly isRewardedSupported = false
  readonly leaderboardType: 'not_available' = 'not_available'

  async init(): Promise<void> { console.log('[Platform] NullPlatform: init') }
  gameReady(): void { console.log('[Platform] NullPlatform: gameReady') }
  async storageGet(key: string): Promise<string | null> {
    try { return localStorage.getItem(key) } catch { return null }
  }
  async storageSet(key: string, value: string): Promise<void> {
    try { localStorage.setItem(key, value) } catch { }
  }
  async showInterstitial(_p?: string): Promise<void> { }
  async showRewarded(_p?: string): Promise<boolean> { return false }
  async setLeaderboardScore(_id: string, _score: number): Promise<void> { }
  async getLeaderboardEntries(_id: string): Promise<LeaderboardPlatformEntry[]> { return [] }
  async showLeaderboardPopup(_id: string): Promise<void> { }
}
