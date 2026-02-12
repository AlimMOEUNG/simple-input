import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Global chrome API mock — must be set up before any module imports
// ---------------------------------------------------------------------------

// In-memory store used by chrome.storage.sync mock
const _store: Record<string, unknown> = {}

// Registered onChanged listeners
const _onChangedListeners: Array<(changes: Record<string, unknown>, area: string) => void> = []

;(globalThis as unknown as Record<string, unknown>).chrome = {
  storage: {
    sync: {
      // Returns only the requested keys from the in-memory store
      get: vi.fn(async (keys: string | string[]) => {
        const result: Record<string, unknown> = {}
        const keyList = Array.isArray(keys) ? keys : [keys]
        keyList.forEach((k) => {
          if (_store[k] !== undefined) result[k] = _store[k]
        })
        return result
      }),
      // Merges data into the in-memory store
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(_store, data)
      }),
      // Removes keys from the in-memory store
      remove: vi.fn(async (key: string | string[]) => {
        const keys = Array.isArray(key) ? key : [key]
        keys.forEach((k) => delete _store[k])
      }),
    },
    onChanged: {
      addListener: vi.fn((cb: (changes: Record<string, unknown>, area: string) => void) => {
        _onChangedListeners.push(cb)
      }),
    },
  },
}
