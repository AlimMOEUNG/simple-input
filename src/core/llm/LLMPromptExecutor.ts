import type { LLMProvider, ProviderKeys } from '@/types/common'

const SYSTEM_PROMPT =
  'You are a text processor. Respond ONLY with the processed output. ' +
  'No explanations, no additional text, no markdown formatting.'

// Gemini exposes an OpenAI-compatible endpoint at this base URL
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai'

interface ResolvedConfig {
  baseUrl: string
  apiKey: string | null
}

/**
 * Read the provider configuration from chrome.storage.local and derive
 * the endpoint base URL and API key for the requested LLM provider.
 */
async function resolveConfig(provider: LLMProvider): Promise<ResolvedConfig> {
  const { providerKeys } = await chrome.storage.local.get('providerKeys')
  const keys = (providerKeys ?? {}) as ProviderKeys

  switch (provider) {
    case 'gemini':
      return { baseUrl: GEMINI_BASE_URL, apiKey: keys.geminiConfig?.apiKey ?? null }
    case 'chatgpt':
      return {
        baseUrl: keys.chatgptConfig?.baseUrl ?? 'https://api.openai.com/v1',
        apiKey: keys.chatgptConfig?.apiKey ?? null,
      }
    case 'groq':
      return {
        baseUrl: keys.groqConfig?.baseUrl ?? 'https://api.groq.com/openai/v1',
        apiKey: keys.groqConfig?.apiKey ?? null,
      }
    case 'ollama':
      return {
        baseUrl: keys.ollamaConfig?.baseUrl ?? 'http://localhost:11434/v1',
        apiKey: null,
      }
    case 'openrouter':
      return {
        baseUrl: keys.openrouterConfig?.baseUrl ?? 'https://openrouter.ai/api/v1',
        apiKey: keys.openrouterConfig?.apiKey ?? null,
      }
    case 'custom':
      return {
        baseUrl: keys.customConfig?.baseUrl ?? '',
        apiKey: keys.customConfig?.apiKey ?? null,
      }
  }
}

export class LLMPromptExecutor {
  /**
   * Execute a prompt template against the specified LLM provider.
   * Routes the HTTP request through the background service worker (PROXY_FETCH)
   * to bypass CORS restrictions from content scripts.
   *
   * @param prompt   - Template containing the {{input}} placeholder
   * @param input    - The text that replaces {{input}}
   * @param provider - LLM provider identifier
   * @param model    - Resolved model name (never the literal 'custom')
   * @returns The content string extracted from the LLM response
   */
  static async execute(
    prompt: string,
    input: string,
    provider: LLMProvider,
    model: string
  ): Promise<string> {
    const config = await resolveConfig(provider)

    if (!config.baseUrl) {
      throw new Error(`No base URL configured for provider "${provider}"`)
    }

    const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const userMessage = prompt.replace(/\{\{input\}\}/g, input)

    // Route through background service worker for CORS bypass
    const response = await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!response.success) {
      throw new Error(response.error || 'LLM request failed')
    }

    const content = response.data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw new Error('Unexpected response format from LLM')
    }

    return content
  }
}
