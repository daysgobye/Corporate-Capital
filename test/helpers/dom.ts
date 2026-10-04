/** Small typed DOM assertions, so component tests read cleanly without
 *  pulling in a jest-dom matcher pack Bun has no built-in home for. */

export function isDisabled(element: Element | null): boolean {
  return (element as HTMLButtonElement | null)?.disabled === true
}

export function isEnabled(element: Element | null): boolean {
  return !isDisabled(element)
}

export function classNamesOf(element: Element | null): string[] {
  return Array.from((element?.className ?? '').split(/\s+/)).filter(Boolean)
}