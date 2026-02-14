/**
 * GoogleTranslateProvider - Google Translate web API
 *
 * Uses Google Translate web service (free, no API key)
 * - Free and works everywhere
 * - No API key required
 * - Auto-detects source language
 * - Good translation quality
 */

import { BaseTranslationProvider, TranslationOptions } from './BaseTranslationProvider'

export class GoogleTranslateProvider extends BaseTranslationProvider {
  readonly name = 'Google Translate'
  readonly requiresApiKey = false

  /**
   * Translate text using Google Translate web API
   */
  async translateText(text: string, options: TranslationOptions): Promise<string> {
    if (!this.isValidText(text)) {
      return text
    }

    const { targetLanguage, sourceLanguage } = options

    try {
      // Build Google Translate API URL
      const params = new URLSearchParams({
        client: 'gtx',
        sl: sourceLanguage === 'auto' || !sourceLanguage ? 'auto' : sourceLanguage,
        tl: targetLanguage,
        dt: 't',
        q: text,
      })

      const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`

      // Use background script for CORS bypass
      const response = await chrome.runtime.sendMessage({
        type: 'PROXY_FETCH',
        url,
        method: 'GET',
      })

      if (!response.success) {
        throw new Error(response.error || 'Translation failed')
      }

      // Parse Google Translate response
      // Response format: [[["translated text","original text",null,null,10]],null,"source_lang"]
      const data = response.data

      if (!Array.isArray(data) || !data[0] || !Array.isArray(data[0])) {
        throw new Error('Invalid response format from Google Translate')
      }

      // Extract translated text from first array element
      const translatedText = (data[0] as unknown[])
        .map((item) => (Array.isArray(item) ? (item[0] as string) : ''))
        .filter((item) => item)
        .join('')

      if (!translatedText) {
        throw new Error('No translation returned')
      }

      // Check if source and target languages are the same (same-language optimization)
      const detectedSourceLang = data[2]
      if (detectedSourceLang && detectedSourceLang.toLowerCase() === targetLanguage.toLowerCase()) {
        console.log('[GoogleTranslate] Same language detected, returning original text')
        return text
      }

      console.log('[GoogleTranslate] Translation successful')
      return translatedText
    } catch (error) {
      this.handleError(error, 'Translation failed')
    }
  }

  /**
   * Validate Google Translate availability (always available)
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    return { valid: true }
  }
}
