export interface LeaderboardPlatformEntry {
  id: string
  name: string
  photo: string
  score: number
  rank: number
}

export interface IPlatform {
  init(): Promise<void>
  gameReady(): void
  /**
   * Returns the stored value for `key`.
   * NOTE: despite the `string | null` signature, some underlying bridges
   * (observed on Playgama) return an already-parsed object instead of a
   * raw JSON string. Consumers (see storage.ts) must not assume the
   * result is always a string and should defensively check `typeof`
   * before calling JSON.parse on it.
   */
  storageGet(key: string): Promise<string | null>
  storageSet(key: string, value: string): Promise<void>
  showInterstitial(placement?: string): Promise<void>
  showRewarded(placement?: string): Promise<boolean>
  readonly language: string
  readonly isRewardedSupported: boolean
  readonly leaderboardType: 'not_available' | 'in_game' | 'native' | 'native_popup'
  setLeaderboardScore(leaderboardId: string, score: number): Promise<void>
  getLeaderboardEntries(leaderboardId: string): Promise<LeaderboardPlatformEntry[]>
  showLeaderboardPopup(leaderboardId: string): Promise<void>
}
