/**
 * Shadow DOM utility for CSS isolation
 * Prevents page styles from affecting extension UI
 */

export interface ShadowDOMContainer {
  shadowRoot: ShadowRoot
  container: HTMLElement
}

/**
 * Create a Shadow DOM container for the extension UI
 * @param containerId - ID for the root container element
 * @param styles - Optional CSS styles to inject into Shadow DOM
 * @returns Shadow DOM container with root and element references
 */
export function createShadowDOM(containerId: string, styles?: string): ShadowDOMContainer {
  // Check if container already exists
  const existing = document.getElementById(containerId)
  if (existing && existing.shadowRoot) {
    return {
      shadowRoot: existing.shadowRoot,
      container: existing,
    }
  }

  // Create root container
  const container = document.createElement('div')
  container.id = containerId
  container.style.position = 'fixed'
  container.style.zIndex = '999999'
  container.style.bottom = '20px'
  container.style.right = '20px'

  // Attach Shadow DOM
  const shadowRoot = container.attachShadow({ mode: 'open' })

  // Inject styles if provided
  if (styles) {
    const styleElement = document.createElement('style')
    styleElement.textContent = styles
    shadowRoot.appendChild(styleElement)
  }

  // Add container to document
  document.body.appendChild(container)

  return { shadowRoot, container }
}

/**
 * Load external CSS into Shadow DOM
 * @param shadowRoot - Shadow DOM root
 * @param cssUrl - URL to CSS file (use chrome.runtime.getURL for extension resources)
 * @returns Promise that resolves when CSS is loaded
 */
export async function loadShadowDOMStyles(shadowRoot: ShadowRoot, cssUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssUrl
    link.onload = () => resolve()
    link.onerror = (_e) => reject(new Error(`Failed to load CSS: ${cssUrl}`))
    shadowRoot.appendChild(link)
  })
}

/**
 * Create a mount point for Vue app inside Shadow DOM
 * @param shadowRoot - Shadow DOM root
 * @param mountId - ID for the mount point element
 * @returns HTMLElement to mount Vue app
 */
export function createMountPoint(shadowRoot: ShadowRoot, mountId: string): HTMLElement {
  const mountPoint = document.createElement('div')
  mountPoint.id = mountId
  shadowRoot.appendChild(mountPoint)
  return mountPoint
}
