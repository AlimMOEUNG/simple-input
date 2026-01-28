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
    // Case 1: Check if there's a text selection
    const selection = this.getSelectedText()

    if (selection && selection.trim().length > 0) {
      console.log(`[KeyboardShortcut] Translating selection (${selection.length} chars)`)
      await this.translateSelection(selection)
      return
    }

    // Case 2: Check if focus is on input/textarea/contenteditable
    const activeElement = document.activeElement as HTMLElement

    if (this.isEditableElement(activeElement)) {
      console.log('[KeyboardShortcut] Translating input content')
      await this.translateInput(activeElement)
      return
    }

    // Case 3: Nothing to translate
    console.log('[KeyboardShortcut] No selection or input focus, skipping')
  }

  /**
   * Get selected text from window selection
   */
  private getSelectedText(): string {
    const selection = window.getSelection()
    return selection?.toString() || ''
  }

  /**
   * Check if element is editable (input/textarea/contenteditable)
   */
  private isEditableElement(element: HTMLElement | null): element is HTMLElement {
    if (!element) return false

    return (
      element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable
    )
  }

  /**
   * Case 1: Translate selected text
   * Replaces selection with translation
   */
  private async translateSelection(selectedText: string): Promise<void> {
    try {
      // Translate the text
      const translatedText = await this.engine.translateText(selectedText)
      console.log('[KeyboardShortcut] Selection translated')

      // Replace selection
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer
        const element =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement)

        if (element) {
          await this.replaceSelection(element, translatedText)
        }
      }
    } catch (error) {
      console.error('[KeyboardShortcut] Selection translation failed:', error)
      alert(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Case 2: Translate input content
   * Replaces entire input content with translation
   */
  private async translateInput(inputElement: HTMLElement): Promise<void> {
    try {
      // Extract text from input element
      const originalText = this.extractInputText(inputElement)

      if (!originalText || originalText.trim().length === 0) {
        console.warn('[KeyboardShortcut] No text in input to translate')
        return
      }

      console.log(`[KeyboardShortcut] Translating input (${originalText.length} chars)`)

      // Translate the text
      const translatedText = await this.engine.translateText(originalText)

      // Replace input content
      this.setInputText(inputElement, translatedText)

      // Select all translated text
      this.selectAllContent(inputElement)

      console.log('[KeyboardShortcut] Input translated successfully')
    } catch (error) {
      console.error('[KeyboardShortcut] Input translation failed:', error)
      alert(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from input element (handles textarea, input, contenteditable)
   */
  private extractInputText(element: HTMLElement): string {
    if ('value' in element) {
      return (element as HTMLInputElement | HTMLTextAreaElement).value
    }

    if (element.isContentEditable) {
      return element.textContent || ''
    }

    return ''
  }

  /**
   * Set text in input element
   */
  private setInputText(element: HTMLElement, text: string): void {
    if ('value' in element) {
      ;(element as HTMLInputElement | HTMLTextAreaElement).value = text
      // Trigger input event for frameworks to detect change
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
    } else if (element.isContentEditable) {
      element.textContent = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  /**
   * Select all content in input element
   */
  private selectAllContent(element: HTMLElement): void {
    if ('select' in element) {
      ;(element as HTMLInputElement | HTMLTextAreaElement).select()
    } else if (element.isContentEditable) {
      const range = document.createRange()
      range.selectNodeContents(element)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  /**
   * Replace selected text using clipboard-based approach
   */
  private async replaceSelection(element: HTMLElement, text: string): Promise<void> {
    try {
      // Try using clipboard API
      await navigator.clipboard.writeText(text)
      document.execCommand('paste')
    } catch (_error) {
      // Fallback: direct DOM manipulation
      console.warn('[KeyboardShortcut] Clipboard replacement failed, using DOM fallback')
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)

        // Restore selection on new text
        const newRange = document.createRange()
        newRange.selectNodeContents(textNode)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }
  }
}
