import { describe, it, expect } from 'vitest'
import {
  TransformationEngine,
  applyCustomCharMap,
} from '../src/core/transformation/TransformationEngine'

// ---------------------------------------------------------------------------
// TransformationEngine — pure deterministic functions, no external deps
// ---------------------------------------------------------------------------

describe('TransformationEngine', () => {
  const engine = new TransformationEngine()

  // -------------------------------------------------------------------------
  // transform()
  // -------------------------------------------------------------------------
  describe('transform()', () => {
    it('returns empty string unchanged', () => {
      expect(engine.transform('', 'bold')).toBe('')
    })

    it('applies ROT13 correctly (Hello → Uryyb)', () => {
      expect(engine.transform('Hello', 'rot13')).toBe('Uryyb')
    })

    it('ROT13 is self-inverse — applying twice restores the original', () => {
      const original = 'The quick brown fox'
      const rotated = engine.transform(original, 'rot13')
      expect(engine.transform(rotated, 'rot13')).toBe(original)
    })

    it('applies strikethrough by appending U+0336 after every character', () => {
      // U+0336 = Combining Long Stroke Overlay
      expect(engine.transform('ab', 'strikethrough')).toBe('a\u0336b\u0336')
    })

    it('applies bold by mapping to Mathematical Bold Unicode block (U+1D400)', () => {
      // Bold 'A' = U+1D400, Bold 'B' = U+1D401
      expect(engine.transform('A', 'bold')).toBe(String.fromCodePoint(0x1d400))
      expect(engine.transform('B', 'bold')).toBe(String.fromCodePoint(0x1d401))
    })

    it('applies mirror by reversing the string', () => {
      expect(engine.transform('abc', 'mirror')).toBe('cba')
      expect(engine.transform('Hello!', 'mirror')).toBe('!olleH')
    })

    it('applies leet speak (e→3, a→4, t→7, o→0)', () => {
      // l=| e=3 e=3 t=7
      expect(engine.transform('leet', 'leet')).toBe('|337')
      // a=4
      expect(engine.transform('a', 'leet')).toBe('4')
    })

    it('passes through unknown style and returns text unchanged', () => {
      // TypeScript prevents this at compile time — test the runtime fallback
      const result = engine.transform('hello', 'nonexistent' as never)
      expect(result).toBe('hello')
    })
  })

  // -------------------------------------------------------------------------
  // getStyleDisplayName()
  // -------------------------------------------------------------------------
  describe('getStyleDisplayName()', () => {
    it('returns the human-readable name for known styles', () => {
      expect(engine.getStyleDisplayName('bold')).toBe('Bold')
      expect(engine.getStyleDisplayName('rot13')).toBe('ROT13')
      expect(engine.getStyleDisplayName('zalgo')).toBe('Zalgo')
      expect(engine.getStyleDisplayName('upside-down')).toBe('Upside Down')
    })
  })

  // -------------------------------------------------------------------------
  // getAllStyles()
  // -------------------------------------------------------------------------
  describe('getAllStyles()', () => {
    it('returns all 20 built-in transformation styles', () => {
      expect(engine.getAllStyles()).toHaveLength(20)
    })

    it('each style entry has value, label and a non-empty example', () => {
      engine.getAllStyles().forEach((s) => {
        expect(s).toHaveProperty('value')
        expect(s).toHaveProperty('label')
        expect(s).toHaveProperty('example')
        expect(s.example.length).toBeGreaterThan(0)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// applyCustomCharMap — character-level mapping utility
// ---------------------------------------------------------------------------

describe('applyCustomCharMap', () => {
  it('applies custom character mapping', () => {
    expect(applyCustomCharMap('hello', { h: 'H', e: 'E' })).toBe('HEllo')
  })

  it('leaves unmapped characters unchanged', () => {
    expect(applyCustomCharMap('abc', { a: '@' })).toBe('@bc')
  })

  it('returns an empty string unchanged', () => {
    expect(applyCustomCharMap('', { a: 'b' })).toBe('')
  })

  it('returns original string when char map is empty', () => {
    expect(applyCustomCharMap('hello', {})).toBe('hello')
  })

  it('supports multi-byte emoji as map values', () => {
    expect(applyCustomCharMap('AB', { A: '😀', B: '🎉' })).toBe('😀🎉')
  })
})
