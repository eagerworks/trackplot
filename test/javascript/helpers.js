/**
 * Creates a <trackplot-chart> element, appends it to the DOM,
 * and waits for it to render.
 */
export async function createChart(config, { width = 600, height = 400 } = {}) {
  const el = document.createElement("trackplot-chart")
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  el.setAttribute("config", JSON.stringify(config))
  document.body.appendChild(el)
  // Wait for two rAF ticks (connectedCallback uses rAF for initial render)
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  return el
}

/**
 * Creates a <trackplot-sparkline> element, appends it to the DOM,
 * and waits for it to render.
 */
export async function createSparkline(config, { width = 200, height = 40 } = {}) {
  const el = document.createElement("trackplot-sparkline")
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  el.setAttribute("config", JSON.stringify(config))
  document.body.appendChild(el)
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  return el
}

/** Shared sample data for bar/line charts */
export const SAMPLE_DATA = [
  { month: "Jan", revenue: 100, cost: 60 },
  { month: "Feb", revenue: 200, cost: 80 },
  { month: "Mar", revenue: 150, cost: 70 },
  { month: "Apr", revenue: 300, cost: 120 }
]

/** Minimal bar chart config */
export function barConfig(overrides = {}) {
  return {
    data: SAMPLE_DATA,
    animate: false,
    components: [
      { type: "bar", data_key: "revenue" },
      { type: "axis", direction: "x", data_key: "month" },
      { type: "axis", direction: "y" }
    ],
    ...overrides
  }
}

/** Minimal line chart config */
export function lineConfig(overrides = {}) {
  return {
    data: SAMPLE_DATA,
    animate: false,
    components: [
      { type: "line", data_key: "revenue" },
      { type: "axis", direction: "x", data_key: "month" },
      { type: "axis", direction: "y" }
    ],
    ...overrides
  }
}
