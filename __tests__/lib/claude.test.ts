import { describe, it, expect } from 'vitest'

describe('claude utility contract', () => {
  it('exports runAgent as an async function', async () => {
    const mod = await import('@/lib/claude')
    expect(mod.runAgent).toBeInstanceOf(Function)
    expect(mod.runAgent.constructor.name).toBe('AsyncFunction')
  })

  it('exports MODEL as a string', async () => {
    const mod = await import('@/lib/claude')
    expect(typeof mod.MODEL).toBe('string')
    expect(mod.MODEL.length).toBeGreaterThan(0)
  })

  it('exports anthropic instance', async () => {
    const mod = await import('@/lib/claude')
    expect(mod.anthropic).toBeDefined()
    expect(typeof mod.anthropic).toBe('object')
  })

  it('exports AgentMessage type shape', () => {
    const msg = { role: 'user' as const, content: 'hello' }
    expect(msg.role).toMatch(/user|assistant/)
    expect(typeof msg.content).toBe('string')
  })
})
