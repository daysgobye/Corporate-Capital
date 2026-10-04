import { describe, expect, test } from 'bun:test'

describe('test harness', () => {
  test('provides a DOM', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    document.body.appendChild(el)
    expect(el.textContent).toBe('hello')
    el.remove()
  })

  test('stubs static asset imports', async () => {
    const mod = await import('../src/assets/icons8-mute-48.png')
    expect(typeof mod.default).toBe('string')
  })
})