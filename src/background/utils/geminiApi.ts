/**
 * Gemini API utilities for background script
 * Isolated from providers to prevent code splitting with content script
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Validate Gemini API key
 */
export async function validateGeminiKey(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  if (!apiKey) {
    return { success: false, error: 'API key required' }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Simple test to validate the API key
    await model.generateContent('Test')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      // Check for common API key errors
      if (error.message.includes('API key') || error.message.includes('401')) {
        return { success: false, error: 'Invalid API key' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Network error' }
  }
}

/**
 * Translate text using Gemini API
 */
export async function translateWithGemini(
  text: string,
  targetLang: string,
  apiKey: string
): Promise<{ success: boolean; translation?: string; sameLanguage?: boolean; error?: string }> {
  if (!apiKey) {
    return { success: false, error: 'API key required' }
  }

  const prompt = `Translate the following text to ${targetLang}. If the text is already in ${targetLang}, return it unchanged. Return ONLY the translation or original text without any explanations, notes, or additional text.\n\nText: "${text}"`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const translation = response.text().trim()

    if (!translation) {
      return { success: false, error: 'Empty response from Gemini API' }
    }

    return {
      success: true,
      translation,
      sameLanguage: translation === text,
    }
  } catch (error) {
    if (error instanceof Error) {
      // Detect quota errors
      if (
        error.message.includes('429') ||
        error.message.includes('quota') ||
        error.message.includes('RESOURCE_EXHAUSTED')
      ) {
        return {
          success: false,
          error: 'Gemini API quota exceeded. Please check your credits at console.cloud.google.com',
        }
      }

      // Detect auth errors
      if (
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('API_KEY_INVALID')
      ) {
        return { success: false, error: 'Gemini API key is invalid. Please check your settings.' }
      }

      return { success: false, error: `Gemini API error: ${error.message}` }
    }
    return { success: false, error: 'Network error' }
  }
}
