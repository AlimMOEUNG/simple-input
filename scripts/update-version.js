#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

/**
 * Synchronizes version from Chrome manifest (source of truth) to:
 * - Firefox manifest
 * - changelog.ts getCurrentVersion()
 */
function syncVersion() {
  const chromeManifestPath = join(rootDir, 'manifests/manifest.chrome.json')
  const firefoxManifestPath = join(rootDir, 'manifests/manifest.firefox.json')
  const changelogPath = join(rootDir, 'src/data/changelog.ts')

  try {
    // Read version from Chrome manifest (source of truth)
    const chromeManifestContent = readFileSync(chromeManifestPath, 'utf-8')
    const chromeManifest = JSON.parse(chromeManifestContent)
    const version = chromeManifest.version

    if (!version) {
      console.error('Error: No version found in Chrome manifest')
      process.exit(1)
    }

    console.log(`[UPDATE-VERSION] Source of truth: Chrome manifest v${version}`)

    // 1. Update Firefox manifest
    const firefoxManifestContent = readFileSync(firefoxManifestPath, 'utf-8')
    const firefoxManifest = JSON.parse(firefoxManifestContent)

    if (firefoxManifest.version !== version) {
      firefoxManifest.version = version
      writeFileSync(
        firefoxManifestPath,
        JSON.stringify(firefoxManifest, null, 2) + '\n',
        'utf-8'
      )
      console.log(`[UPDATE-VERSION] ✓ Synced Firefox manifest to v${version}`)
    } else {
      console.log(`[UPDATE-VERSION] ✓ Firefox manifest already at v${version}`)
    }

    // 2. Update changelog.ts getCurrentVersion()
    let changelogContent = readFileSync(changelogPath, 'utf-8')

    const regex = /export function getCurrentVersion\(\): string \{\s*return ['"][\d.]+['"] \/\/ This should match manifest\.json version\s*\}/

    if (!regex.test(changelogContent)) {
      console.error('Error: Could not find getCurrentVersion() function in changelog.ts')
      process.exit(1)
    }

    const updatedChangelog = changelogContent.replace(
      regex,
      `export function getCurrentVersion(): string {\n  return '${version}' // This should match manifest.json version\n}`
    )

    if (updatedChangelog !== changelogContent) {
      writeFileSync(changelogPath, updatedChangelog, 'utf-8')
      console.log(`[UPDATE-VERSION] ✓ Synced changelog.ts getCurrentVersion() to v${version}`)
    } else {
      console.log(`[UPDATE-VERSION] ✓ changelog.ts getCurrentVersion() already at v${version}`)
    }

    console.log(`[UPDATE-VERSION] All versions synchronized to v${version}`)
  } catch (error) {
    console.error(`Error synchronizing version: ${error.message}`)
    process.exit(1)
  }
}

syncVersion()
