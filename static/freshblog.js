/* CSS Anchor Positioning Polyfill https://github.com/oddbird/css-anchor-positioning */

/* This function checks if the anchor attribute is supported.
 * See: https://caniuse.com/mdn-html_global_attributes_anchor */
function supportsAnchorAttribute() {
  // Check if we can create elements
  if (!document.createElement) return false

  const testElement = document.createElement('div')
  // Try to set the anchor attribute
  testElement.setAttribute('anchor', 'test')
  // Check if the attribute was successfully set
  const attributeSet = testElement.getAttribute('anchor') === 'test'
  // Check if the element has an anchorName property (part of the spec)
  const hasAnchorNameProperty = 'anchorName' in testElement

  return attributeSet && hasAnchorNameProperty
}

if (
  !globalThis.CSS ||
  !globalThis.CSS.supports ||
  // this check if CSS supports anchor positioning https://caniuse.com/css-anchor-positioning
  !CSS.supports('(top: anchor(bottom))') ||
  !supportsAnchorAttribute()
) {
  const { default: cssAnchorPolyfill } = await import(
    'https://unpkg.com/@oddbird/css-anchor-positioning/dist/css-anchor-positioning-fn.js'
  )

  cssAnchorPolyfill(true)
}
