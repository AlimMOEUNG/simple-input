<template>
  <div class="space-y-1.5">
    <!-- Custom transform selector -->
    <div class="flex items-center gap-2">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
        {{ t('customTransformLabel') }}
      </label>
      <select
        :value="customTransformId"
        @change="(e) => emit('update:customTransformId', (e.target as HTMLSelectElement).value)"
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="" disabled>{{ t('customTransformPlaceholder') }}</option>
        <option v-for="ct in customTransforms" :key="ct.id" :value="ct.id">
          {{ ct.name }} ({{ Object.keys(ct.charMap).length }} mappings)
        </option>
      </select>
    </div>

    <p
      v-if="customTransforms.length === 0"
      class="text-[10px] text-gray-500 dark:text-gray-400 ml-[7rem]"
    >
      {{ t('customTransformEmpty') }}
    </p>

    <!-- Open options page to manage custom transforms -->
    <button
      @click="openOptionsPage"
      class="ml-[7rem] px-2 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {{ t('customTransformOpenOptions') }}
    </button>

    <!-- Live preview (only shown when a valid transform is selected) -->
    <div v-if="customTransformId && selectedCustomTransform" class="space-y-1">
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
        {{ customTransformPreview }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { applyCustomCharMap } from '@/core/transformation/TransformationEngine'
import { getAllCustomTransforms } from '@/services/customTransformService'
import type { CustomTransformation } from '@/types/common'

const { t } = useI18nWrapper()

const props = defineProps<{
  customTransformId: string
  customExampleText: string
}>()

const emit = defineEmits<{
  'update:customTransformId': [value: string]
  'update:customExampleText': [value: string]
}>()

// Custom transforms loaded from storage once on mount
const customTransforms = ref<CustomTransformation[]>([])

onMounted(async () => {
  customTransforms.value = await getAllCustomTransforms()
})

const selectedCustomTransform = computed(
  () => customTransforms.value.find((ct) => ct.id === props.customTransformId) ?? null
)

const customTransformPreview = computed(() => {
  if (!selectedCustomTransform.value) return ''
  return applyCustomCharMap(props.customExampleText, selectedCustomTransform.value.charMap)
})

function openOptionsPage() {
  chrome.runtime.openOptionsPage()
}
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
