/**
 * Version comparison utilities for extension update detection.
 */

/**
 * Returns true if the version is a Major or Minor release (patch == 0).
 * e.g. 1.0.0, 1.3.0 → true ; 1.3.1 → false
 */
export function isMajorOrMinorRelease(version: string): boolean {
  const parts = version.split('.').map(Number)
  const patch = parts[2] ?? 0
  return patch === 0
}

/**
 * Returns true if the major or minor number differs between two versions.
 * Used to detect a significant update even when the current release is a patch.
 * e.g. storedVersion=1.3.0, currentVersion=1.5.1 → true
 */
export function hasMajorOrMinorDiff(
  storedVersion: string | undefined,
  currentVersion: string,
): boolean {
  if (!storedVersion) return true // No stored version — treat as diff

  const stored = storedVersion.split('.').map(Number)
  const current = currentVersion.split('.').map(Number)

  return (stored[0] ?? 0) !== (current[0] ?? 0) || (stored[1] ?? 0) !== (current[1] ?? 0)
}
