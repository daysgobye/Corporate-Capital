import type { IPlatform } from './IPlatform'

declare global {
  interface Window {
    bridge: PlaygamaBridge
  }
}

interface LeaderboardEntry {
  id: string
  name: string
  photo: string
  score: number
  rank: number
}

interface PlaygamaBridge {
  initialize(): Promise<void>
  EVENT_NAME: {
    INTERSTITIAL_STATE_CHANGED: string
    REWARDED_STATE_CHANGED: string
    AUDIO_STATE_CHANGED: string
    PAUSE_STATE_CHANGED: string
  }
  platform: {
    language: string
    isAudioEnabled: boolean
    sendMessage(msg: string): void
    on(event: string, handler: (payload: boolean) => void): void
  }
  storage: {
    defaultType: string
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
  }
  advertisement: {
    isInterstitialSupported: boolean
    isRewardedSupported: boolean
    setMinimumDelayBetweenInterstitial(seconds: number): void
    showInterstitial(placement?: string): void
    showRewarded(placement?: string): void
    on(event: string, handler: (state: string) => void): void
  }
  leaderboards: {
    type: 'not_available' | 'in_game' | 'native' | 'native_popup'
    setScore(id: string, score: number): Promise<void>
    getEntries(id: string): Promise<LeaderboardEntry[]>
    showNativePopup(id: string): Promise<void>
  }
}
const debug = {
  flag: false,
  console: {
    log: (...args: any[]) => {
      if (debug.flag) {
        console.log(...args);
      }
    },

    warn: (...args: any[]) => {
      if (debug.flag) {
        console.warn(...args);
      }
    },
    error: (...args: any[]) => {
      if (debug.flag) {
        console.error(...args);
      }
    }

  }
};
export class PlaygamaPlatform implements IPlatform {
  private _bridge: PlaygamaBridge | null = null
  private _language = 'en'
  // Mirrors bridge.platform.isAudioEnabled — cached locally so the
  // isAudioEnabled getter stays synchronous and cheap. Seeded from the
  // bridge on init(), then kept current via the AUDIO_STATE_CHANGED
  // subscription below.
  private _audioEnabled = true

  get language() { return this._language }
  get isRewardedSupported() { return this._bridge?.advertisement.isRewardedSupported ?? false }
  get leaderboardType() { return this._bridge?.leaderboards.type ?? 'not_available' }
  get isAudioEnabled() { return this._audioEnabled }

  async init(): Promise<void> {
    await this._waitForBridge()
    this._bridge = window.bridge
    await this._bridge.initialize()
    this._language = this._bridge.platform.language ?? navigator.language?.split('-')[0] ?? 'en'
    this._bridge.advertisement.setMinimumDelayBetweenInterstitial(150)

    // Per Playgama's docs: the CURRENT value must be read up front — the
    // AUDIO_STATE_CHANGED event only fires on *subsequent* changes, so
    // relying on the subscription alone would miss whatever the host
    // already decided before we finished booting.
    this._audioEnabled = this._bridge.platform.isAudioEnabled ?? true
    this._bridge.platform.on(this._bridge.EVENT_NAME.AUDIO_STATE_CHANGED, (isEnabled: boolean) => {
      this._audioEnabled = isEnabled
      debug.console.log('[Platform] audio_state_changed →', isEnabled)
    })

    debug.console.log('[Platform] Playgama Bridge initialized, lang:', this._language, 'leaderboardType:', this.leaderboardType, 'rewardedSupported:', this.isRewardedSupported, 'audioEnabled:', this._audioEnabled)
  }

  gameReady(): void {
    debug.console.log('[Platform] gameReady')
    this._bridge?.platform.sendMessage('game_ready')
  }

  async storageGet(key: string): Promise<string | null> {
    if (!this._bridge) { console.warn('[Platform] storageGet called before bridge ready'); return null }
    try {
      const val = await this._bridge.storage.get(key)
      debug.console.log('[Platform] storage.get', key, '→', val)
      return val
    } catch (e) {
      debug.console.error('[Platform] storage.get failed', key, e)
      return null
    }
  }

  async storageSet(key: string, value: string): Promise<void> {
    if (!this._bridge) { console.warn('[Platform] storageSet called before bridge ready'); return }
    try {
      await this._bridge.storage.set(key, value)
      debug.console.log('[Platform] storage.set OK', key)
    } catch (e) {
      debug.console.error('[Platform] storage.set failed', key, e)
    }
  }

  showInterstitial(placement?: string): Promise<void> {
    return new Promise(resolve => {
      if (!this._bridge) { console.warn('[Platform] showInterstitial: no bridge'); resolve(); return }
      debug.console.log('[Platform] showInterstitial', placement)
      const onStateChange = (state: string) => {
        debug.console.log('[Platform] interstitial state:', state)
        if (state === 'closed' || state === 'failed') resolve()
      }
      this._bridge.advertisement.on(this._bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onStateChange)
      this._bridge.advertisement.showInterstitial(placement)
    })
  }

  showRewarded(placement?: string): Promise<boolean> {
    return new Promise(resolve => {
      if (!this._bridge) { console.warn('[Platform] showRewarded: no bridge'); resolve(false); return }
      debug.console.log('[Platform] showRewarded', placement)
      let rewarded = false
      const onStateChange = (state: string) => {
        debug.console.log('[Platform] rewarded state:', state)
        if (state === 'rewarded') rewarded = true
        else if (state === 'closed' || state === 'failed') resolve(rewarded)
      }
      this._bridge.advertisement.on(this._bridge.EVENT_NAME.REWARDED_STATE_CHANGED, onStateChange)
      this._bridge.advertisement.showRewarded(placement)
    })
  }

  async setLeaderboardScore(leaderboardId: string, score: number): Promise<void> {
    if (!this._bridge) { debug.console.warn('[Platform] setLeaderboardScore: no bridge', leaderboardId); return }
    try {
      await this._bridge.leaderboards.setScore(leaderboardId, score)
      debug.console.log('[Platform] leaderboard score set OK', leaderboardId, score)
    } catch (e) {
      debug.console.error('[Platform] leaderboard setScore failed', leaderboardId, score, e)
    }
  }

  async getLeaderboardEntries(leaderboardId: string): Promise<LeaderboardEntry[]> {
    if (!this._bridge || this._bridge.leaderboards.type !== 'in_game') {
      debug.console.log('[Platform] getLeaderboardEntries skipped, type =', this._bridge?.leaderboards.type)
      return []
    }
    try {
      const entries = await this._bridge.leaderboards.getEntries(leaderboardId)
      debug.console.log('[Platform] leaderboard entries', leaderboardId, entries)
      return entries
    } catch (e) {
      debug.console.error('[Platform] getLeaderboardEntries failed', leaderboardId, e)
      return []
    }
  }
  async showLeaderboardPopup(leaderboardId: string): Promise<void> {
    if (!this._bridge || this._bridge.leaderboards.type !== 'native_popup') return
    try { await this._bridge.leaderboards.showNativePopup(leaderboardId) } catch (e) { console.error('[Platform] showLeaderboardPopup failed', e) }
  }

  /**
   * NOTE: bridge doesn't expose an "off" for platform-level events, and
   * the handler is cheap and lives for the whole page's lifetime anyway
   * (there's only ever one PlaygamaPlatform instance) — the returned
   * unsubscribe is a no-op rather than pretending to remove the listener.
   */
  onAudioStateChanged(cb: (enabled: boolean) => void): () => void {
    if (!this._bridge) return () => { }
    this._bridge.platform.on(this._bridge.EVENT_NAME.AUDIO_STATE_CHANGED, cb)
    return () => { }
  }

  onPauseStateChanged(cb: (paused: boolean) => void): () => void {
    if (!this._bridge) return () => { }
    this._bridge.platform.on(this._bridge.EVENT_NAME.PAUSE_STATE_CHANGED, cb)
    return () => { }
  }

  private _waitForBridge(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.bridge) { resolve(); return }
      const interval = setInterval(() => {
        if (window.bridge) { clearInterval(interval); clearTimeout(timeout); resolve() }
      }, 50)
      const timeout = setTimeout(() => {
        clearInterval(interval)
        debug.console.error('[Platform] Playgama Bridge not found after 5s')
        reject(new Error('[Platform] Playgama Bridge not found after 5s'))
      }, timeoutMs)
    })
  }
  async setLeaderboardScore_unused() { } // (placeholder removed below)

}
