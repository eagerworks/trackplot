import { afterEach } from "vitest"

// Polyfill ResizeObserver (not available in jsdom)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub

// Polyfill requestAnimationFrame / cancelAnimationFrame
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}

// Stub SVG geometry methods that jsdom doesn't implement
if (typeof SVGElement !== "undefined") {
  SVGElement.prototype.getTotalLength = function () { return 100 }
  SVGElement.prototype.getComputedTextLength = function () { return 20 }
  SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: 100, height: 100 } }
}

// Stub HTMLElement.getBoundingClientRect to return size based on inline styles
const originalGetBCR = HTMLElement.prototype.getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = function () {
  const width = parseFloat(this.style.width) || 0
  const height = parseFloat(this.style.height) || 0
  if (width > 0 || height > 0) {
    return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height }
  }
  return originalGetBCR.call(this)
}

// Stub URL.createObjectURL / revokeObjectURL (not available in jsdom)
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = () => "blob:stub"
  URL.revokeObjectURL = () => {}
}

// Import the module to register custom elements
await import("../../app/assets/javascripts/trackplot/index.js")

// Auto-cleanup after each test
afterEach(() => {
  document.body.querySelectorAll("trackplot-chart, trackplot-sparkline").forEach(el => el.remove())
})
