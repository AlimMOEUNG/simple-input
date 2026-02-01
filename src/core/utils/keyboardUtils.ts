/**
 * Keyboard utility functions for handling cross-platform keyboard shortcuts
 *
 * IMPORTANT: Windows NumLock behavior
 * - NumLock ON + Numpad1 → event.key="1", event.code="Numpad1"
 * - NumLock ON + Shift+Numpad1 → event.key="End" (!), event.code="Numpad1"
 * - NumLock OFF + Numpad1 → event.key="End", event.code="Numpad1"
 *
 * We ALWAYS use event.code to normalize numpad keys to their digit equivalents
 */

/**
 * Normalizes a keyboard key from event.code or event.key
 * Handles Digit keys (Digit0-9), Numpad keys (Numpad0-9), and regular keys
 *
 * @param event - The keyboard event
 * @returns The normalized key string (e.g., "1", "A", "ArrowLeft")
 */
export function normalizeKeyFromEvent(event: KeyboardEvent): string {
  // Handle main keyboard digits (Digit0-9)
  if (event.code.startsWith('Digit')) {
    return event.code.replace('Digit', '')
  }

  // Handle numpad digits (Numpad0-9)
  // CRITICAL: Always use event.code for numpad to avoid Windows Shift+NumLock issues
  if (event.code.startsWith('Numpad')) {
    return event.code.replace('Numpad', '')
  }

  // For other keys, use event.key
  // Single characters are uppercased for consistency
  const key = event.key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    return key.length === 1 ? key.toUpperCase() : key
  }

  return ''
}

/**
 * Builds a keyboard shortcut string from a KeyboardEvent
 * Formats as: "Ctrl+Alt+Shift+Meta+Key"
 *
 * Supports:
 * - Modifier only: "Alt", "Ctrl"
 * - Modifier + key: "Alt+T", "Ctrl+1"
 * - Multiple modifiers + key: "Ctrl+Alt+T"
 *
 * DOES NOT support single key without modifier (e.g., "T" or "1" alone)
 *
 * @param event - The keyboard event
 * @returns Formatted shortcut string or null if invalid
 *
 * @example
 * buildShortcutFromEvent(event) // "Alt" (just Alt modifier) - VALID
 * buildShortcutFromEvent(event) // "Shift+1" - VALID
 * buildShortcutFromEvent(event) // "Ctrl+Alt+A" - VALID
 * buildShortcutFromEvent(event) // null (just "T" key alone) - INVALID
 */
export function buildShortcutFromEvent(event: KeyboardEvent): string | null {
  let shortcut = ''
  let hasModifier = false

  // Add modifiers in consistent order
  if (event.ctrlKey) {
    shortcut += 'Ctrl+'
    hasModifier = true
  }
  if (event.altKey) {
    shortcut += 'Alt+'
    hasModifier = true
  }
  if (event.shiftKey) {
    shortcut += 'Shift+'
    hasModifier = true
  }
  if (event.metaKey) {
    shortcut += 'Meta+'
    hasModifier = true
  }

  // Get the normalized key
  const key = normalizeKeyFromEvent(event)

  if (key) {
    // REJECT single key without modifier
    if (!hasModifier) {
      return null
    }
    shortcut += key
  } else if (shortcut.endsWith('+')) {
    // Remove trailing '+' if only modifiers were pressed
    shortcut = shortcut.slice(0, -1)
  }

  // Accept only if has modifier (modifier only OR modifier + key)
  if (shortcut && !shortcut.endsWith('+') && hasModifier) {
    return shortcut
  }

  return null
}

/**
 * Formats a keyboard shortcut string from a KeyboardEvent
 * Similar to buildShortcutFromEvent but always returns a string (never null)
 * Used for immediate shortcut detection/comparison
 *
 * @param event - The keyboard event
 * @returns Formatted shortcut string
 */
export function formatShortcutFromEvent(event: KeyboardEvent): string {
  let shortcut = ''

  // Add modifiers in consistent order
  if (event.ctrlKey) shortcut += 'Ctrl+'
  if (event.altKey) shortcut += 'Alt+'
  if (event.shiftKey) shortcut += 'Shift+'
  if (event.metaKey) shortcut += 'Meta+'

  // Get the normalized key
  const key = normalizeKeyFromEvent(event)

  if (key) {
    shortcut += key
  }

  return shortcut
}

/**
 * Normalizes a shortcut string to standard format
 * Cleans up and validates shortcut format
 *
 * Supports:
 * - Modifier only: "alt" → "Alt", "ctrl" → "Ctrl"
 * - Modifier + key: "ctrl+a" → "Ctrl+A"
 * - Modifier + 2 keys: "alt+t+1" → "Alt+1+T" (sorted for permutation handling)
 *
 * DOES NOT support:
 * - Single key without modifier (e.g., "t" or "1" alone)
 * - More than 2 keys after modifiers
 *
 * Keys are sorted alphabetically to handle permutations:
 * - "Alt+T+1" → "Alt+1+T"
 * - "Alt+1+T" → "Alt+1+T" (same result)
 *
 * @param shortcut - The shortcut string to normalize
 * @returns Normalized shortcut string in format "Ctrl+Alt+Shift+Meta+Key1(+Key2)" or empty if invalid
 *
 * @example
 * normalizeShortcut("alt") // "Alt"
 * normalizeShortcut("ctrl+a") // "Ctrl+A"
 * normalizeShortcut("shift + 1") // "Shift+1"
 * normalizeShortcut("alt+t+1") // "Alt+1+T" (sorted)
 * normalizeShortcut("alt+1+t") // "Alt+1+T" (sorted)
 * normalizeShortcut("alt+ctrl+t") // "Alt+Ctrl+T"
 * normalizeShortcut("t") // "" (invalid - no modifier)
 * normalizeShortcut("alt+a+b+c") // "" (invalid - too many keys)
 */
export function normalizeShortcut(shortcut: string): string {
  if (!shortcut || !shortcut.trim()) {
    return ''
  }

  const tokens = shortcut
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean)

  if (!tokens.length) {
    return ''
  }

  // Separate modifiers and keys
  const modifiers: string[] = []
  const keys: string[] = []

  tokens.forEach((token) => {
    const lower = token.toLowerCase()
    if (lower === 'ctrl' || lower === 'control') {
      modifiers.push('Ctrl')
    } else if (lower === 'alt') {
      modifiers.push('Alt')
    } else if (lower === 'shift') {
      modifiers.push('Shift')
    } else if (lower === 'meta' || lower === 'cmd' || lower === 'command' || lower === 'super') {
      modifiers.push('Meta')
    } else {
      // All non-modifier tokens are keys (can be multiple for sequences)
      keys.push(token.length === 1 ? token.toUpperCase() : token)
    }
  })

  // REJECT if no modifiers (key-only shortcut not allowed)
  if (modifiers.length === 0 && keys.length > 0) {
    return ''
  }

  // REJECT if more than 2 keys (too complex)
  if (keys.length > 2) {
    return ''
  }

  // Sort keys alphabetically to handle permutations (Alt+T+1 === Alt+1+T)
  keys.sort()

  // Build shortcut in standard order: Ctrl+Alt+Shift+Meta+Key1(+Key2)
  const result: string[] = []
  if (modifiers.includes('Ctrl')) result.push('Ctrl')
  if (modifiers.includes('Alt')) result.push('Alt')
  if (modifiers.includes('Shift')) result.push('Shift')
  if (modifiers.includes('Meta')) result.push('Meta')
  result.push(...keys)

  return result.join('+')
}

/**
 * Keyboard sequence detector for multi-key shortcuts
 * Supports sequences like "Alt+T+1" (Alt held, then T, then 1)
 * Maximum 2 keys after modifiers
 * Keys are sorted to handle permutations (Alt+T+1 === Alt+1+T)
 */
export class KeyboardSequenceDetector {
  private sequence: string[] = []
  private modifiersPressed: string[] = []
  private lastKeyTime = 0
  private readonly sequenceTimeout = 1000 // 1 second timeout between keys
  private readonly maxKeys = 2 // Maximum 2 keys after modifiers

  /**
   * Process a keydown event and build sequence
   * @param event - The keyboard event
   * @returns Complete shortcut string if sequence is valid, null otherwise
   */
  processKeyDown(event: KeyboardEvent): string | null {
    const now = Date.now()

    // Reset sequence if timeout exceeded
    if (now - this.lastKeyTime > this.sequenceTimeout) {
      this.reset()
    }

    this.lastKeyTime = now

    // Track current modifiers
    this.modifiersPressed = []
    if (event.ctrlKey) this.modifiersPressed.push('Ctrl')
    if (event.altKey) this.modifiersPressed.push('Alt')
    if (event.shiftKey) this.modifiersPressed.push('Shift')
    if (event.metaKey) this.modifiersPressed.push('Meta')

    // Get the key (ignore modifier keys themselves)
    const key = normalizeKeyFromEvent(event)
    if (!key) {
      // If only modifiers are pressed, return modifier-only shortcut
      if (this.modifiersPressed.length > 0 && this.sequence.length === 0) {
        return this.modifiersPressed.join('+')
      }
      return null
    }

    // Add key to sequence if not already present
    if (!this.sequence.includes(key)) {
      // Reject if already at max keys
      if (this.sequence.length >= this.maxKeys) {
        return null
      }
      this.sequence.push(key)
    }

    // Sort sequence keys alphabetically to handle permutations
    const sortedSequence = [...this.sequence].sort()

    // Build complete shortcut: Modifiers + Sorted Sequence
    const parts = [...this.modifiersPressed, ...sortedSequence]
    return parts.join('+')
  }

  /**
   * Process a keyup event - reset if all modifiers released
   * @param event - The keyboard event
   */
  processKeyUp(event: KeyboardEvent): void {
    // If no modifiers are pressed anymore, reset sequence
    if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
      this.reset()
    }
  }

  /**
   * Reset the sequence detector
   */
  reset(): void {
    this.sequence = []
    this.modifiersPressed = []
    this.lastKeyTime = 0
  }

  /**
   * Get current sequence length
   */
  getSequenceLength(): number {
    return this.sequence.length
  }
}
