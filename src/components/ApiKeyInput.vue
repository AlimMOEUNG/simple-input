<template>
  <!-- Password input for an API key + subscription CTA link -->
  <div class="space-y-0.5">
    <input
      :value="modelValue ?? ''"
      @input="(e) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
      type="password"
      :placeholder="placeholder || t('apiKeyPlaceholder')"
      class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
    <a
      href="https://tally.so/r/9qDkWK"
      target="_blank"
      rel="noopener noreferrer"
      class="block text-[10px] text-blue-500 dark:text-blue-400 hover:underline cursor-pointer"
    >
      {{ t('apiKeySubscriptionCta') }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { useI18nWrapper } from '@/composables/useI18nWrapper'

const { t } = useI18nWrapper()

defineProps<{
  modelValue: string | undefined
  /** Overrides the default 'apiKeyPlaceholder' i18n value */
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
