import OpenAI from 'openai'

// Created on first use so a missing key fails only the AI call, not the build or page load.
let client: OpenAI | null = null
export function getOpenAI(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set')
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

// Default: GPT-6 Luna, OpenAI's low-cost model. Override with OPENAI_MODEL in Vercel.
export const MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Send one system + user message and return the text reply.
 * OpenAI caches repeated prompt prefixes automatically, so no cache flag is needed.
 */
export async function complete(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
    max_completion_tokens: maxTokens,
    reasoning_effort: 'low',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('Empty response from OpenAI')
  return text
}

export async function runAgent(systemPrompt: string, userMessage: string): Promise<string> {
  return complete(systemPrompt, userMessage, 16384)
}
