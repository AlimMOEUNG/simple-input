import { describe, it, expect } from 'vitest'
import { normalizeShortcut } from '../src/core/utils/keyboardUtils'

// ---------------------------------------------------------------------------
// normalizeShortcut() — pure keyboard shortcut validation & normalization
// ---------------------------------------------------------------------------

describe('normalizeShortcut()', () => {
  // -------------------------------------------------------------------------
  // Valid shortcuts
  // -------------------------------------------------------------------------
  describe('valid shortcuts', () => {
    it('normalizes modifier + single letter (lowercase input)', () => {
      expect(normalizeShortcut('ctrl+a')).toBe('Ctrl+A')
      expect(normalizeShortcut('alt+t')).toBe('Alt+T')
      expect(normalizeShortcut('shift+z')).toBe('Shift+Z')
    })

    it('normalizes modifier + digit', () => {
      expect(normalizeShortcut('shift+1')).toBe('Shift+1')
      expect(normalizeShortcut('alt+2')).toBe('Alt+2')
    })

    it('normalizes multiple modifiers in standard order (Ctrl > Alt > Shift > Meta)', () => {
      expect(normalizeShortcut('alt+ctrl+t')).toBe('Ctrl+Alt+T')
      expect(normalizeShortcut('shift+ctrl+alt+a')).toBe('Ctrl+Alt+Shift+A')
    })

    it('normalizes multi-key sequences and sorts keys alphabetically', () => {
      // Alt+T+1 and Alt+1+T must be identical after normalization
      expect(normalizeShortcut('alt+t+1')).toBe('Alt+1+T')
      expect(normalizeShortcut('alt+1+t')).toBe('Alt+1+T')
    })

    it('accepts "control" and "cmd" as aliases for Ctrl / Meta', () => {
      expect(normalizeShortcut('control+a')).toBe('Ctrl+A')
      expect(normalizeShortcut('cmd+a')).toBe('Meta+A')
    })

    it('strips surrounding whitespace from each token', () => {
      expect(normalizeShortcut('shift + 1')).toBe('Shift+1')
    })
  })

  // -------------------------------------------------------------------------
  // Invalid shortcuts — must return ''
  // -------------------------------------------------------------------------
  describe('invalid shortcuts (return empty string)', () => {
    it('rejects modifier-only shortcuts (no key)', () => {
      expect(normalizeShortcut('alt')).toBe('')
      expect(normalizeShortcut('ctrl')).toBe('')
      expect(normalizeShortcut('shift')).toBe('')
    })

    it('rejects key-only shortcuts (no modifier)', () => {
      expect(normalizeShortcut('t')).toBe('')
      expect(normalizeShortcut('1')).toBe('')
    })

    it('rejects shortcuts with more than 2 non-modifier keys', () => {
      expect(normalizeShortcut('alt+a+b+c')).toBe('')
    })

    it('rejects empty or blank input', () => {
      expect(normalizeShortcut('')).toBe('')
      expect(normalizeShortcut('   ')).toBe('')
    })
  })
})
