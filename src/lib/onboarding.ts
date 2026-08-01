import { platform } from './platform'

const ONBOARDING_KEY = 'hct_onboarding_seen_v1'

export async function isOnboardingSeen(): Promise<boolean> {
  try {
    const stored = await platform.storageGet(ONBOARDING_KEY)
    return stored === '1'
  } catch {
    return false
  }
}

export function markOnboardingSeen(): void {
  platform.storageSet(ONBOARDING_KEY, '1').catch(() => { })
}
