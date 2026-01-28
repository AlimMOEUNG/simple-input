/**
 * DeepL API utilities for background script
 * Isolated from providers to prevent code splitting with content script
 */

/**
 * Convert ISO 639-1 code to DeepL language code
 */
export function convertToDeepLLangCode(isoCode: string): string {
  return isoCode.toUpperCase()
}

/**
 * Validate DeepL API key by testing Free and Pro endpoints
 */
export async function validateDeepLKey(
  apiKey: string
): Promise<{ success: boolean; endpoint?: 'free' | 'pro'; error?: string }> {
  if (!apiKey) {
    return { success: false, error: 'API key required' }
  }

  // Try Free API first
  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: 'Hello',
        target_lang: 'FR',
      }),
    })

    if (response.ok) {
      return { success: true, endpoint: 'free' }
    }
  } catch {
    console.log('[DeepL API] Free API failed, trying Pro...')
  }

  // Try Pro API
  try {
    const response = await fetch('https://api.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: 'Hello',
        target_lang: 'FR',
      }),
    })

    if (response.ok) {
      return { success: true, endpoint: 'pro' }
    } else {
      return { success: false, error: `Invalid API key: ${response.status}` }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

/**
 * Translate text using DeepL API (tries both Free and Pro endpoints)
 * @param text Text to translate
 * @param targetLang Target language code
 * @param apiKey DeepL API key
 * @param sourceLang Optional source language (bypasses DeepL auto-detection)
 */
export async function translateWithDeepL(
  text: string,
  targetLang: string,
  apiKey: string,
  _sourceLang?: string
): Promise<{
  success: boolean
  translation?: string
  detectedLang?: string
  sameLanguage?: boolean
  error?: string
}> {
  if (!apiKey) {
    return { success: false, error: 'API key required' }
  }

  const deeplLang = convertToDeepLLangCode(targetLang)

  // Try Free API first, fallback to Pro
  const endpoints = [
    'https://api-free.deepl.com/v2/translate',
    'https://api.deepl.com/v2/translate',
  ]

  let lastError: string | undefined

  for (const endpoint of endpoints) {
    try {
      // Build request params
      const params: Record<string, string> = {
        text,
        target_lang: deeplLang,
      }

      // // Add source_lang if provided (optional parameter)
      // if (sourceLang) {
      //   params.source_lang = convertToDeepLLangCode(sourceLang)
      // }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      })

      if (response.ok) {
        const data = await response.json()
        const translation = data.translations[0].text
        const detectedLang = data.translations[0].detected_source_language.toLowerCase()

        return {
          success: true,
          translation,
          detectedLang,
          sameLanguage: detectedLang === targetLang,
        }
      } else {
        // Inspect status code for specific errors
        if (response.status === 429) {
          lastError = 'DeepL quota exceeded. Character limit reached for this billing period.'
        } else if (response.status === 403 || response.status === 401) {
          lastError = 'DeepL API key is invalid. Please check your settings.'
        } else {
          lastError = `DeepL API error: ${response.status}`
        }
        // Continue to next endpoint
      }
    } catch (error) {
      console.log(`[DeepL API] ${endpoint} failed, trying next...`)
      lastError = error instanceof Error ? error.message : 'Network error'
    }
  }

  return {
    success: false,
    error: lastError || 'DeepL translation failed. Please check your connection.',
  }
}
