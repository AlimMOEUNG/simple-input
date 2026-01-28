/**
 * TranslationEngine - Handles translation using different providers
 * Supports: Chrome Built-in AI, DeepL, Gemini
 */

import { SettingsManager } from '../storage/SettingsManager'

export class TranslationEngine {
  private builtinTranslator: any = null
  private builtinLanguageDetector: any = null

  constructor(private settings: SettingsManager) {}

  /**
   * Initialize translation engine (for built-in AI)
   */
  async initialize(): Promise<void> {
    const provider = this.settings.get('provider')

    if (provider === 'builtin') {
      try {
        // Check if Chrome AI Translation API is available
        if ('translation' in self && 'createTranslator' in (self as any).translation) {
          console.log('[TranslationEngine] Chrome Built-in AI available')
        } else {
          console.warn('[TranslationEngine] Chrome Built-in AI not available')
        }

        // Check language detector
        if ('translation' in self && 'createDetector' in (self as any).translation) {
          console.log('[TranslationEngine] Language detector available')
        }
      } catch (error) {
        console.error('[TranslationEngine] Failed to initialize built-in AI:', error)
      }
    }
  }

  /**
   * Translate text using the configured provider
   */
  async translateText(text: string, targetLang?: string): Promise<string> {
    const provider = this.settings.get('provider')
    const sourceLang = this.settings.get('sourceLang')
    const target = targetLang || this.settings.get('targetLang')

    console.log(`[TranslationEngine] Translating with ${provider}: "${text.substring(0, 50)}..."`)

    try {
      switch (provider) {
        case 'builtin':
          return await this.translateWithBuiltin(text, target, sourceLang)

        case 'deepl':
          return await this.translateWithDeepL(text, target, sourceLang)

        case 'gemini':
          return await this.translateWithGemini(text, target)

        default:
          throw new Error(`Unknown provider: ${provider}`)
      }
    } catch (error) {
      console.error('[TranslationEngine] Translation failed:', error)
      throw error
    }
  }

  /**
   * Translate using Chrome Built-in AI
   */
  private async translateWithBuiltin(
    text: string,
    targetLang: string,
    sourceLang: string
  ): Promise<string> {
    try {
      // Check if API is available
      if (!('translation' in self) || !(self as any).translation?.createTranslator) {
        throw new Error(
          'Chrome Built-in AI is not available. Please use Chrome 143+ or another provider.'
        )
      }

      const translationAPI = (self as any).translation

      // Create translator for language pair
      const translatorKey = `${sourceLang === 'auto' ? 'auto' : sourceLang}-${targetLang}`

      // If we don't have a translator for this pair, create one
      if (!this.builtinTranslator || this.builtinTranslator.key !== translatorKey) {
        const options: any = { targetLanguage: targetLang }
        if (sourceLang !== 'auto') {
          options.sourceLanguage = sourceLang
        }

        this.builtinTranslator = await translationAPI.createTranslator(options)
        this.builtinTranslator.key = translatorKey

        console.log(`[TranslationEngine] Created built-in translator: ${translatorKey}`)
      }

      // Translate
      const result = await this.builtinTranslator.translate(text)
      console.log(`[TranslationEngine] Built-in translation successful`)
      return result
    } catch (error: any) {
      // Check if it's a "not available" error
      if (error?.message?.includes('NotAllowedError') || error?.message?.includes('download')) {
        throw new Error(
          'Translation model needs to be downloaded. Please click on the page first, then try again.'
        )
      }
      throw error
    }
  }

  /**
   * Translate using DeepL API (via background script)
   */
  private async translateWithDeepL(
    text: string,
    targetLang: string,
    sourceLang: string
  ): Promise<string> {
    // Get API key from storage
    const { providerKeys } = await chrome.storage.local.get('providerKeys')
    const apiKey = providerKeys?.deeplApiKey

    if (!apiKey) {
      throw new Error('DeepL API key is required. Please configure it in the extension settings.')
    }

    // Send translation request to background script
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_DEEPL',
      text,
      targetLang,
      apiKey,
      sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
    })

    if (!response.success) {
      throw new Error(response.error || 'DeepL translation failed')
    }

    return response.data.translation
  }

  /**
   * Translate using Gemini API (via background script)
   */
  private async translateWithGemini(text: string, targetLang: string): Promise<string> {
    // Get API key from storage
    const { providerKeys } = await chrome.storage.local.get('providerKeys')
    const apiKey = providerKeys?.geminiApiKey

    if (!apiKey) {
      throw new Error('Gemini API key is required. Please configure it in the extension settings.')
    }

    // Send translation request to background script
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_GEMINI',
      text,
      targetLang,
      apiKey,
    })

    if (!response.success) {
      throw new Error(response.error || 'Gemini translation failed')
    }

    return response.data.translation
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.builtinTranslator = null
    this.builtinLanguageDetector = null
  }
}
