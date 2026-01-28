/**
 * Vue 3 composable wrapper for i18n system
 * Provides reactive locale switching and translation helpers
 */

import { ref, computed } from 'vue'
import { useI18n, setLocale as setI18nLocale, type Locale } from '@/core/utils/i18n'

const currentLocale = ref<Locale>('en')

export function useI18nWrapper() {
  const { t } = useI18n()

  // Reactive locale
  const reactiveLocale = computed(() => currentLocale.value)

  // Set locale and persist to storage
  const setLocale = async (newLocale: Locale) => {
    currentLocale.value = newLocale
    setI18nLocale(newLocale)

    // Persist to chrome.storage
    await chrome.storage.sync.set({ locale: newLocale })
  }

  // Load locale from storage on init
  const loadLocale = async () => {
    const result = await chrome.storage.sync.get('locale')
    if (result.locale) {
      currentLocale.value = result.locale
      setI18nLocale(result.locale)
    }
  }

  return {
    t,
    locale: reactiveLocale,
    setLocale,
    loadLocale,
  }
}
