/**
 * KeyboardShortcutHandler - Handles keyboard shortcuts for translation
 *
 * Provides keyboard shortcut (Alt+T by default) for translating text:
 * - If selection exists → translate selection
 * - If focus on input → translate entire input content
 * - Otherwise → do nothing
 *
 * Shortcut is customizable via settings (stored in chrome.storage.sync)
 */

import { TranslationEngine } from '../translation/TranslationEngine'
import { SettingsManager } from '../storage/SettingsManager'
import { InputHandler } from './input/InputHandler'

/**
 * Shortcut configuration object
 */
interface ShortcutConfig {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  key: string
}

export class KeyboardShortcutHandler {
  private isProcessing = false // Prevent concurrent translations

  constructor(
    private engine: TranslationEngine,
    private settings: SettingsManager
  ) {}

  /**
   * Initialize the handler by setting up keyboard event listener
   */
  initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    console.log('[KeyboardShortcut] Handler initialized')
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    console.log('[KeyboardShortcut] Handler destroyed')
  }

  /**
   * Handle keydown events and detect configured shortcut
   */
  private async handleKeyDown(event: KeyboardEvent): Promise<void> {
    // Get configured shortcut from settings (default: "Alt+T")
    const shortcut = this.settings.get('keyboardShortcut') || 'Alt+T'

    // Parse shortcut string (e.g., "Alt+T" → { alt: true, key: 't' })
    const shortcutConfig = this.parseShortcut(shortcut)

    // Check if current event matches configured shortcut
    if (!this.matchesShortcut(event, shortcutConfig)) {
      return
    }

    // Prevent default browser behavior and event propagation
    event.preventDefault()
    event.stopPropagation()

    // Prevent concurrent translations
    if (this.isProcessing) {
      console.log('[KeyboardShortcut] Translation already in progress, skipping')
      return
    }

    try {
      this.isProcessing = true
      await this.handleShortcut()
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Parse shortcut string into configuration object
   * Examples: "Alt+T" → { alt: true, key: 't' }
   *           "Ctrl+Shift+T" → { ctrl: true, shift: true, key: 't' }
   */
  private parseShortcut(shortcut: string): ShortcutConfig {
    const parts = shortcut.split('+').map((p) => p.trim().toLowerCase())
    const key = parts[parts.length - 1] // Last part is the key

    return {
      ctrl: parts.includes('ctrl') || parts.includes('control'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd'),
      key: key,
    }
  }

  /**
   * Check if keyboard event matches shortcut configuration
   */
  private matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
    return (
      event.key.toLowerCase() === config.key &&
      event.ctrlKey === (config.ctrl || false) &&
      event.altKey === (config.alt || false) &&
      event.shiftKey === (config.shift || false) &&
      event.metaKey === (config.meta || false)
    )
  }

  /**
   * Main shortcut logic: detect context and translate
   */
  private async handleShortcut(): Promise<void> {
    // Get focused input if any
    const focusedInput = InputHandler.getFocusedInput()

    // Case 1: If input has selection, translate only the selection
    if (focusedInput && InputHandler.hasSelection(focusedInput)) {
      const selection = InputHandler.getSelectedText(focusedInput)
      if (selection && selection.trim().length > 0) {
        console.log(`[KeyboardShortcut] Translating input selection (${selection.length} chars)`)
        await this.translateInputSelection(focusedInput, selection)
        return
      }
    }

    // Case 2: If input is focused, translate entire content
    if (focusedInput) {
      const text = InputHandler.getTextValue(focusedInput)
      if (text && text.trim().length > 0) {
        console.log(`[KeyboardShortcut] Translating input content (${text.length} chars)`)
        await this.translateInputContent(focusedInput, text)
        return
      }
    }

    // Case 3: Check if there's a text selection outside of inputs (page selection)
    const pageSelection = window.getSelection()?.toString()
    if (pageSelection && pageSelection.trim().length > 0) {
      console.log(`[KeyboardShortcut] Translating page selection (${pageSelection.length} chars)`)
      await this.translatePageSelection(pageSelection)
      return
    }

    // Case 4: Nothing to translate
    console.log('[KeyboardShortcut] No selection or input focus, skipping')
  }

  /**
   * Translate selection within an input field
   */
  private async translateInputSelection(
    inputElement: HTMLElement,
    selectedText: string
  ): Promise<void> {
    try {
      // Translate the text
      const translatedText = await this.engine.translateText(selectedText)
      console.log('[KeyboardShortcut] Input selection translated')

      // Replace selection in input
      const success = InputHandler.replaceSelectedText(inputElement, translatedText)
      if (!success) {
        throw new Error('Failed to replace selected text in input')
      }
    } catch (error) {
      console.error('[KeyboardShortcut] Input selection translation failed:', error)
      alert(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Translate entire input content
   */
  private async translateInputContent(
    inputElement: HTMLElement,
    originalText: string
  ): Promise<void> {
    try {
      // Translate the text
      const translatedText = await this.engine.translateText(originalText)
      console.log('[KeyboardShortcut] Input content translated')

      // Replace entire input content
      const success = InputHandler.setTextValue(inputElement, translatedText)
      if (!success) {
        throw new Error('Failed to set text value in input')
      }

      // Select all translated text
      InputHandler.selectAll(inputElement)
    } catch (error) {
      console.error('[KeyboardShortcut] Input content translation failed:', error)
      alert(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Translate page selection (text selected outside of input fields)
   */
  private async translatePageSelection(selectedText: string): Promise<void> {
    try {
      // Translate the text
      const translatedText = await this.engine.translateText(selectedText)
      console.log('[KeyboardShortcut] Page selection translated')

      // Replace selection using DOM manipulation
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(translatedText)
        range.insertNode(textNode)

        // Select the new text
        const newRange = document.createRange()
        newRange.selectNodeContents(textNode)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    } catch (error) {
      console.error('[KeyboardShortcut] Page selection translation failed:', error)
      alert(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
