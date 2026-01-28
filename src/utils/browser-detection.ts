/**
 * Browser detection utilities
 */

export function isFirefox(): boolean {
  return (
    typeof (globalThis as any).browser !== 'undefined' &&
    (globalThis as any).browser.runtime !== undefined
  )
}

export function isChrome(): boolean {
  return typeof chrome !== 'undefined' && chrome.runtime !== undefined && !isFirefox()
}

export function getBrowserName(): 'chrome' | 'firefox' | 'unknown' {
  if (isFirefox()) return 'firefox'
  if (isChrome()) return 'chrome'
  return 'unknown'
}
