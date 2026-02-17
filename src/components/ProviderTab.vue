<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-2">
    <!-- Global provider selector -->
    <div>
      <label class="block text-[10px] font-semibold mb-1 text-gray-700 dark:text-gray-300">
        {{ t('providerLabel') }}
      </label>
      <select
        v-model="presetsSettings.provider"
        @change="onProviderChange"
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option
          v-for="provider in AVAILABLE_PROVIDERS"
          :key="provider.value"
          :value="provider.value"
        >
          {{ provider.label }}
        </option>
      </select>
    </div>

    <!-- Provider-specific fields: API key, base URL, model, validation -->
    <ProviderConfigForm
      :provider="presetsSettings.provider"
      :config="currentProviderConfig"
      :validationStatus="validationStatus[presetsSettings.provider]"
      :validationMessage="validationMessage[presetsSettings.provider]"
      :configLoaded="!providerConfigsLoading"
      @update:config="updateCurrentConfig"
      @validate="validateProviderConfig(presetsSettings.provider)"
    />

    <!-- Word selection modifier selector (global shortcut setting) -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
      <div class="flex items-center gap-1 mb-1 relative group">
        <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
          {{ t('selectionModifierLabel') }}
        </label>
        <!-- Info tooltip explaining the word selection shortcut -->
        <Info :size="13" class="text-gray-400 dark:text-gray-500 cursor-help" />
        <div
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-64 pointer-events-none"
        >
          <div
            class="bg-gray-900 dark:bg-gray-700 text-white text-[10px] p-2 rounded shadow-lg leading-relaxed text-center"
          >
            {{ t('selectionModifierHelp') }}
          </div>
        </div>
      </div>
      <select
        :value="selectionModifier"
        @change="
          selectionModifier = ($event.target as HTMLSelectElement).value as SelectionModifier
        "
        class="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option v-for="mod in SELECTION_MODIFIERS" :key="mod.value" :value="mod.value">
          {{ mod.label }}
        </option>
      </select>
      <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-0.5">
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ selectionModifier }}</span>
        <span class="text-base leading-none">+←</span>
        <span class="mx-0.5">/</span>
        <span class="font-medium text-gray-600 dark:text-gray-400">{{ selectionModifier }}</span>
        <span class="text-base leading-none">+→</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Info } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useSettings, type ProviderConfigs } from '@/composables/useSettings'
import { usePresetsSettings } from '@/composables/usePresetsSettings'
import { AVAILABLE_PROVIDERS } from '@/config/providers'
import { validateProviderCredentials } from '@/utils/providerValidation'
import type { SelectionModifier } from '@/types/common'
import ProviderConfigForm from './ProviderConfigForm.vue'

const { t } = useI18nWrapper()
const { providerConfigs, providerConfigsLoading } = useSettings()
const { presetsSettings } = usePresetsSettings()

// Available modifier keys for word selection shortcut
const SELECTION_MODIFIERS: Array<{ value: SelectionModifier; label: string }> = [
  { value: 'Alt', label: 'Alt' },
  { value: 'Ctrl', label: 'Ctrl' },
  { value: 'Shift', label: 'Shift' },
  { value: 'Meta', label: 'Meta (⌘/Win)' },
]

// Computed with 'Alt' as default when selectionModifier is undefined
const selectionModifier = computed<SelectionModifier>({
  get: () => presetsSettings.value.selectionModifier ?? 'Alt',
  set: (val) => {
    presetsSettings.value.selectionModifier = val
  },
})

// --- Validation state ---

type ValidationState = 'idle' | 'loading' | 'success' | 'error'

const validationStatus = ref<Record<string, ValidationState>>({
  deepl: 'idle',
  gemini: 'idle',
  chatgpt: 'idle',
  groq: 'idle',
  ollama: 'idle',
  openrouter: 'idle',
  custom: 'idle',
})

const validationMessage = ref<Record<string, string>>({
  deepl: '',
  gemini: '',
  chatgpt: '',
  groq: '',
  ollama: '',
  openrouter: '',
  custom: '',
})

// --- Config helpers for ProviderConfigForm ---

// Extract the current provider's config object as a unified shape
const currentProviderConfig = computed(
  () => providerConfigs.value[presetsSettings.value.provider as keyof ProviderConfigs] ?? {}
)

/**
 * Merge a partial config update from ProviderConfigForm into the reactive store.
 * Object.assign is used to mutate in-place so Vue's reactivity tracks the change.
 */
function updateCurrentConfig(partial: Partial<{ apiKey: string; baseUrl: string; model: string; customModel: string }>) {
  const p = presetsSettings.value.provider as keyof ProviderConfigs
  Object.assign(providerConfigs.value[p], partial)
}

// --- Provider validation ---
// Delegates to the shared validateProviderCredentials utility (PROXY_FETCH under the hood)

async function validateProviderConfig(provider: string) {
  validationStatus.value[provider] = 'loading'
  validationMessage.value[provider] = ''

  try {
    const cfg = providerConfigs.value[provider as keyof typeof providerConfigs.value] as {
      apiKey?: string
      baseUrl?: string
    }
    const result = await validateProviderCredentials(
      provider,
      cfg?.apiKey ?? '',
      cfg?.baseUrl
    )

    if (result.success) {
      validationStatus.value[provider] = 'success'
      validationMessage.value[provider] = `✓ ${t('apiKeyValid')}`
    } else {
      validationStatus.value[provider] = 'error'
      validationMessage.value[provider] = `✗ ${result.error}`
    }
  } catch (err) {
    validationStatus.value[provider] = 'error'
    validationMessage.value[provider] = `✗ ${err instanceof Error ? err.message : t('apiKeyRequired')}`
  }
}

// --- Provider change handler ---

function onProviderChange() {
  checkProviderConfiguration()
}

/**
 * Reset validation state and highlight missing required fields for the
 * currently selected provider. Called on mount and on provider change.
 */
function checkProviderConfiguration() {
  const provider = presetsSettings.value.provider

  // Clear all previous messages
  Object.keys(validationMessage.value).forEach((key) => {
    validationMessage.value[key] = ''
    validationStatus.value[key] = 'idle'
  })

  // google and builtin providers need no credentials
  if (provider === 'google' || provider === 'builtin') return

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

// --- Lifecycle ---

// Run checkProviderConfiguration() only after providerConfigs has loaded from storage.
// onMounted fires before the async storage read completes, so checking there would
// always see empty defaults and incorrectly show "API key required".
watch(providerConfigsLoading, (loading) => {
  if (!loading) {
    checkProviderConfiguration()
  }
}, { immediate: true })
</script>
