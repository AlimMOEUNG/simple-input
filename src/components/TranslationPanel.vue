<template>
  <div class="space-y-1.5">
    <!-- Source language -->
    <div class="flex items-center gap-2">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
        {{ t('sourceLanguage') }}
      </label>
      <div class="flex-1">
        <LanguageSelector
          :modelValue="sourceLang"
          @update:modelValue="emit('update:sourceLang', $event)"
          :placeholder="t('searchLanguagePlaceholder')"
          input-id="source-language-selector"
          include-auto-detect
        />
      </div>
    </div>

    <!-- Target language -->
    <div class="flex items-center gap-2">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
        {{ t('targetLanguage') }}
      </label>
      <div class="flex-1">
        <LanguageSelector
          :modelValue="targetLang"
          @update:modelValue="emit('update:targetLang', $event)"
          :placeholder="t('searchLanguagePlaceholder')"
          input-id="target-language-selector"
        />
      </div>
    </div>

    <!-- Custom provider block (toggle + config fields) -->
    <div class="flex items-start gap-2 pt-1">
      <!-- Checkbox + "Custom" label -->
      <div class="flex items-center gap-2 w-24 shrink-0 pt-1.5">
        <input
          type="checkbox"
          id="useCustomProvider"
          :checked="useCustomProvider"
          @change="emit('update:useCustomProvider', ($event.target as HTMLInputElement).checked)"
          class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
        />
        <label
          for="useCustomProvider"
          class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          Custom
        </label>
      </div>

      <!-- Config fields — only shown when the checkbox is checked -->
      <div class="flex-1 space-y-1.5" v-if="useCustomProvider">
        <!-- Provider dropdown -->
        <select
          :value="customProvider"
          @change="handleProviderChange(($event.target as HTMLSelectElement).value)"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option
            v-for="provider in AVAILABLE_PROVIDERS"
            :key="provider.value"
            :value="provider.value"
          >
            {{ provider.label }}
          </option>
        </select>

        <!-- Shared provider config: base URL, API key, model selector -->
        <ProviderConfigForm
          v-if="customProvider"
          :provider="customProvider"
          :config="presetConfig"
          @update:config="(partial) => emit('update:presetConfig', { ...presetConfig, ...partial })"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { AVAILABLE_PROVIDERS, getProviderConfig } from '@/config/providers'
import type { PresetProviderConfig } from '@/types/common'
import LanguageSelector from './LanguageSelector.vue'
import ProviderConfigForm from './ProviderConfigForm.vue'

const { t } = useI18nWrapper()

defineProps<{
  sourceLang: string
  targetLang: string
  useCustomProvider: boolean
  customProvider: string
  presetConfig: PresetProviderConfig
}>()

const emit = defineEmits<{
  'update:sourceLang': [value: string]
  'update:targetLang': [value: string]
  'update:useCustomProvider': [value: boolean]
  'update:customProvider': [value: string]
  'update:presetConfig': [value: PresetProviderConfig]
  /**
   * Emitted when the user picks a different provider — parent should reset presetConfig
   * to the returned default values (base URL, model) for the new provider.
   */
  'provider-change': [newProvider: string, defaultConfig: PresetProviderConfig]
}>()

/** Handle user selecting a different provider — emit both the new provider and its defaults */
function handleProviderChange(newProvider: string) {
  emit('update:customProvider', newProvider)
  const config = getProviderConfig(newProvider)
  // Only keep the default base URL/model — intentionally clear apiKey on provider change
  const defaultConfig: PresetProviderConfig = {
    baseUrl: config.defaultBaseUrl || undefined,
    model: config.defaultModel || undefined,
  }
  emit('provider-change', newProvider, defaultConfig)
}
</script>
