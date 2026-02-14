/**
 * Browser API polyfill for cross-browser compatibility (Chrome & Firefox)
 * Unifies chrome.* and browser.* namespaces
 */

// Use browser namespace if available (Firefox), otherwise use chrome namespace (Chrome)
export const browserAPI =
  typeof browser !== 'undefined' && browser?.runtime ? browser : chrome

export default browserAPI
