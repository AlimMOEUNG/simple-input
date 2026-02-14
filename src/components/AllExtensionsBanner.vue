<template>
  <!-- Promotional banner linking to the Subtiltee all-extensions page -->
  <div class="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20">
    <a
      href="https://subtiltee.com/all-extensions?from=power-input"
      target="_blank"
      rel="noopener"
      class="flex items-center gap-3 px-4 py-2.5 hover:bg-violet-100/60 dark:hover:bg-violet-800/20 transition-colors group"
    >
      <!-- grid icon -->
      <div class="flex-shrink-0 w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center">
        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-violet-700 dark:text-violet-300 truncate">
          {{ t('allExtensionsBannerTitle') }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ t('allExtensionsBannerDesc') }}
        </p>
      </div>

      <!-- arrow icon -->
      <svg
        class="w-4 h-4 text-violet-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  </div>
</template>

<script setup lang="ts">
import { useI18nWrapper } from '@/composables/useI18nWrapper'

const { t } = useI18nWrapper()
</script>
