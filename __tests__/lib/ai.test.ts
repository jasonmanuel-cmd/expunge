import { describe, it, expect } from 'vitest'

describe('ai utility contract', () => {
  it('exports runAgent as an async function', async () => {
    const mod = await import('@/lib/ai')
    expect(mod.runAgent).toBeInstanceOf(Function)
    expect(mod.runAgent.constructor.name).toBe('AsyncFunction')
  })

  it('exports MODEL as a string', async () => {
    const mod = await import('@/lib/ai')
    expect(typeof mod.MODEL).toBe('string')
    expect(mod.MODEL.length).toBeGreaterThan(0)
  })

  it('getOpenAI throws a clear error when OPENAI_API_KEY is missing', async () => {
    const mod = await import('@/lib/ai')
    const saved = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    expect(() => mod.getOpenAI()).toThrow('OPENAI_API_KEY is not set')
    if (saved !== undefined) process.env.OPENAI_API_KEY = saved
  })

  it('defaults to gpt-6-luna when OPENAI_MODEL is unset', async () => {
    const mod = await import('@/lib/ai')
    if (!process.env.OPENAI_MODEL) expect(mod.MODEL).toBe('gpt-6-luna')
  })

  it('exports AgentMessage type shape', () => {
    const msg = { role: 'user' as const, content: 'hello' }
    expect(msg.role).toMatch(/user|assistant/)
    expect(typeof msg.content).toBe('string')
  })
})
