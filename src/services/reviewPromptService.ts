/**
 * Generic Review Prompt Service for Chrome Web Store / Firefox Add-ons
 *
 * Usage:
 * 1. Call trackUserAction() whenever a significant user action occurs
 * 2. Implement getReviewUrl() to return your store URL
 * 3. Implement shouldPromptForReview() for custom logic (optional)
 */

interface ReviewPromptState {
  actionCount: number
  hasReviewed: boolean
  lastPromptDate: number | null
  hasRejected: boolean
}

const STORAGE_KEY = 'reviewPromptState'
const DEFAULT_MIN_ACTIONS = 5 // Default minimum actions before prompting
const PROMPT_COOLDOWN_DAYS = 30 // Days to wait before prompting again if user dismisses

/**
 * Get the current review prompt state from storage
 */
export async function getReviewPromptState(): Promise<ReviewPromptState> {
  const result = await chrome.storage.sync.get(STORAGE_KEY)
  return (
    result[STORAGE_KEY] || {
      actionCount: 0,
      hasReviewed: false,
      lastPromptDate: null,
      hasRejected: false,
    }
  )
}

/**
 * Save review prompt state to storage
 */
export async function saveReviewPromptState(state: ReviewPromptState): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: state })
}

/**
 * Track a significant user action (e.g., download, save, export)
 * Call this function whenever the user performs a meaningful action
 *
 * @example
 * // In your code after a successful user action:
 * await trackUserAction()
 */
export async function trackUserAction(): Promise<void> {
  const state = await getReviewPromptState()
  state.actionCount++
  await saveReviewPromptState(state)
}

/**
 * Check if we should prompt the user for a review
 * Override this function for custom logic
 *
 * @param minActions Minimum number of actions before prompting (default: 5)
 * @returns true if should prompt
 */
export async function shouldPromptForReview(minActions = DEFAULT_MIN_ACTIONS): Promise<boolean> {
  const state = await getReviewPromptState()

  // Don't prompt if already reviewed
  if (state.hasReviewed) return false

  // Don't prompt if user rejected recently
  if (state.hasRejected && state.lastPromptDate) {
    const daysSinceLastPrompt = (Date.now() - state.lastPromptDate) / (1000 * 60 * 60 * 24)
    if (daysSinceLastPrompt < PROMPT_COOLDOWN_DAYS) return false
  }

  // Prompt if minimum actions reached
  return state.actionCount >= minActions
}

/**
 * Mark that the user has reviewed the extension
 */
export async function markAsReviewed(): Promise<void> {
  const state = await getReviewPromptState()
  state.hasReviewed = true
  await saveReviewPromptState(state)
}

/**
 * Mark that the user rejected the review prompt
 */
export async function markAsRejected(): Promise<void> {
  const state = await getReviewPromptState()
  state.hasRejected = true
  state.lastPromptDate = Date.now()
  await saveReviewPromptState(state)
}

/**
 * Get the review URL for the current browser
 * MUST BE IMPLEMENTED: Replace with your actual store URLs
 *
 * @returns Review URL for Chrome Web Store or Firefox Add-ons
 */
export function getReviewUrl(): string {
  const isFirefox =
    typeof (globalThis as any).browser !== 'undefined' &&
    (globalThis as any).browser.runtime !== undefined

  if (isFirefox) {
    // TODO: Replace with your Firefox Add-on URL
    return 'https://addons.mozilla.org/firefox/addon/YOUR-ADDON-ID/reviews/'
  } else {
    // TODO: Replace with your Chrome Web Store URL
    return 'https://chrome.google.com/webstore/detail/YOUR-EXTENSION-ID/reviews'
  }
}

/**
 * Reset review prompt state (useful for testing)
 */
export async function resetReviewPromptState(): Promise<void> {
  await chrome.storage.sync.remove(STORAGE_KEY)
}
