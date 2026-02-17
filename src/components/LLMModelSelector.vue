<template>
  <!-- Dropdown of predefined models (shown when the provider has a known list) -->
  <select
    v-if="hasPredefinedModels"
    :value="modelValue ?? ''"
    @change="(e) => emit('update:modelValue', (e.target as HTMLSelectElement).value)"
    class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
  >
    <option v-for="model in models" :key="model.value" :value="model.value">
      {{ model.isCustom ? t('customModel') : model.label }}
    </option>
  </select>

  <!-- Free-text input: shown when 'custom' is selected or provider has no predefined list -->
  <input
    v-if="showCustomInput"
    :value="customModelValue ?? ''"
    @input="(e) => emit('update:customModelValue', (e.target as HTMLInputElement).value)"
    type="text"
    :placeholder="t('placeholderCustomModel')"
    class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { isCustomModel } from '@/config/predefinedModels'
import type { ModelOption } from '@/config/predefinedModels'

const { t } = useI18nWrapper()

const props = defineProps<{
  /** List of available models for the selected provider */
  models: ModelOption[]
  /** Currently selected model value (may be 'custom' sentinel) */
  modelValue: string | undefined
  /** Free-text model name when 'custom' is selected or no predefined list exists */
  customModelValue: string | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:customModelValue': [value: string]
}>()

// True when the provider has at least one real (non-custom) predefined model
const hasPredefinedModels = computed(() => props.models.some((m) => !m.isCustom))

// Show the free-text input when no dropdown exists OR when 'custom' is selected
const showCustomInput = computed(
  () => !hasPredefinedModels.value || isCustomModel(props.modelValue ?? '')
)
</script>
