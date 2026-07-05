import type { IPlatform } from './IPlatform'
import { NullPlatform } from './NullPlatfrom'
import { PlaygamaPlatform } from './PlaygamaPlatfrom'

function createPlatform(): IPlatform {
  const env = import.meta.env.VITE_PLATFORM as string | undefined

  switch (env) {
    case 'playgama':
      return new PlaygamaPlatform()

    // ── Add future platforms here ──────────────────────────────
    // case 'mobile':
    //   return new MobilePlatform()
    // ──────────────────────────────────────────────────────────

    default:
      // Only use the Playgama bridge if it's actually present on the page.
      // Otherwise (local dev, preview, plain browser) fall back to the
      // no-op/localStorage platform instead of hanging for 5s waiting on
      // a bridge that will never show up.
      if (typeof window !== 'undefined' && (window as any).bridge) {
        console.log('[Platform] window.bridge found — using PlaygamaPlatform')
        return new PlaygamaPlatform()
      }
      console.log('[Platform] no window.bridge — using NullPlatform (localStorage only, no real leaderboards)')
      return new NullPlatform()
  }
}

export const platform: IPlatform = createPlatform()
export type { IPlatform }
