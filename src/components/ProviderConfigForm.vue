<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-1">
    <!-- Base URL input: shown only for Ollama and Custom providers -->
    <template v-if="showBaseUrl">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelBaseUrl') }}
      </label>
      <div class="flex gap-1">
        <input
          type="text"
          :value="config.baseUrl ?? ''"
          @input="emit('update:config', { baseUrl: ($event.target as HTMLInputElement).value })"
          :placeholder="t('placeholderBaseUrl')"
          class="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          @blur="isOllama ? fetchOllamaModels() : undefined"
        />
        <!-- Refresh button triggers dynamic model discovery for Ollama -->
        <button
          v-if="isOllama"
          @click="fetchOllamaModels"
          :disabled="!config.baseUrl || ollamaModelsLoading"
          class="px-2 py-1 text-xs rounded transition-colors"
          :class="
            !config.baseUrl || ollamaModelsLoading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          "
          title="Refresh available models"
        >
          {{ ollamaModelsLoading ? '...' : '↻' }}
        </button>
      </div>

      <!-- Ollama-only: model discovery status messages -->
      <template v-if="isOllama">
        <p v-if="ollamaModelsLoading" class="text-[10px] text-blue-600 dark:text-blue-400">
          ⏳ Fetching available models...
        </p>
        <p
          v-if="ollamaModelsError && !ollamaModelsLoading"
          class="text-[10px] text-red-600 dark:text-red-400"
        >
          ❌ {{ ollamaModelsError }}
        </p>
        <p
          v-if="ollamaModels.length > 0 && !ollamaModelsLoading"
          class="text-[10px] text-green-600 dark:text-green-400"
        >
          ✅ Found {{ ollamaModels.length }} local model(s)
        </p>
        <p
          v-if="!ollamaModelsLoading && !ollamaModelsError && ollamaModels.length === 0"
          class="text-[10px] text-gray-500 dark:text-gray-400"
        >
          💡 {{ t('ollamaHint') }}
        </p>
      </template>
    </template>

    <!-- API key input: required providers + Custom (optional) -->
    <template v-if="showApiKey">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ apiKeyLabel }}
      </label>
      <ApiKeyInput
        :modelValue="config.apiKey"
        :placeholder="provider === 'custom' ? t('placeholderOptional') : undefined"
        @update:modelValue="emit('update:config', { apiKey: $event })"
      />
    </template>

    <!-- Model selector: all LLM providers -->
    <template v-if="showModel">
      <label class="block text-[10px] font-semibold text-gray-700 dark:text-gray-300">
        {{ t('labelModel') }}
      </label>
      <LLMModelSelector
        :models="modelOptions"
        :modelValue="effectiveModelValue"
        :customModelValue="effectiveCustomModelValue"
        @update:modelValue="emit('update:config', { model: $event })"
        @update:customModelValue="handleCustomModelChange"
      />
    </template>

    <!-- Validation button + feedback message: only shown in global settings context -->
    <template v-if="validationStatus !== undefined">
      <ValidationButton
        :disabled="validateDisabled"
        :status="validationStatus"
        @validate="emit('validate')"
      />
      <ValidationMessage :message="validationMessage ?? ''" :status="validationStatus" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { getProviderByValue } from '@/config/providers'
import { PREDEFINED_MODELS, type ModelOption } from '@/config/predefinedModels'
import ApiKeyInput from './ApiKeyInput.vue'
import LLMModelSelector from './LLMModelSelector.vue'

const { t } = useI18nWrapper()

// Validation state type shared by button and message
type ValidationState = 'idle' | 'loading' | 'success' | 'error'

// Unified config shape covering all providers (fields are optional per provider)
export interface ProviderConfigShape {
  apiKey?: string
  baseUrl?: string
  model?: string
  customModel?: string
}

const props = withDefaults(defineProps<{
  /** Provider identifier (e.g. 'deepl', 'gemini', 'ollama', ...) */
  provider: string
  /** Current credential/model values for this provider */
  config: ProviderConfigShape
  /**
   * Validation outcome from parent.
   * When omitted, the validate button is not rendered (preset-level usage).
   */
  validationStatus?: ValidationState
  /** Validation feedback message from parent */
  validationMessage?: string
  /**
   * True once storage has finished loading — triggers Ollama auto-fetch.
   * Defaults to true for preset-level usage where config is immediately available.
   */
  configLoaded?: boolean
}>(), {
  configLoaded: true,
  validationMessage: '',
})

const emit = defineEmits<{
  /** Partial update to the provider config — parent merges into its store */
  'update:config': [partial: Partial<ProviderConfigShape>]
  /** User clicked the validate button */
  validate: []
}>()

// --- Display conditions ---

const isOllama = computed(() => props.provider === 'ollama')

// Show the base URL input only when the provider has a user-editable base URL
const showBaseUrl = computed(() => {
  const p = getProviderByValue(props.provider)
  return p?.hasEditableBaseUrl ?? false
})

// Show API key for providers that require it + Custom (optional key)
const showApiKey = computed(() => {
  const p = getProviderByValue(props.provider)
  return (p?.requiresApiKey ?? false) || props.provider === 'custom'
})

// Show model selector for all LLM providers
const showModel = computed(() => {
  const p = getProviderByValue(props.provider)
  return p?.isLLM ?? false
})

// --- API key label (provider-specific) ---

const apiKeyLabel = computed(() => {
  const labels: Record<string, string> = {
    deepl: t('apiKeyLabelDeepL'),
    gemini: t('apiKeyLabelGemini'),
    chatgpt: t('apiKeyLabelOpenAI'),
    groq: t('apiKeyLabelGroq'),
    openrouter: t('apiKeyLabelOpenRouter'),
    custom: t('labelApiKeyOptional'),
  }
  // Fallback for unknown providers (should not happen in practice)
  return labels[props.provider] ?? 'API Key'
})

// --- Validation button disabled condition ---

const validateDisabled = computed(() => {
  const { apiKey, baseUrl, model } = props.config
  // Ollama: needs a model selected (API key not required)
  if (props.provider === 'ollama') return !model
  // Custom: needs both a base URL and a model
  if (props.provider === 'custom') return !baseUrl || !model
  // All other providers: needs an API key
  return !apiKey
})

// --- Ollama dynamic model discovery ---

const ollamaModels = ref<Array<{ value: string; label: string }>>([])
const ollamaModelsLoading = ref(false)
const ollamaModelsError = ref('')

// When real models are fetched: dropdown with real models + custom entry.
// When none fetched: single "Custom Model" entry WITHOUT isCustom:true so that
// LLMModelSelector sees hasPredefinedModels=true and renders the dropdown instead
// of the bare text input — matching the pre-refactor behavior in ProviderTab.
const ollamaModelOptions = computed((): ModelOption[] => {
  if (ollamaModels.value.length > 0) {
    return [...ollamaModels.value, { value: 'custom', label: 'Custom Model', isCustom: true }]
  }
  return [{ value: 'custom', label: 'Custom Model' }]
})

/**
 * Fetch available models from a running Ollama instance.
 * On success, updates ollamaModels and resets the selection if the current
 * model is no longer in the list.
 */
async function fetchOllamaModels() {
  const baseUrl = props.config.baseUrl

  if (!baseUrl) {
    ollamaModelsError.value = 'Please configure Ollama Base URL first'
    return
  }

  ollamaModelsLoading.value = true
  ollamaModelsError.value = ''

  try {
    // Strip trailing /v1 — the tags endpoint is on the root URL
    const cleanUrl = baseUrl.replace(/\/v1\/?$/, '')
    const response = await chrome.runtime.sendMessage({
      type: 'PROXY_FETCH',
      url: `${cleanUrl}/api/tags`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.success && response.data?.models) {
      ollamaModels.value = response.data.models.map((model: { name: string }) => ({
        value: model.name,
        label: model.name,
      }))

      // Reset model selection if the stored value is no longer in the fetched list
      if (
        props.config.model &&
        props.config.model !== 'custom' &&
        !ollamaModels.value.some((m) => m.value === props.config.model)
      ) {
        emit('update:config', { model: ollamaModels.value[0]?.value || '' })
      }
    } else {
      ollamaModelsError.value = response.error || 'Failed to fetch models'
    }
  } catch (error) {
    ollamaModelsError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    ollamaModelsLoading.value = false
  }
}

// Auto-fetch when storage finishes loading and the provider is Ollama with a URL set.
// immediate: true ensures this also fires on mount for preset-level usage where
// configLoaded defaults to true and never transitions from false.
watch(
  () => props.configLoaded,
  (loaded) => {
    if (loaded && props.provider === 'ollama' && props.config.baseUrl) {
      fetchOllamaModels()
    }
  },
  { immediate: true }
)

// Auto-fetch when switching to the Ollama provider if a base URL is already configured.
// No immediate: true — mount case is already handled by the configLoaded watcher above.
watch(
  () => props.provider,
  (newProvider) => {
    if (newProvider === 'ollama' && props.config.baseUrl) {
      fetchOllamaModels()
    }
  }
)

// --- Model selector helpers ---

// Model list passed to LLMModelSelector
const modelOptions = computed(() => {
  if (props.provider === 'ollama') return ollamaModelOptions.value
  // Custom provider has no predefined list — LLMModelSelector shows free-text input directly
  if (props.provider === 'custom') return []
  const key = props.provider as keyof typeof PREDEFINED_MODELS
  return PREDEFINED_MODELS[key] ?? []
})

// For Custom provider, the free-text model is stored in config.model (not config.customModel)
const effectiveModelValue = computed(() =>
  props.provider === 'custom' ? '' : (props.config.model ?? '')
)
const effectiveCustomModelValue = computed(() =>
  props.provider === 'custom' ? (props.config.model ?? '') : (props.config.customModel ?? '')
)

/**
 * Handle LLMModelSelector's customModelValue changes.
 * For Custom provider, this maps to config.model; for others, to config.customModel.
 */
function handleCustomModelChange(val: string) {
  if (props.provider === 'custom') {
    emit('update:config', { model: val })
  } else {
    emit('update:config', { customModel: val })
  }
}

// --- Inline sub-components (validate UI) ---

// Shared validate button used across all providers
const ValidationButton = defineComponent({
  props: {
    disabled: { type: Boolean, default: false },
    status: { type: String as () => ValidationState, default: 'idle' },
  },
  emits: ['validate'],
  setup(props, { emit }) {
    const { t } = useI18nWrapper()
    return () => {
      const isDisabled = props.disabled || props.status === 'loading'
      return h(
        'button',
        {
          onClick: () => emit('validate'),
          disabled: isDisabled,
          class: [
            'w-full px-2 py-1.5 text-xs rounded transition-colors',
            isDisabled
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ],
        },
        props.status === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate')
      )
    }
  },
})

// Shared validation feedback message
const ValidationMessage = defineComponent({
  props: {
    message: { type: String, default: '' },
    status: { type: String as () => ValidationState, default: 'idle' },
  },
  setup(props) {
    return () => {
      if (!props.message) return null
      return h(
        'p',
        {
          class: ['text-[10px]', props.status === 'success' ? 'text-green-600' : 'text-red-600'],
        },
        props.message
      )
    }
  },
})
</script>
