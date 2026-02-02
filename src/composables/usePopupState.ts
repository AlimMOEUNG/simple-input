/**
 * Composable to manage popup UI state (current view/tab)
 * Uses useStorageState for automatic persistence
 */

import { useStorageState } from './useStorageState'

// Popup view types
export type PopupView = 'presets' | 'provider'

/**
 * Composable to manage popup view state
 * Automatically saves to chrome.storage.local
 *
 * @returns Object with current view state
 *
 * @example
 * const { currentView } = usePopupState()
 * currentView.value = 'provider' // Automatically saved
 */
export function usePopupState() {
  // Use useStorageState for automatic persistence (local storage for UI state)
  const { value: currentView, isLoading } = useStorageState<PopupView>(
    'popupCurrentView',
    'presets',
    {
      storageArea: 'local',
    }
  )

  return {
    currentView,
    isLoading,
  }
}
