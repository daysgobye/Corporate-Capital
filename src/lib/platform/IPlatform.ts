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

  /**
   * Whether the host platform currently allows game audio (tab muted by
   * the host, OS silent switch, etc). This is separate from — and must
   * take priority over — the player's own in-game mute preference: even
   * with sound on in-game, audio must stay silent while this is false.
   *
   * Per Playgama's docs: subscribing to onAudioStateChanged alone is NOT
   * enough — it only fires on *later* changes. Callers must read this
   * property once up front to catch whatever the host already decided.
   */
  readonly isAudioEnabled: boolean
  /** Subscribe to platform audio-enabled/disabled changes. Returns an unsubscribe function. */
  onAudioStateChanged(cb: (enabled: boolean) => void): () => void
  /**
   * Subscribe to platform pause/resume requests — fired when a system
   * overlay opens (ad, share sheet, OS app-switcher, etc), the host tab
   * goes hidden, or the platform otherwise needs gameplay to stop. The
   * game loop must stop entirely (no ticks) while paused. Returns an
   * unsubscribe function.
   */
  onPauseStateChanged(cb: (paused: boolean) => void): () => void
}
