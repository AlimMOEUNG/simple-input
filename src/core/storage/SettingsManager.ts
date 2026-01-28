/**
 * SettingsManager - Manages extension settings from chrome.storage
 * Provides simple get/set interface for settings
 */

export interface Settings {
  sourceLang: string // ISO 639-1 code or 'auto'
  targetLang: string // ISO 639-1 code
  provider: 'builtin' | 'deepl' | 'gemini'
  keyboardShortcut: string // e.g., 'Alt+T'
}

export class SettingsManager {
  private settings: Settings = {
    sourceLang: 'auto',
    targetLang: 'en',
    provider: 'builtin',
    keyboardShortcut: 'Alt+T',
  }

  /**
   * Load settings from chrome.storage.sync
   */
  async load(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('settings')
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings }
      }
      console.log('[SettingsManager] Settings loaded:', this.settings)
    } catch (error) {
      console.error('[SettingsManager] Failed to load settings:', error)
    }
  }

  /**
   * Get a setting value
   */
  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key]
  }

  /**
   * Get all settings
   */
  getAll(): Settings {
    return { ...this.settings }
  }

  /**
   * Set a setting value
   */
  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings[key] = value
  }

  /**
   * Update settings and save to storage
   */
  async save(): Promise<void> {
    try {
      await chrome.storage.sync.set({ settings: this.settings })
      console.log('[SettingsManager] Settings saved:', this.settings)
    } catch (error) {
      console.error('[SettingsManager] Failed to save settings:', error)
    }
  }
}
