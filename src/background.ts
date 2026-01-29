/**
 * Background script for simple input translator
 * Acts as API proxy for DeepL and Gemini to avoid CORS issues
 */

import { validateDeepLKey, translateWithDeepL } from './background/utils/deeplApi'
import { validateGeminiKey, translateWithGemini } from './background/utils/geminiApi'

// Message types for API proxy
type BackgroundMessage =
  | { type: 'VALIDATE_DEEPL_KEY'; apiKey: string }
  | { type: 'VALIDATE_GEMINI_KEY'; apiKey: string; model?: string }
  | {
      type: 'VALIDATE_OPENAI_COMPATIBLE'
      config: { providerType: string; baseUrl: string; apiKey?: string; model: string }
    }
  | {
      type: 'TRANSLATE_DEEPL'
      text: string
      targetLang: string
      apiKey: string
      sourceLang?: string
    }
  | { type: 'TRANSLATE_GEMINI'; text: string; targetLang: string; apiKey: string; model?: string }
  | { type: 'TRANSLATE_BUILTIN'; text: string; targetLang: string; sourceLang?: string }
  | {
      type: 'PROXY_FETCH'
      url: string
      method?: string
      headers?: Record<string, string>
      body?: string
    }

type BackgroundResponse = { success: true; data?: any } | { success: false; error: string }

console.log('[Background] Simple Input Translator initialized')

// Initialize default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed')
    chrome.storage.sync.set({
      settings: {
        sourceLang: 'auto',
        targetLang: 'en',
        provider: 'google', // Default to Google Translate (free, no API key)
        keyboardShortcut: 'Alt+T',
      },
      themeMode: 'auto',
      locale: 'en',
    })
  }
})

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Background] Received message:', message.type)

  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse({ success: false, error: error.message }))

  return true // Keep channel open for async response
})

/**
 * Generic PROXY_FETCH handler for CORS bypass
 * Allows content scripts to make cross-origin requests
 */
async function handleProxyFetch(message: {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
}): Promise<BackgroundResponse> {
  try {
    const response = await fetch(message.url, {
      method: message.method || 'GET',
      headers: message.headers || {},
      body: message.body,
    })

    // Parse response based on content type
    const contentType = response.headers.get('content-type')
    let data: any

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[Background] PROXY_FETCH error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Validate OpenAI-compatible API configuration
 */
async function validateOpenAICompatible(config: {
  providerType: string
  baseUrl: string
  apiKey?: string
  model: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure URL ends with /chat/completions
    let url = config.baseUrl
    if (!url.endsWith('/chat/completions')) {
      url = url.replace(/\/$/, '') + '/chat/completions'
    }

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add Authorization header if API key is provided (not needed for Ollama)
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    // Send a simple test request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Route message to appropriate handler
 */
async function handleMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  switch (message.type) {
    case 'VALIDATE_DEEPL_KEY': {
      const result = await validateDeepLKey(message.apiKey)
      return result.success
        ? { success: true, data: { endpoint: result.endpoint } }
        : { success: false, error: result.error || 'Validation failed' }
    }

    case 'VALIDATE_GEMINI_KEY': {
      const result = await validateGeminiKey(message.apiKey, message.model)
      return result.success
        ? { success: true }
        : { success: false, error: result.error || 'Validation failed' }
    }

    case 'VALIDATE_OPENAI_COMPATIBLE': {
      const result = await validateOpenAICompatible(message.config)
      return result.success
        ? { success: true }
        : { success: false, error: result.error || 'Validation failed' }
    }

    case 'TRANSLATE_DEEPL': {
      const result = await translateWithDeepL(
        message.text,
        message.targetLang,
        message.apiKey,
        message.sourceLang
      )
      return result.success
        ? {
            success: true,
            data: {
              translation: result.translation,
              detectedLang: result.detectedLang,
              sameLanguage: result.sameLanguage,
            },
          }
        : { success: false, error: result.error || 'Translation failed' }
    }

    case 'TRANSLATE_GEMINI': {
      const result = await translateWithGemini(
        message.text,
        message.targetLang,
        message.apiKey,
        message.model
      )
      return result.success
        ? {
            success: true,
            data: { translation: result.translation, sameLanguage: result.sameLanguage },
          }
        : { success: false, error: result.error || 'Translation failed' }
    }

    case 'PROXY_FETCH': {
      return await handleProxyFetch(message)
    }

    case 'TRANSLATE_BUILTIN': {
      // Built-in translation happens in content script (Chrome AI API)
      // This is just a placeholder for consistency
      return { success: false, error: 'Built-in translation should be handled in content script' }
    }

    default:
      return { success: false, error: 'Unknown message type' }
  }
}
