import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TARGET_BROWSER = 'firefox'
const OUT_DIR = 'dist-firefox'
const distPath = path.join(__dirname, '..', OUT_DIR)
const outputDir = path.join(__dirname, '../')
const manifestPath = path.join(__dirname, '../manifests/manifest.firefox.json')
const packageJsonPath = path.join(__dirname, '../package.json')

// Check if we're building in dev mode (from package.json script)
const isDevMode = process.argv.includes('--dev')
const buildMode = isDevMode ? 'development' : 'production'

console.log(`🔨 Building Firefox extension (${buildMode} mode)...`)

try {
  // Run Vite build with environment variables
  const buildCommand = isDevMode
    ? `TARGET_BROWSER=${TARGET_BROWSER} OUT_DIR=${OUT_DIR} vite build --mode development`
    : `TARGET_BROWSER=${TARGET_BROWSER} OUT_DIR=${OUT_DIR} vite build --mode production`

  execSync(buildCommand, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      TARGET_BROWSER,
      OUT_DIR
    }
  })

  console.log('\n✅ Firefox build completed!')

  // Read version from manifest and sync package.json
  let version = '1.0.0'
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    version = manifest.version || version

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.version !== version) {
        packageJson.version = version
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
        console.log(`✅ Synchronized package.json version to manifest: ${version}`)
      }
    }
  } catch {
    console.warn('⚠️ Could not read manifest version, using default 1.0.0')
  }

  // Delete old Firefox zips (production or dev)
  const zipPattern = isDevMode
    ? /^extension-boilerplate-firefox-dev-v.*\.zip$/
    : /^extension-boilerplate-firefox-v.*\.zip$/

  fs.readdirSync(outputDir)
    .filter((file) => zipPattern.test(file))
    .forEach((file) => {
      try {
        fs.unlinkSync(path.join(outputDir, file))
        console.log(`🗑️ Deleted old zip: ${file}`)
      } catch (e) {
        console.warn(`⚠️ Could not delete ${file}:`, e)
      }
    })

  // Create new zip (both dev and production)
  const zipName = isDevMode
    ? `extension-boilerplate-firefox-dev-v${version}.zip`
    : `extension-boilerplate-firefox-v${version}.zip`
  const zipPath = path.join(outputDir, zipName)

  console.log(`\n📦 Creating ${zipName}...`)

  execSync(`zip -r "${zipPath}" .`, { cwd: distPath, stdio: 'inherit' })

  console.log(`\n✅ Created ${zipName} successfully!`)
  console.log(`📂 Build output: ${OUT_DIR}/`)
  console.log(`📦 ZIP file: ${zipName}`)

  // Create source code ZIP (production only, required for AMO submission)
  if (!isDevMode) {
    console.log(`\n📦 Creating source code ZIP for AMO...`)

    const sourceZipName = `subtitle-downloader-source-v${version}.zip`
    const sourceZipPath = path.join(outputDir, sourceZipName)

    // Delete all old source ZIPs
    const sourceZipPattern = /^subtitle-downloader-source-v.*\.zip$/
    fs.readdirSync(outputDir)
      .filter((file) => sourceZipPattern.test(file))
      .forEach((file) => {
        try {
          fs.unlinkSync(path.join(outputDir, file))
          console.log(`🗑️ Deleted old source ZIP: ${file}`)
        } catch (e) {
          console.warn(`⚠️ Could not delete ${file}:`, e)
        }
      })

    // Create source ZIP (exclude node_modules, dist folders, ZIPs, .git, .claude, logs, public)
    execSync(`zip -r "${sourceZipPath}" . \\
      -x "node_modules/*" \\
      -x "dist-chrome/*" \\
      -x "dist-firefox/*" \\
      -x "dist/*" \\
      -x "*.zip" \\
      -x ".git/*" \\
      -x ".claude/*" \\
      -x "*.log" \\
      -x "public/*"`,
      {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      }
    )

    console.log(`\n✅ Created ${sourceZipName} successfully!`)
    console.log(`📦 Source ZIP file: ${sourceZipName}`)
  }

  if (isDevMode) {
    console.log(`\n💡 For Firefox (Flatpak/Snap): Use "Load Temporary Add-on" with the ZIP file`)
    console.log(`   File: ${zipName}`)
  } else {
    console.log(`\n🚀 Ready to upload to Firefox Add-ons (AMO)!`)
    console.log(`📦 Upload extension: ${zipName}`)
    console.log(`📦 Upload source code: subtitle-downloader-source-v${version}.zip`)
    console.log(`\n⚠️ Note: You may need to update the extension ID in manifest.firefox.json`)
    console.log(`   Current ID: subtitle-downloader@subtiltee.com`)
    console.log(`   See: https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/`)
  }

} catch (e) {
  console.error('❌ Error building Firefox extension:', e)
  process.exit(1)
}
