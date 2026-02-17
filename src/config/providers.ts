/**
 * Translation providers configuration
 * Centralized source of truth for all available translation providers and their base URLs
 */

/**
 * Single source of truth for all provider base URLs.
 * Import from here — never hardcode these strings anywhere else in the codebase.
 *
 * Gemini uses the OpenAI-compatible endpoint exclusively (v1beta, NOT v1).
 */
export const PROVIDER_BASE_URLS = {
  // OpenAI-compatible providers
  chatgpt: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  ollama: 'http://localhost:11434/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  // Gemini — OpenAI-compatible endpoint
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  // DeepL
  deeplFree: 'https://api-free.deepl.com/v2',
  deeplPro: 'https://api.deepl.com/v2',
} as const

export interface ProviderOption {
  value: string
  label: string
  isLLM: boolean // Whether this provider requires a model (LLM-based)
  requiresApiKey: boolean
  /** Whether the user must be able to edit the base URL in settings (Ollama, Custom) */
  hasEditableBaseUrl: boolean
  description?: string
}

/**
 * All available translation providers
 * This is the single source of truth used across the extension
 */
export const AVAILABLE_PROVIDERS: ProviderOption[] = [
  {
    value: 'google',
    label: 'Google Translate (Free)',
    isLLM: false,
    requiresApiKey: false,
    hasEditableBaseUrl: false,
    description: 'Free translation service via Google Translate',
  },
  {
    value: 'builtin',
    label: 'Chrome Built-in AI (Free)',
    isLLM: false,
    requiresApiKey: false,
    hasEditableBaseUrl: false,
    description: 'Chrome built-in translation AI (experimental)',
  },
  {
    value: 'deepl',
    label: 'DeepL API',
    isLLM: false,
    requiresApiKey: true,
    hasEditableBaseUrl: false,
    description: 'High-quality translation via DeepL API',
  },
  {
    value: 'gemini',
    label: 'Google Gemini API',
    isLLM: true,
    requiresApiKey: true,
    hasEditableBaseUrl: false,
    description: 'Google Gemini LLM for translation',
  },
  {
    value: 'chatgpt',
    label: 'ChatGPT (OpenAI)',
    isLLM: true,
    requiresApiKey: true,
    hasEditableBaseUrl: false,
    description: 'OpenAI GPT models for translation',
  },
  {
    value: 'groq',
    label: 'Groq (Free & Fast)',
    isLLM: true,
    requiresApiKey: true,
    hasEditableBaseUrl: false,
    description: 'Fast LLM inference via Groq',
  },
  {
    value: 'ollama',
    label: 'Ollama (Local)',
    isLLM: true,
    requiresApiKey: false,
    hasEditableBaseUrl: true, // User must configure the local instance URL
    description: 'Run local LLM models with Ollama',
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    isLLM: true,
    requiresApiKey: true,
    hasEditableBaseUrl: false,
    description: 'Access multiple LLMs via OpenRouter',
  },
  {
    value: 'custom',
    label: 'Custom OpenAI-compatible',
    isLLM: true,
    requiresApiKey: false, // Optional for custom endpoints
    hasEditableBaseUrl: true, // User must provide their own endpoint URL
    description: 'Custom OpenAI-compatible API endpoint',
  },
]

/**
 * Get a provider by its value
 */
export function getProviderByValue(value: string): ProviderOption | undefined {
  return AVAILABLE_PROVIDERS.find((p) => p.value === value)
}

/**
 * Check if a provider is an LLM provider (requires model selection)
 */
export function isLLMProvider(providerValue: string | undefined): boolean {
  if (!providerValue) return false
  const provider = getProviderByValue(providerValue)
  return provider?.isLLM ?? false
}

/**
 * Get all LLM providers (for llm-prompt presets and custom translation providers)
 */
export function getLLMProviders(): ProviderOption[] {
  return AVAILABLE_PROVIDERS.filter((p) => p.isLLM)
}

/**
 * Get all non-LLM providers (traditional translation services)
 */
export function getNonLLMProviders(): ProviderOption[] {
  return AVAILABLE_PROVIDERS.filter((p) => !p.isLLM)
}

/**
 * Get all providers that require API key configuration
 */
export function getProvidersRequiringApiKey(): ProviderOption[] {
  return AVAILABLE_PROVIDERS.filter((p) => p.requiresApiKey)
}

/**
 * Check if a provider requires an API key
 */
export function providerRequiresApiKey(providerValue: string | undefined): boolean {
  if (!providerValue) return false
  const provider = getProviderByValue(providerValue)
  return provider?.requiresApiKey ?? false
}

import { PREDEFINED_MODELS, getDefaultModel, type ModelOption } from './predefinedModels'

export interface ProviderConfig {
  requiresApiKey: boolean
  requiresBaseUrl: boolean
  defaultBaseUrl: string
  defaultModel: string
  /** Non-empty only for LLM providers that have a known model list */
  availableModels: ModelOption[]
}

/**
 * Returns runtime configuration metadata for a given provider value.
 * Used by TranslationPanel and LLMPromptPanel to determine which fields to show
 * (base URL input, API key input, model selector) and what defaults to use.
 */
export function getProviderConfig(provider: string): ProviderConfig {
  const providerOption = AVAILABLE_PROVIDERS.find((p) => p.value === provider)
  const isLLM = providerOption?.isLLM ?? false
  const requiresApiKey = providerOption?.requiresApiKey ?? false

  const config: ProviderConfig = {
    requiresApiKey,
    requiresBaseUrl: false,
    defaultBaseUrl: '',
    defaultModel: '',
    availableModels: [],
  }

  if (isLLM && provider !== 'custom') {
    const key = provider as keyof typeof PREDEFINED_MODELS
    config.availableModels = PREDEFINED_MODELS[key] || []
    config.defaultModel = getDefaultModel(key)
  }

  switch (provider) {
    case 'chatgpt':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = PROVIDER_BASE_URLS.chatgpt
      break
    case 'groq':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = PROVIDER_BASE_URLS.groq
      break
    case 'ollama':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = PROVIDER_BASE_URLS.ollama
      break
    case 'openrouter':
      config.requiresBaseUrl = true
      config.defaultBaseUrl = PROVIDER_BASE_URLS.openrouter
      break
    case 'custom':
      config.requiresBaseUrl = true
      break
  }

  return config
}
