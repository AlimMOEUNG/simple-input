/**
 * Background script for simple input translator
 * Acts as API proxy for DeepL and Gemini to avoid CORS issues
 */

import { validateDeepLKey, translateWithDeepL } from './background/utils/deeplApi'
import { validateGeminiKey, translateWithGemini } from './background/utils/geminiApi'

// Message types for API proxy
type BackgroundMessage =
  | { type: 'VALIDATE_DEEPL_KEY'; apiKey: string }
  | { type: 'VALIDATE_GEMINI_KEY'; apiKey: string }
  | {
      type: 'TRANSLATE_DEEPL'
      text: string
      targetLang: string
      apiKey: string
      sourceLang?: string
    }
  | { type: 'TRANSLATE_GEMINI'; text: string; targetLang: string; apiKey: string }
  | { type: 'TRANSLATE_BUILTIN'; text: string; targetLang: string; sourceLang?: string }

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
        provider: 'builtin',
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
      const result = await validateGeminiKey(message.apiKey)
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
      const result = await translateWithGemini(message.text, message.targetLang, message.apiKey)
      return result.success
        ? {
            success: true,
            data: { translation: result.translation, sameLanguage: result.sameLanguage },
          }
        : { success: false, error: result.error || 'Translation failed' }
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
