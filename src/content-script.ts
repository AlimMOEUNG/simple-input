/**
 * Content script - Simple Input Translator
 * Handles keyboard shortcuts for translating selected text or input content
 */

import { TranslationEngine } from './core/translation/TranslationEngine'
import { SettingsManager } from './core/storage/SettingsManager'
import { KeyboardShortcutHandler } from './core/handlers/KeyboardShortcutHandler'

console.log('[Content] Simple Input Translator loaded')

// Initialize components
let settings: SettingsManager
let engine: TranslationEngine
let keyboardHandler: KeyboardShortcutHandler

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
    })
  }
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (keyboardHandler) {
    keyboardHandler.destroy()
  }
  if (engine) {
    engine.destroy()
  }
})
