<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="w-full max-w-[400px] min-w-[360px] h-auto flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <h1 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {{ t('appTitle') }}
      </h1>

      <div class="flex items-center gap-2">
        <!-- Language Selector -->
        <select
          v-model="uiLocale"
          class="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option v-for="option in availableLanguages" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <!-- Theme Toggle -->
        <button
          @click="cycleTheme"
          class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :title="t('themeToggle')"
        >
          <component :is="themeIcon" :size="16" />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col p-3 space-y-2.5">
      <!-- Provider (GLOBAL) -->
      <div>
        <label class="block text-xs font-medium mb-1">{{ t('providerLabel') }}</label>
        <select
          v-model="presetsSettings.provider"
          @change="onProviderChange"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="google">Google Translate (Free)</option>
          <option value="builtin">Chrome Built-in AI (Free)</option>
          <option value="deepl">DeepL API</option>
          <option value="gemini">Google Gemini API</option>
          <option value="chatgpt">ChatGPT (OpenAI)</option>
          <option value="groq">Groq (Free & Fast)</option>
          <option value="ollama">Ollama (Local)</option>
          <option value="openrouter">OpenRouter</option>
          <option value="custom">Custom OpenAI-compatible</option>
        </select>
      </div>

      <!-- DeepL API Key -->
      <div v-if="presetsSettings.provider === 'deepl'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('apiKeyLabelDeepL') }}</label>
        <input
          type="password"
          v-model="providerConfigs.deepl.apiKey"
          :placeholder="t('apiKeyPlaceholder')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('deepl')"
          :disabled="!providerConfigs.deepl.apiKey || validationStatus.deepl === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.deepl.apiKey || validationStatus.deepl === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.deepl === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
        </button>
        <p
          v-if="validationMessage.deepl"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.deepl === 'success',
            'text-red-600': validationStatus.deepl === 'error',
          }"
        >
          {{ validationMessage.deepl }}
        </p>
      </div>

      <!-- Gemini Configuration -->
      <div v-if="presetsSettings.provider === 'gemini'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('apiKeyLabelGemini') }}</label>
        <input
          type="password"
          v-model="providerConfigs.gemini.apiKey"
          :placeholder="t('apiKeyPlaceholder')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelModel') }}</label>
        <input
          type="text"
          v-model="providerConfigs.gemini.model"
          placeholder="gemini-1.5-flash"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('gemini')"
          :disabled="!providerConfigs.gemini.apiKey || validationStatus.gemini === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.gemini.apiKey || validationStatus.gemini === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.gemini === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
        </button>
        <p
          v-if="validationMessage.gemini"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.gemini === 'success',
            'text-red-600': validationStatus.gemini === 'error',
          }"
        >
          {{ validationMessage.gemini }}
        </p>
      </div>

      <!-- ChatGPT Configuration -->
      <div v-if="presetsSettings.provider === 'chatgpt'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('apiKeyLabelOpenAI') }}</label>
        <input
          type="password"
          v-model="providerConfigs.chatgpt.apiKey"
          :placeholder="t('apiKeyPlaceholder')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelModel') }}</label>
        <input
          type="text"
          v-model="providerConfigs.chatgpt.model"
          placeholder="gpt-4o-mini"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('chatgpt')"
          :disabled="!providerConfigs.chatgpt.apiKey || validationStatus.chatgpt === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.chatgpt.apiKey || validationStatus.chatgpt === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.chatgpt === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
        </button>
        <p
          v-if="validationMessage.chatgpt"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.chatgpt === 'success',
            'text-red-600': validationStatus.chatgpt === 'error',
          }"
        >
          {{ validationMessage.chatgpt }}
        </p>
      </div>

      <!-- Groq Configuration -->
      <div v-if="presetsSettings.provider === 'groq'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('apiKeyLabelGroq') }}</label>
        <input
          type="password"
          v-model="providerConfigs.groq.apiKey"
          :placeholder="t('apiKeyPlaceholder')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelModel') }}</label>
        <input
          type="text"
          v-model="providerConfigs.groq.model"
          placeholder="llama-3.3-70b-versatile"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('groq')"
          :disabled="!providerConfigs.groq.apiKey || validationStatus.groq === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.groq.apiKey || validationStatus.groq === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.groq === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
        </button>
        <p
          v-if="validationMessage.groq"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.groq === 'success',
            'text-red-600': validationStatus.groq === 'error',
          }"
        >
          {{ validationMessage.groq }}
        </p>
      </div>

      <!-- Ollama Configuration -->
      <div v-if="presetsSettings.provider === 'ollama'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('labelBaseUrl') }}</label>
        <input
          type="text"
          v-model="providerConfigs.ollama.baseUrl"
          :placeholder="t('placeholderBaseUrl')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelModel') }}</label>
        <input
          type="text"
          v-model="providerConfigs.ollama.model"
          placeholder="llama3.2"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('ollama')"
          :disabled="!providerConfigs.ollama.model || validationStatus.ollama === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.ollama.model || validationStatus.ollama === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.ollama === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
        </button>
        <p
          v-if="validationMessage.ollama"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.ollama === 'success',
            'text-red-600': validationStatus.ollama === 'error',
          }"
        >
          {{ validationMessage.ollama }}
        </p>
      </div>

      <!-- OpenRouter Configuration -->
      <div v-if="presetsSettings.provider === 'openrouter'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('apiKeyLabelOpenRouter') }}</label>
        <input
          type="password"
          v-model="providerConfigs.openrouter.apiKey"
          :placeholder="t('apiKeyPlaceholder')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelModel') }}</label>
        <input
          type="text"
          v-model="providerConfigs.openrouter.model"
          placeholder="meta-llama/llama-3.3-70b-instruct"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('openrouter')"
          :disabled="
            !providerConfigs.openrouter.apiKey || validationStatus.openrouter === 'loading'
          "
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.openrouter.apiKey || validationStatus.openrouter === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{
            validationStatus.openrouter === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate')
          }}
        </button>
        <p
          v-if="validationMessage.openrouter"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.openrouter === 'success',
            'text-red-600': validationStatus.openrouter === 'error',
          }"
        >
          {{ validationMessage.openrouter }}
        </p>
      </div>

      <!-- Custom OpenAI-compatible Configuration -->
      <div v-if="presetsSettings.provider === 'custom'" class="space-y-1.5">
        <label class="block text-xs font-medium">{{ t('labelBaseUrl') }}</label>
        <input
          type="text"
          v-model="providerConfigs.custom.baseUrl"
          :placeholder="t('placeholderBaseUrl')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelApiKeyOptional') }}</label>
        <input
          type="password"
          v-model="providerConfigs.custom.apiKey"
          :placeholder="t('placeholderOptional')"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">{{ t('labelModel') }}</label>
        <input
          type="text"
          v-model="providerConfigs.custom.model"
          placeholder="model-name"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('custom')"
          :disabled="
            !providerConfigs.custom.baseUrl ||
            !providerConfigs.custom.model ||
            validationStatus.custom === 'loading'
          "
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.custom.baseUrl ||
            !providerConfigs.custom.model ||
            validationStatus.custom === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.custom === 'loading' ? t('apiKeyValidating') : t('apiKeyValidate') }}
        </button>
        <p
          v-if="validationMessage.custom"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.custom === 'success',
            'text-red-600': validationStatus.custom === 'error',
          }"
        >
          {{ validationMessage.custom }}
        </p>
      </div>

      <!-- Presets Section -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
        <PresetTabs
          :presets="presetsSettings.presets"
          :active-preset-id="presetsSettings.activePresetId"
          @select-preset="selectPreset"
          @add-preset="addPreset"
        />

        <PresetEditor
          v-if="activePreset"
          :preset="activePreset"
          :all-presets="presetsSettings.presets"
          :can-delete="presetsSettings.presets.length > 1"
          @update-preset="updatePreset"
          @delete-preset="deletePreset"
        />
      </div>

      <!-- Usage Instructions -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
        <p class="text-[10px] text-gray-600 dark:text-gray-400 font-medium mb-1">
          {{ t('howToUse') }}
        </p>
        <div class="space-y-0.5">
          <div
            v-for="preset in presetsSettings.presets"
            :key="preset.id"
            class="text-[10px] text-gray-600 dark:text-gray-400"
          >
            <strong>{{ preset.name }}:</strong> {{ preset.keyboardShortcut }}
            <span class="text-gray-500 dark:text-gray-500">
              ({{ preset.sourceLang }} → {{ preset.targetLang }})
            </span>
          </div>
        </div>
        <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
          {{ t('usageWorks') }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <p class="text-[10px] text-center text-gray-500 dark:text-gray-400">
        {{ t('footerText') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useThemeMode } from '@/composables/useThemeMode'
import { useSettings } from '@/composables/useSettings'
import { usePresetsSettings } from '@/composables/usePresetsSettings'
import type { SupportedLocale } from '@/core/utils/i18n'
import type { TranslationPreset } from '@/types/common'
import PresetTabs from '@/components/PresetTabs.vue'
import PresetEditor from '@/components/PresetEditor.vue'

// i18n setup
const { t, locale, setLocale } = useI18nWrapper()

// Theme management
const { themeMode, cycleTheme } = useThemeMode()

// Presets settings management
const {
  presetsSettings,
  addPreset: addPresetHelper,
  updatePreset: updatePresetHelper,
  deletePreset: deletePresetHelper,
  setActivePreset,
  getActivePreset,
  isLoading: _isLoadingPresets,
} = usePresetsSettings()

// Provider configs (still uses old useSettings for provider keys)
const { providerConfigs } = useSettings()

// Language selector
const availableLanguages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

const uiLocale = computed<SupportedLocale>({
  get: () => locale.value,
  set: (value) => {
    setLocale(value)
  },
})

// Theme icon computed
const themeIcon = computed(() => {
  switch (themeMode.value) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    default:
      return Monitor
  }
})

// Validation status
const validationStatus = ref({
  deepl: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  gemini: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  chatgpt: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  groq: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  ollama: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  openrouter: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  custom: 'idle' as 'idle' | 'loading' | 'success' | 'error',
})

const validationMessage = ref({
  deepl: '',
  gemini: '',
  chatgpt: '',
  groq: '',
  ollama: '',
  openrouter: '',
  custom: '',
})

// Get active preset
const activePreset = computed(() => {
  return getActivePreset()
})

// Preset management functions
function selectPreset(id: string) {
  setActivePreset(id)
}

function addPreset() {
  addPresetHelper()
}

function updatePreset(updatedPreset: TranslationPreset) {
  updatePresetHelper(updatedPreset)
}

function deletePreset(id: string) {
  if (presetsSettings.value.presets.length <= 1) {
    alert(t('cannotDeleteLastPreset'))
    return
  }
  deletePresetHelper(id)
}

// Load settings on mount
onMounted(() => {
  // Settings are automatically loaded by useStorageState
  // Check if current provider configuration is complete
  checkProviderConfiguration()
})

async function validateProviderConfig(provider: string) {
  // Reset validation state
  validationStatus.value[provider as keyof typeof validationStatus.value] = 'loading'
  validationMessage.value[provider as keyof typeof validationMessage.value] = ''

  try {
    let response

    switch (provider) {
      case 'deepl':
        if (!providerConfigs.value.deepl.apiKey) return
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_DEEPL_KEY',
          apiKey: providerConfigs.value.deepl.apiKey,
        })
        break

      case 'gemini':
        if (!providerConfigs.value.gemini.apiKey) return
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_GEMINI_KEY',
          apiKey: providerConfigs.value.gemini.apiKey,
          model: providerConfigs.value.gemini.model,
        })
        break

      case 'chatgpt':
      case 'groq':
      case 'ollama':
      case 'openrouter':
      case 'custom':
        const config = providerConfigs.value[provider as keyof typeof providerConfigs.value]
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_OPENAI_COMPATIBLE',
          config: {
            providerType: provider,
            ...config,
          },
        })
        break

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    if (response.success) {
      validationStatus.value[provider as keyof typeof validationStatus.value] = 'success'
      validationMessage.value[provider as keyof typeof validationMessage.value] =
        `✓ ${t('validationSuccess')}`
      // Configuration is automatically saved by useStorageState
    } else {
      validationStatus.value[provider as keyof typeof validationStatus.value] = 'error'
      validationMessage.value[provider as keyof typeof validationMessage.value] =
        `✗ ${response.error}`
    }
  } catch {
    validationStatus.value[provider as keyof typeof validationStatus.value] = 'error'
    validationMessage.value[provider as keyof typeof validationMessage.value] =
      `✗ ${t('validationFailed')}`
  }
}

function onProviderChange() {
  // Settings are automatically saved by useStorageState
  // Check if the selected provider has the required configuration
  checkProviderConfiguration()
}

/**
 * Check if the current provider has the required configuration
 * Display an alert if API key or required fields are missing
 */
function checkProviderConfiguration() {
  const provider = presetsSettings.value.provider

  // Reset all validation messages first
  Object.keys(validationMessage.value).forEach((key) => {
    validationMessage.value[key as keyof typeof validationMessage.value] = ''
    validationStatus.value[key as keyof typeof validationStatus.value] = 'idle'
  })

  // Providers that don't require API keys
  if (provider === 'google' || provider === 'builtin') {
    return
  }

  // Check provider-specific requirements
  switch (provider) {
    case 'deepl':
      if (!providerConfigs.value.deepl.apiKey) {
        validationStatus.value.deepl = 'error'
        validationMessage.value.deepl = `✗ ${t('apiKeyRequired')}`
      }
      break

    case 'gemini':
      if (!providerConfigs.value.gemini.apiKey) {
        validationStatus.value.gemini = 'error'
        validationMessage.value.gemini = `✗ ${t('apiKeyRequired')}`
      }
      break

    case 'chatgpt':
      if (!providerConfigs.value.chatgpt.apiKey) {
        validationStatus.value.chatgpt = 'error'
        validationMessage.value.chatgpt = `✗ ${t('apiKeyRequired')}`
      }
      break

    case 'groq':
      if (!providerConfigs.value.groq.apiKey) {
        validationStatus.value.groq = 'error'
        validationMessage.value.groq = `✗ ${t('apiKeyRequired')}`
      }
      break

    case 'ollama':
      if (!providerConfigs.value.ollama.model) {
        validationStatus.value.ollama = 'error'
        validationMessage.value.ollama = `✗ ${t('modelRequired')}`
      } else if (!providerConfigs.value.ollama.baseUrl) {
        validationStatus.value.ollama = 'error'
        validationMessage.value.ollama = `✗ ${t('baseUrlRequired')}`
      }
      break

    case 'openrouter':
      if (!providerConfigs.value.openrouter.apiKey) {
        validationStatus.value.openrouter = 'error'
        validationMessage.value.openrouter = `✗ ${t('apiKeyRequired')}`
      }
      break

    case 'custom':
      if (!providerConfigs.value.custom.baseUrl) {
        validationStatus.value.custom = 'error'
        validationMessage.value.custom = `✗ ${t('baseUrlRequired')}`
      } else if (!providerConfigs.value.custom.model) {
        validationStatus.value.custom = 'error'
        validationMessage.value.custom = `✗ ${t('modelRequired')}`
      }
      break
  }
}
</script>

<style scoped>
/* No additional styles needed - using Tailwind classes */
</style>
