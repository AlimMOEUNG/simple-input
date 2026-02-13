<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
  >
    <h1 class="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
      <Zap :size="16" class="text-blue-600 dark:text-blue-400" />
      {{ t('appTitle') }}
    </h1>

    <div class="flex items-center gap-2">
      <!-- UI language selector -->
      <select
        v-model="uiLocale"
        class="px-2 py-0.5 text-[10px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="option in availableLanguages" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <!-- Theme toggle button (cycles auto → light → dark) -->
      <button
        @click="cycleTheme"
        class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
        :title="t('themeToggle')"
      >
        <component :is="themeIcon" :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sun, Moon, Monitor, Zap } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useThemeMode } from '@/composables/useThemeMode'
import type { SupportedLocale } from '@/core/utils/i18n'

const { t, locale, setLocale } = useI18nWrapper()
const { themeMode, cycleTheme } = useThemeMode()

const availableLanguages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

// Two-way binding for the <select> that maps to setLocale()
const uiLocale = computed<SupportedLocale>({
  get: () => locale.value,
  set: (value) => setLocale(value),
})

// Icon reflects the current active theme mode
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
</script>
