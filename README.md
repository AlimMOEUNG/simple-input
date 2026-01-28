# Simple Input Translator

A Chrome/Firefox extension that translates text in inputs and text selections using a keyboard shortcut (Alt+T by default).

## Features

- **Keyboard Shortcut Translation**: Press Alt+T to translate selected text or input content
- **Multiple Translation Providers**:
  - Chrome Built-in AI (Gemini Nano) - Free, local, and private
  - DeepL API - High-quality translations
  - Google Gemini API - AI-powered translations
- **Configurable Source Language**: Auto-detect or select a specific source language
- **Custom Keyboard Shortcuts**: Modify the default Alt+T to your preference
- **Works Everywhere**: Translates on any website, in any input field or text selection

## How to Use

1. **Install the extension** and configure your preferred translation provider in the popup
2. **Select text** on any webpage and press your keyboard shortcut (default: Alt+T)
3. **Focus on an input field** and press the keyboard shortcut to translate the entire content
4. The translation replaces the original text automatically

## Installation

### For Development

1. Clone or download this repository
2. Install dependencies:
   ```bash
   cd simple-input-translator
   npm install
   ```

### Build for Chrome

```bash
npm run build:chrome        # Production build
npm run build:chrome:dev    # Development build
```

The extension will be built to `dist-chrome/`

### Build for Firefox

```bash
npm run build:firefox       # Production build
npm run build:firefox:dev   # Development build
```

The extension will be built to `dist-firefox/`

### Load the Extension

**Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist-chrome/` folder

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `dist-firefox/` folder

## Configuration

### Translation Providers

#### Chrome Built-in AI (Free)
- Requires Chrome 143+ (Canary/Dev channel)
- Completely local and private
- No API key needed
- May require downloading translation models on first use

#### DeepL API
1. Get your API key from [deepl.com/pro-api](https://www.deepl.com/pro-api)
2. Open the extension popup
3. Select "DeepL API" as provider
4. Enter your API key and click "Validate & Save"

#### Google Gemini API
1. Get your API key from [ai.google.dev](https://ai.google.dev)
2. Open the extension popup
3. Select "Google Gemini API" as provider
4. Enter your API key and click "Validate & Save"

### Keyboard Shortcuts

1. Open the extension popup
2. Click on the "Keyboard Shortcut" field
3. Press your desired key combination (e.g., Ctrl+Shift+T, Alt+Q)
4. The shortcut will be saved automatically

## Architecture

This extension is built using:

- **Vue 3** with Composition API for the popup UI
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Manifest V3** for modern browser extension standards

### Project Structure

```
src/
├── background/
│   └── utils/
│       ├── deeplApi.ts          # DeepL API utilities
│       └── geminiApi.ts         # Gemini API utilities
├── core/
│   ├── handlers/
│   │   └── KeyboardShortcutHandler.ts  # Keyboard shortcut logic
│   ├── storage/
│   │   └── SettingsManager.ts   # Settings management
│   └── translation/
│       └── TranslationEngine.ts # Translation provider abstraction
├── popup/
│   └── Popup.vue                # Extension popup UI
├── background.ts                # Background service worker
└── content-script.ts            # Content script (injected into pages)
```

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Code Formatting

```bash
npm run format
```

## License

MIT License

## Credits

Built with:
- [Vue 3](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- Chrome Built-in AI APIs
- DeepL API
- Google Gemini API
