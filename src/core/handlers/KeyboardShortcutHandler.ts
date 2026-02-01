/**
 * KeyboardShortcutHandler - Handles keyboard shortcuts for translation
 *
 * Supports multiple presets, each with its own:
 * - Source language
 * - Target language
 * - Keyboard shortcut
 *
 * Translation behavior:
 * - If selection exists → translate selection
 * - If focus on input → translate entire input content
 * - Otherwise → do nothing
 *
 * Shortcuts are customizable via presets settings (stored in chrome.storage.sync)
 */

import { TranslationEngine } from '../translation/TranslationEngine'
import { SettingsManager } from '../storage/SettingsManager'
import { InputHandler } from './input/InputHandler'
import {
  formatShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '../utils/keyboardUtils'
import type { TranslationPreset } from '@/types/common'

export class KeyboardShortcutHandler {
  private isProcessing = false // Prevent concurrent translations
  private shortcutMap = new Map<string, TranslationPreset>() // Shortcut → Preset mapping
  private sequenceDetector = new KeyboardSequenceDetector() // Sequence detector for multi-key shortcuts

  constructor(
    private engine: TranslationEngine,
    private settings: SettingsManager
  ) {}

  /**
   * Initialize the handler by setting up keyboard event listener
   */
  initialize(): void {
    this.rebuildShortcutMap()
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    console.log('[KeyboardShortcut] Handler initialized with presets:', this.shortcutMap.size)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.shortcutMap.clear()
    console.log('[KeyboardShortcut] Handler destroyed')
  }

  /**
   * Rebuild shortcut map from all presets
   * Called on init and when presets change
   */
  rebuildShortcutMap(): void {
    this.shortcutMap.clear()
    const presets = this.settings.getPresets()

    for (const preset of presets) {
      const normalized = normalizeShortcut(preset.keyboardShortcut)
      this.shortcutMap.set(normalized, preset)
      console.log(
        `[KeyboardShortcut] Registered: ${preset.keyboardShortcut} → ${preset.name} (${preset.sourceLang} → ${preset.targetLang})`
      )
    }
  }

  /**
   * Handle keydown events and detect configured shortcuts
   * Supports both simple shortcuts and multi-key sequences
   */
  private async handleKeyDown(event: KeyboardEvent): Promise<void> {
    // Process the key event through sequence detector
    const sequenceShortcut = this.sequenceDetector.processKeyDown(event)

    // Try both simple shortcut and sequence shortcut
    const simpleShortcut = formatShortcutFromEvent(event)

    // Check if either format matches a preset
    let preset = this.shortcutMap.get(simpleShortcut)
    if (!preset && sequenceShortcut) {
      preset = this.shortcutMap.get(sequenceShortcut)
    }

    // No matching preset found
    if (!preset) {
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

    console.log(
      `[KeyboardShortcut] Shortcut triggered: ${preset.name} (${preset.keyboardShortcut})`
    )

    try {
      this.isProcessing = true
      await this.handleShortcut(preset)
    } finally {
      this.isProcessing = false
      // Reset sequence after successful shortcut
      this.sequenceDetector.reset()
    }
  }

  /**
   * Handle keyup events to reset sequence detector
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.sequenceDetector.processKeyUp(event)
  }

  /**
   * Main shortcut logic: detect context and translate
   * Uses preset's source and target languages
   */
  private async handleShortcut(preset: TranslationPreset): Promise<void> {
    // Get focused input if any
    const focusedInput = InputHandler.getFocusedInput()

    // Case 1: If input has selection, translate only the selection
    if (focusedInput && InputHandler.hasSelection(focusedInput)) {
      const selection = InputHandler.getSelectedText(focusedInput)
      if (selection && selection.trim().length > 0) {
        console.log(`[KeyboardShortcut] Translating input selection (${selection.length} chars)`)
        await this.translateInputSelection(focusedInput, selection, preset)
        return
      }
    }

    // Case 2: If input is focused, translate entire content
    if (focusedInput) {
      const text = InputHandler.getTextValue(focusedInput)
      if (text && text.trim().length > 0) {
        console.log(`[KeyboardShortcut] Translating input content (${text.length} chars)`)
        await this.translateInputContent(focusedInput, text, preset)
        return
      }
    }

    // Case 3: Check if there's a text selection outside of inputs (page selection)
    const pageSelection = window.getSelection()?.toString()
    if (pageSelection && pageSelection.trim().length > 0) {
      console.log(`[KeyboardShortcut] Translating page selection (${pageSelection.length} chars)`)
      await this.translatePageSelection(pageSelection, preset)
      return
    }

    // Case 4: Nothing to translate
    console.log('[KeyboardShortcut] No selection or input focus, skipping')
  }

  /**
   * Translate selection within an input field
   * Uses preset's source and target languages
   */
  private async translateInputSelection(
    inputElement: HTMLElement,
    selectedText: string,
    preset: TranslationPreset
  ): Promise<void> {
    try {
      // Translate the text using preset languages
      const translatedText = await this.engine.translateText(
        selectedText,
        preset.sourceLang,
        preset.targetLang
      )
      console.log(
        `[KeyboardShortcut] Input selection translated (${preset.sourceLang} → ${preset.targetLang})`
      )

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
   * Uses preset's source and target languages
   */
  private async translateInputContent(
    inputElement: HTMLElement,
    originalText: string,
    preset: TranslationPreset
  ): Promise<void> {
    try {
      // Translate the text using preset languages
      const translatedText = await this.engine.translateText(
        originalText,
        preset.sourceLang,
        preset.targetLang
      )
      console.log(
        `[KeyboardShortcut] Input content translated (${preset.sourceLang} → ${preset.targetLang})`
      )

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
   * Uses preset's source and target languages
   */
  private async translatePageSelection(
    selectedText: string,
    preset: TranslationPreset
  ): Promise<void> {
    try {
      // Translate the text using preset languages
      const translatedText = await this.engine.translateText(
        selectedText,
        preset.sourceLang,
        preset.targetLang
      )
      console.log(
        `[KeyboardShortcut] Page selection translated (${preset.sourceLang} → ${preset.targetLang})`
      )

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
