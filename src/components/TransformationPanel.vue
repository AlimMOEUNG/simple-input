<template>
  <div class="space-y-1.5">
    <!-- Built-in style selector -->
    <div class="flex items-center gap-2">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
        {{ t('transformationStyle') }}
      </label>
      <select
        :value="transformationStyle"
        @change="(e) => emit('update:transformationStyle', (e.target as HTMLSelectElement).value)"
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-unicode"
      >
        <option
          v-for="style in transformationStyles"
          :key="style.value"
          :value="style.value"
          class="font-unicode"
        >
          {{ style.label }} - {{ style.example }}
        </option>
      </select>
    </div>

    <!-- Live preview -->
    <div v-if="transformationStyle" class="space-y-1">
      <div class="flex items-center gap-2">
        <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
          {{ t('previewExample') }}
        </label>
        <input
          :value="customExampleText"
          @input="(e) => emit('update:customExampleText', (e.target as HTMLInputElement).value)"
          :placeholder="t('previewPlaceholder')"
          class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div
        class="ml-[7rem] p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 preview-transformed"
      >
        {{ transformedPreview }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { TransformationEngine } from '@/core/transformation/TransformationEngine'
import type { TransformationStyle } from '@/types/common'

const { t } = useI18nWrapper()

// One engine instance per panel mount — lightweight, no side effects
const engine = new TransformationEngine()

const props = defineProps<{
  transformationStyle: string
  customExampleText: string
}>()

const emit = defineEmits<{
  'update:transformationStyle': [value: string]
  'update:customExampleText': [value: string]
}>()

const transformationStyles = computed(() => engine.getAllStyles())

const transformedPreview = computed(() =>
  props.transformationStyle
    ? engine.transform(props.customExampleText, props.transformationStyle as TransformationStyle)
    : ''
)
</script>

<style scoped>
/* MathSymbols @font-face is declared in popup.html */
.preview-transformed {
  font-family:
    'MathSymbols',
    ui-monospace,
    'Cascadia Code',
    'Source Code Pro',
    'Menlo',
    'Consolas',
    'DejaVu Sans Mono',
    monospace;
}
</style>
