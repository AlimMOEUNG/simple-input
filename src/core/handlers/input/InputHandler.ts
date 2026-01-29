/**
 * InputHandler - Universal input field handler
 *
 * Supports multiple input types:
 * - <input type="text">
 * - <textarea>
 * - <div contenteditable="true">
 * - Rich text editors (TinyMCE, CKEditor, etc.)
 */

export type InputType = 'input' | 'textarea' | 'contenteditable' | 'unknown'

export class InputHandler {
  /**
   * Check if an element is editable
   */
  static isEditableElement(element: Element | null): element is HTMLElement {
    if (!element || !(element instanceof HTMLElement)) {
      return false
    }

    // Check for input and textarea
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const inputElement = element as HTMLInputElement
      // Exclude non-text input types
      if (element.tagName === 'INPUT') {
        const type = inputElement.type?.toLowerCase()
        const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password']
        if (!textTypes.includes(type)) {
          return false
        }
      }
      return !inputElement.disabled && !inputElement.readOnly
    }

    // Check for contenteditable
    if (element.isContentEditable) {
      return true
    }

    return false
  }

  /**
   * Get the type of input element
   */
  static getInputType(element: HTMLElement): InputType {
    if (element.tagName === 'INPUT') {
      return 'input'
    }
    if (element.tagName === 'TEXTAREA') {
      return 'textarea'
    }
    if (element.isContentEditable) {
      return 'contenteditable'
    }
    return 'unknown'
  }

  /**
   * Get text value from input element
   */
  static getTextValue(element: HTMLElement): string {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea':
        return (element as HTMLInputElement | HTMLTextAreaElement).value

      case 'contenteditable':
        // For contenteditable, use textContent (plain text)
        return element.textContent || ''

      default:
        return ''
    }
  }

  /**
   * Set text value in input element
   */
  static setTextValue(element: HTMLElement, text: string): boolean {
    const inputType = this.getInputType(element)

    try {
      switch (inputType) {
        case 'input':
        case 'textarea': {
          const inputElement = element as HTMLInputElement | HTMLTextAreaElement
          inputElement.value = text
          // Trigger input events for frameworks (React, Vue, etc.)
          this.dispatchInputEvents(element)
          return true
        }

        case 'contenteditable': {
          // For contenteditable, set textContent (plain text)
          element.textContent = text
          this.dispatchInputEvents(element)
          return true
        }

        default:
          return false
      }
    } catch (error) {
      console.error('[InputHandler] Failed to set text value:', error)
      return false
    }
  }

  /**
   * Check if there's a selection in the input
   */
  static hasSelection(element: HTMLElement): boolean {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea': {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        return (
          inputElement.selectionStart !== null &&
          inputElement.selectionEnd !== null &&
          inputElement.selectionStart !== inputElement.selectionEnd
        )
      }

      case 'contenteditable': {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          return false
        }
        const range = selection.getRangeAt(0)
        return !range.collapsed
      }

      default:
        return false
    }
  }

  /**
   * Get selected text from input
   */
  static getSelectedText(element: HTMLElement): string {
    const inputType = this.getInputType(element)

    switch (inputType) {
      case 'input':
      case 'textarea': {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        if (
          inputElement.selectionStart !== null &&
          inputElement.selectionEnd !== null &&
          inputElement.selectionStart !== inputElement.selectionEnd
        ) {
          return inputElement.value.substring(
            inputElement.selectionStart,
            inputElement.selectionEnd
          )
        }
        return ''
      }

      case 'contenteditable': {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          return ''
        }
        return selection.toString()
      }

      default:
        return ''
    }
  }

  /**
   * Replace selected text in input
   */
  static replaceSelectedText(element: HTMLElement, newText: string): boolean {
    const inputType = this.getInputType(element)

    try {
      switch (inputType) {
        case 'input':
        case 'textarea': {
          const inputElement = element as HTMLInputElement | HTMLTextAreaElement
          if (inputElement.selectionStart === null || inputElement.selectionEnd === null) {
            return false
          }

          const start = inputElement.selectionStart
          const end = inputElement.selectionEnd
          const value = inputElement.value

          // Replace selected text
          inputElement.value = value.substring(0, start) + newText + value.substring(end)

          // Set cursor after inserted text
          const newPosition = start + newText.length
          inputElement.selectionStart = newPosition
          inputElement.selectionEnd = newPosition

          this.dispatchInputEvents(element)
          return true
        }

        case 'contenteditable': {
          const selection = window.getSelection()
          if (!selection || selection.rangeCount === 0) {
            return false
          }

          const range = selection.getRangeAt(0)
          range.deleteContents()

          // Insert new text
          const textNode = document.createTextNode(newText)
          range.insertNode(textNode)

          // Move cursor after inserted text
          range.setStartAfter(textNode)
          range.setEndAfter(textNode)
          selection.removeAllRanges()
          selection.addRange(range)

          this.dispatchInputEvents(element)
          return true
        }

        default:
          return false
      }
    } catch (error) {
      console.error('[InputHandler] Failed to replace selected text:', error)
      return false
    }
  }

  /**
   * Select all text in input
   */
  static selectAll(element: HTMLElement): boolean {
    const inputType = this.getInputType(element)

    try {
      switch (inputType) {
        case 'input':
        case 'textarea': {
          const inputElement = element as HTMLInputElement | HTMLTextAreaElement
          inputElement.select()
          return true
        }

        case 'contenteditable': {
          const range = document.createRange()
          range.selectNodeContents(element)
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
            return true
          }
          return false
        }

        default:
          return false
      }
    } catch (error) {
      console.error('[InputHandler] Failed to select all:', error)
      return false
    }
  }

  /**
   * Get the currently focused input element
   */
  static getFocusedInput(): HTMLElement | null {
    const activeElement = document.activeElement as HTMLElement

    if (this.isEditableElement(activeElement)) {
      return activeElement
    }

    return null
  }

  /**
   * Dispatch input events to notify frameworks of changes
   */
  private static dispatchInputEvents(element: HTMLElement): void {
    // Dispatch input event (for Vue, React, etc.)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    // Dispatch change event
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }
}
