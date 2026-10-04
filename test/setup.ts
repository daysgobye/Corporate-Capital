/**
 * Global setup for `bun test`, wired up via the `preload` key in bunfig.toml.
 *
 * Order matters twice over:
 *  1. the asset plugin registers first, so static-asset imports are stubbed
 *     before any test file is evaluated;
 *  2. happy-dom registers before Testing Library is imported, because Testing
 *     Library binds its `screen` queries to `document.body` at module-init
 *     time. Import it first and every later `screen.*` call throws.
 */
import { afterEach, beforeEach } from 'bun:test'

import './assetPlugin'

import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Gives component tests a real DOM. Bun has no built-in DOM, and the component
// tree touches document/window/localStorage on import (audio.ts builds an
// AudioContext lazily, onboarding.ts reads localStorage).
GlobalRegistrator.register({ url: 'https://localhost/' })

// React 19 requires this flag before it will run updates outside of a test
// framework's own act() wrapper, which is what @testing-library/react drives.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// happy-dom does not implement Web Audio, and audio.ts throws from getCtx()
// when neither AudioContext nor webkitAudioContext exists. Nothing in the test
// suite asserts on actual playback, so a no-op stub keeps modules importable.
if (!('AudioContext' in globalThis)) {
  class StubAudioContext {
    get currentTime() {
      return 0
    }
    get state() {
      return 'running' as const
    }
    get destination() {
      return {}
    }
    get sampleRate() {
      return 44100
    }
    resume() {
      return Promise.resolve()
    }
    suspend() {
      return Promise.resolve()
    }
    close() {
      return Promise.resolve()
    }
    createGain() {
      return {
        gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
      }
    }
    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
        onended: null,
      }
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(1) }
    }
    decodeAudioData() {
      return Promise.resolve({ getChannelData: () => new Float32Array(1) })
    }
  }

  ;(globalThis as unknown as { AudioContext: unknown }).AudioContext = StubAudioContext
}

// React 19's act() support reads this to decide whether to warn about updates
// escaping act(). happy-dom provides neither, so stub the pieces the library
// feature-detects on.
if (!('matchMedia' in globalThis)) {
  ;(globalThis as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })
}

if (!('ResizeObserver' in globalThis)) {
  class StubResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver
}
// Deferred until the DOM exists — see the import-order note at the top.
const { cleanup } = await import('@testing-library/react')

// Bun runs every test file in one process against one module registry, so the
// module-level flag state in audio.ts and visuals.ts leaks between files and
// makes results depend on execution order. Reset both before each test so a
// component that hides effects when visuals are muted cannot be flipped by an
// unrelated suite.
const { setMuted } = await import('../src/lib/audio')
const { setVisualsMuted } = await import('../src/lib/visuals')

beforeEach(() => {
  setMuted(false)
  setVisualsMuted(false)
})

// Unmount rendered trees between tests. Testing Library installs this itself
// when it detects a global afterEach, but relying on that detection lets a
// stray container leak into the next test and break every role/name query
// that follows — so drive it explicitly.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
