/**
 * Vue 3 composable wrapper for i18n system
 * Provides reactive locale switching and translation helpers
 * Uses Chrome storage sync to persist locale across devices
 */

import { watch } from 'vue'
import { useI18n, setLocale as setI18nLocale, type Locale } from '@/core/utils/i18n'
import { useStorageState } from './useStorageState'

export function useI18nWrapper() {
  const { t, locale: i18nLocale } = useI18n()

  // Load locale from Chrome storage sync (synced across devices)
  const { value: locale } = useStorageState<Locale>('locale', i18nLocale.value, {
    storageArea: 'sync',
  })

  // Sync storage changes to i18n system
  watch(
    locale,
    (newLocale) => {
      if (newLocale && newLocale !== i18nLocale.value) {
        setI18nLocale(newLocale)
      }
    },
    { immediate: true }
  )

  // Set locale (automatically persists via useStorageState)
  const setLocale = (newLocale: Locale) => {
    locale.value = newLocale
    setI18nLocale(newLocale)
  }

  return {
    t,
    locale,
    setLocale,
  }
}
