import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useStorageState } from './useStorageState'

export type ThemeMode = 'auto' | 'light' | 'dark'

/**
 * Composable to manage theme mode (auto/light/dark) with Chrome storage sync
 * Automatically applies dark class to document.documentElement
 * Watches system theme changes when in auto mode
 *
 * @returns Object with theme state and controls
 *
 * @example
 * const { themeMode, currentTheme, cycleTheme } = useThemeMode()
 * // themeMode.value: 'auto' | 'light' | 'dark' (user preference)
 * // currentTheme.value: 'light' | 'dark' (computed based on system if auto)
 * // cycleTheme(): cycle through auto → light → dark → auto
 */
export function useThemeMode() {
  // Load theme mode from Chrome storage sync (synced across devices)
  const { value: themeMode } = useStorageState<ThemeMode>('themeMode', 'auto', {
    storageArea: 'sync',
  })

  // Computed theme based on mode and system preference
  const currentTheme = ref<'light' | 'dark'>('light')

  // MediaQuery for system theme detection
  let mediaQuery: MediaQueryList | null = null
  let mediaQueryHandler: (() => void) | null = null

  /**
   * Update current theme based on mode and system preference
   */
  function updateCurrentTheme() {
    if (themeMode.value === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? 'dark' : 'light'
    } else {
      currentTheme.value = themeMode.value
    }
  }

  /**
   * Cycle theme mode: auto → light → dark → auto
   */
  function cycleTheme() {
    if (themeMode.value === 'auto') {
      themeMode.value = 'light'
    } else if (themeMode.value === 'light') {
      themeMode.value = 'dark'
    } else {
      themeMode.value = 'auto'
    }
  }

  /**
   * Watch system theme changes (only when in auto mode)
   */
  function watchSystemTheme() {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryHandler = () => {
      if (themeMode.value === 'auto') {
        updateCurrentTheme()
      }
    }
    mediaQuery.addEventListener('change', mediaQueryHandler)
  }

  // Initialize theme and watchers
  onMounted(() => {
    updateCurrentTheme()
    watchSystemTheme()
  })

  // Cleanup
  onUnmounted(() => {
    if (mediaQuery && mediaQueryHandler) {
      mediaQuery.removeEventListener('change', mediaQueryHandler)
    }
  })

  // Watch theme mode changes
  watch(themeMode, () => {
    updateCurrentTheme()
  })

  // Apply dark class to HTML element
  watch(
    currentTheme,
    (newTheme) => {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    { immediate: true }
  )

  return {
    themeMode, // Ref<'auto' | 'light' | 'dark'> - User preference (synced with storage)
    currentTheme, // Ref<'light' | 'dark'> - Computed theme (considers system if auto)
    cycleTheme, // Function to cycle through modes
  }
}
