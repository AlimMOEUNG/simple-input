/**
 * Browser API polyfill for cross-browser compatibility (Chrome & Firefox)
 * Unifies chrome.* and browser.* namespaces
 */

// Use browser namespace if available (Firefox), otherwise use chrome namespace (Chrome)
export const browserAPI =
  typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.runtime
    ? (globalThis as any).browser
    : chrome

export default browserAPI
