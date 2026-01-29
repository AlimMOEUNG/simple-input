/**
 * Content script - Simple Input Translator
 * Handles keyboard shortcuts for translating selected text or input content
 */

import { TranslationEngine } from './core/translation/TranslationEngine'
import { SettingsManager } from './core/storage/SettingsManager'
import { KeyboardShortcutHandler } from './core/handlers/KeyboardShortcutHandler'
import { WordSelectionHandler } from './core/handlers/input/WordSelectionHandler'

console.log('[Content] Simple Input Translator loaded')

// Initialize components
let settings: SettingsManager
let engine: TranslationEngine
let keyboardHandler: KeyboardShortcutHandler
let wordSelectionHandler: WordSelectionHandler

async function initialize() {
  try {
    // Create settings manager
    settings = new SettingsManager()
    await settings.load()

    // Create translation engine
    engine = new TranslationEngine(settings)
    await engine.initialize()

    // Create keyboard shortcut handler
    keyboardHandler = new KeyboardShortcutHandler(engine, settings)
    keyboardHandler.initialize()

    // Create word selection handler (Alt+Arrow keys)
    wordSelectionHandler = new WordSelectionHandler()
    wordSelectionHandler.initialize()

    console.log('[Content] Initialization complete')
  } catch (error) {
    console.error('[Content] Initialization failed:', error)
  }
}

// Initialize on load
initialize()

// Listen for settings changes from popup
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    console.log('[Content] Settings changed, reloading...')
    // Reload settings
    settings.load().then(() => {
      console.log('[Content] Settings reloaded')
      // Reinitialize provider if provider changed
      if (changes.settings.newValue?.provider !== changes.settings.oldValue?.provider) {
        console.log('[Content] Provider changed, reinitializing...')
        engine.reinitializeProvider().then(() => {
          console.log('[Content] Provider reinitialized')
        })
      }
    })
  }

  // Also reinitialize if API keys changed (provider keys are in local storage)
  if (areaName === 'local' && changes.providerKeys) {
    console.log('[Content] Provider keys changed, reinitializing...')
    engine.reinitializeProvider().then(() => {
      console.log('[Content] Provider reinitialized')
    })
  }
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (keyboardHandler) {
    keyboardHandler.destroy()
  }
  if (wordSelectionHandler) {
    wordSelectionHandler.destroy()
  }
  if (engine) {
    engine.destroy()
  }
})
