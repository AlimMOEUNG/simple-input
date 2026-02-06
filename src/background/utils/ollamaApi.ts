/**
 * Ollama API utilities
 * Fetch available models from Ollama instance
 */

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest?: string
}

export interface OllamaTagsResponse {
  models: OllamaModel[]
}

/**
 * Fetch available models from Ollama instance
 * @param baseUrl - Ollama base URL (e.g., http://localhost:11434)
 * @returns List of available models or null on error
 */
export async function fetchOllamaModels(
  baseUrl: string
): Promise<{ success: true; models: OllamaModel[] } | { success: false; error: string }> {
  try {
    // Ensure URL doesn't end with /v1 (tags endpoint is on base URL)
    const cleanUrl = baseUrl.replace(/\/v1\/?$/, '')
    const url = `${cleanUrl}/api/tags`

    console.log('[Ollama] Fetching models from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data: OllamaTagsResponse = await response.json()

    if (!data.models || !Array.isArray(data.models)) {
      return {
        success: false,
        error: 'Invalid response format from Ollama API',
      }
    }

    console.log('[Ollama] Fetched models:', data.models.map((m) => m.name))

    return {
      success: true,
      models: data.models,
    }
  } catch (error) {
    console.error('[Ollama] Failed to fetch models:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
