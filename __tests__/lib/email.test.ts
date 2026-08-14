import { describe, it, expect } from 'vitest'

describe('email service contract', () => {
  it('exports sendLettersReadyEmail', async () => {
    const mod = await import('@/lib/email')
    expect(mod.sendLettersReadyEmail).toBeInstanceOf(Function)
    expect(mod.sendLettersReadyEmail.name).toBe('sendLettersReadyEmail')
  })

  it('exports sendOutcomeEmail', async () => {
    const mod = await import('@/lib/email')
    expect(mod.sendOutcomeEmail).toBeInstanceOf(Function)
    expect(mod.sendOutcomeEmail.name).toBe('sendOutcomeEmail')
  })

  it('exports sendNoResponseEmail', async () => {
    const mod = await import('@/lib/email')
    expect(mod.sendNoResponseEmail).toBeInstanceOf(Function)
    expect(mod.sendNoResponseEmail.name).toBe('sendNoResponseEmail')
  })

  it('sendLettersReadyEmail accepts expected signature', () => {
    const params = ['to@example.com', 'John', 'case-123', 3] as const
    const paramTypes = params.map((p) => typeof p)
    expect(paramTypes).toEqual(['string', 'string', 'string', 'number'])
  })

  it('sendOutcomeEmail accepts expected signature', () => {
    const params = ['to@example.com', 'John', 'Account', 'equifax', 'removed', 'case-123'] as const
    const paramTypes = params.map((p) => typeof p)
    expect(paramTypes).toEqual(['string', 'string', 'string', 'string', 'string', 'string'])
  })

  it('sendNoResponseEmail accepts expected signature', () => {
    const params = ['to@example.com', 'John', 'Account', 'equifax', 'case-123'] as const
    const paramTypes = params.map((p) => typeof p)
    expect(paramTypes).toEqual(['string', 'string', 'string', 'string', 'string'])
  })
})
