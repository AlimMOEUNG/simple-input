import type { TransformationStyle } from '@/types/common'
import { TransformationEngine } from './TransformationEngine'

/**
 * Built-in styles whose char-level substitution can be pre-computed.
 * Excluded: mirror (string reversal), zalgo / zalgo-lite (random diacritics), drunk (random case).
 */
export const EXPORTABLE_STYLES: TransformationStyle[] = [
  'bold',
  'italic',
  'bold-italic',
  'script',
  'circled',
  'squared',
  'monospace',
  'double-struck',
  'fullwidth',
  'smallcaps',
  'strikethrough',
  'upside-down',
  'morse',
  'leet',
  'rot13',
  'braille',
]

const engine = new TransformationEngine()

// Printable ASCII: space (0x20) through tilde (0x7E)
const ASCII_START = 0x20
const ASCII_END = 0x7e

/**
 * Generate a char→char mapping for a given built-in style by running every
 * printable ASCII character through the engine and recording substitutions.
 *
 * Note on Morse: each letter maps to its multi-char Morse code (e.g. 'a' → '.-').
 * Space is intentionally skipped so the word-separator logic from applyMorse
 * is not baked into the static map.
 */
export function generateCharMapForStyle(style: TransformationStyle): Record<string, string> {
  const charMap: Record<string, string> = {}

  for (let code = ASCII_START; code <= ASCII_END; code++) {
    const char = String.fromCharCode(code)

    // Skip space for morse: the word-separator is handled by applyMorse itself
    if (char === ' ' && style === 'morse') continue

    const transformed = engine.transform(char, style)
    if (transformed !== char) {
      charMap[char] = transformed
    }
  }

  return charMap
}
