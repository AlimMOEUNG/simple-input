/**
 * Global type augmentations for browser-specific APIs not covered by standard @types packages.
 */

// Firefox exposes a `browser` global that mirrors Chrome's `chrome` namespace.
// It is not present in Chrome, so it must be declared as optional.
declare global {
  const browser: typeof chrome | undefined
}

export {}

