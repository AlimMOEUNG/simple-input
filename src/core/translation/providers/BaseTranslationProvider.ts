/**
 * BaseTranslationProvider - Abstract base class for all translation providers
 *
 * Provides common functionality:
 * - Translation interface
 * - Initialization hook
 * - Cleanup hook
 * - Error handling
 */

export interface TranslationOptions {
  targetLanguage: string
  sourceLanguage?: string
}

export abstract class BaseTranslationProvider {
  /**
   * Provider name for identification
   */
  abstract readonly name: string

  /**
   * Whether this provider requires an API key
   */
  abstract readonly requiresApiKey: boolean

  /**
   * Initialize the provider (optional, for setup tasks)
   */
  async initialize(): Promise<void> {
    // Default: no initialization needed
  }

  /**
   * Translate text to target language
   *
   * @param text Text to translate
   * @param options Translation options (target language, optional source language)
   * @returns Translated text
   */
  abstract translateText(text: string, options: TranslationOptions): Promise<string>

  /**
   * Validate provider configuration (optional)
   * Used to check if API keys are valid, service is available, etc.
   *
   * @returns true if valid, error message if invalid
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    // Default: always valid
    return { valid: true }
  }

  /**
   * Clean up resources (optional)
   */
  destroy(): void {
    // Default: no cleanup needed
  }

  /**
   * Check if source and target languages are the same
   * Optimization: skip translation if languages match
   */
  protected isSameLanguage(sourceLanguage: string | undefined, targetLanguage: string): boolean {
    if (!sourceLanguage || sourceLanguage === 'auto') {
      return false
    }
    return sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()
  }

  /**
   * Validate text before translation
   * @returns true if text is valid for translation
   */
  protected isValidText(text: string): boolean {
    return text && text.trim().length > 0
  }

  /**
   * Wrap translation errors with provider context
   */
  protected handleError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[${this.name}] ${context}:`, error)
    throw new Error(`${this.name}: ${message}`)
  }
}
