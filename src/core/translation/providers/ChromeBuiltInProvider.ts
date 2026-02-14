/**
 * ChromeBuiltInProvider - Chrome Built-in AI (Gemini Nano)
 *
 * Uses Chrome's built-in translation API (requires Chrome 143+)
 * - Completely local and private
 * - No API key needed
 * - Auto-downloads translation models on first use
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'

// Chrome Built-in AI Translation API (Chrome 143+, experimental)
interface ChromeTranslator {
  translate(text: string): Promise<string>
}

interface ChromeTranslatorOptions {
  targetLanguage: string
  sourceLanguage?: string
}

interface ChromeTranslationAPI {
  createTranslator(options: ChromeTranslatorOptions): Promise<ChromeTranslator>
  createDetector?(): Promise<unknown>
}

interface SelfWithTranslation {
  translation?: ChromeTranslationAPI
}

export class ChromeBuiltInProvider extends BaseTranslationProvider {
  readonly name = 'Chrome Built-in AI'
  readonly requiresApiKey = false

  private translator: ChromeTranslator | null = null
  private translatorKey: string | null = null

  /**
   * Check if Chrome AI Translation API is available
   */
  async initialize(): Promise<void> {
    try {
      const translationSelf = self as SelfWithTranslation
      if (translationSelf.translation && 'createTranslator' in translationSelf.translation) {
        console.log('[ChromeBuiltIn] Chrome Built-in AI available')
      } else {
        console.warn('[ChromeBuiltIn] Chrome Built-in AI not available')
      }

      if (translationSelf.translation && 'createDetector' in translationSelf.translation) {
        console.log('[ChromeBuiltIn] Language detector available')
      }
    } catch (error) {
      console.error('[ChromeBuiltIn] Failed to initialize:', error)
    }
  }

  /**
   * Translate text using Chrome Built-in AI
   */
  async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!this.isValidText(text)) {
      return text
    }

    const { targetLanguage, sourceLanguage } = options

    try {
      // Check if API is available
      const translationSelf = self as SelfWithTranslation
      if (!translationSelf.translation?.createTranslator) {
        throw new Error(
          'Chrome Built-in AI is not available. Please use Chrome 143+ or another provider.'
        )
      }

      const translationAPI = translationSelf.translation

      // Create translator for language pair
      const newTranslatorKey = `${sourceLanguage === 'auto' || !sourceLanguage ? 'auto' : sourceLanguage}-${targetLanguage}`

      // If we don't have a translator for this pair, create one
      if (!this.translator || this.translatorKey !== newTranslatorKey) {
        const translatorOptions: ChromeTranslatorOptions = { targetLanguage }
        if (sourceLanguage && sourceLanguage !== 'auto') {
          translatorOptions.sourceLanguage = sourceLanguage
        }

        this.translator = await translationAPI.createTranslator(translatorOptions)
        this.translatorKey = newTranslatorKey

        console.log(`[ChromeBuiltIn] Created translator: ${newTranslatorKey}`)
      }

      // Translate
      const result = await this.translator.translate(text)
      console.log(`[ChromeBuiltIn] Translation successful`)
      return result
    } catch (error: unknown) {
      // Check if it's a "not available" error
      const message = error instanceof Error ? error.message : ''
      if (message.includes('NotAllowedError') || message.includes('download')) {
        this.handleError(
          new Error(
            'Translation model needs to be downloaded. Please click on the page first, then try again.'
          ),
          'Translation failed'
        )
      }
      this.handleError(error, 'Translation failed')
    }
  }

  /**
   * Validate Chrome AI availability
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    if (!(self as SelfWithTranslation).translation?.createTranslator) {
      return {
        valid: false,
        error:
          'Chrome Built-in AI is not available. Please use Chrome 143+ with Gemini Nano enabled.',
      }
    }
    return { valid: true }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.translator = null
    this.translatorKey = null
  }
}
