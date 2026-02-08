import { describe, it, expect } from "vitest"
import { createChart, barConfig } from "./helpers.js"

const DRILL_DATA = [
  { month: "Jan", revenue: 100, breakdown: [
    { month: "Week 1", revenue: 40 },
    { month: "Week 2", revenue: 60 }
  ]},
  { month: "Feb", revenue: 200, breakdown: [
    { month: "Week 1", revenue: 80 },
    { month: "Week 2", revenue: 120 }
  ]},
  { month: "Mar", revenue: 150 }  // leaf node — no breakdown
]

function drillBarConfig(overrides = {}) {
  return {
    data: DRILL_DATA,
    animate: false,
    components: [
      { type: "bar", data_key: "revenue" },
      { type: "axis", direction: "x", data_key: "month" },
      { type: "axis", direction: "y" },
      { type: "drilldown", key: "breakdown" }
    ],
    ...overrides
  }
}

function drillPieConfig(overrides = {}) {
  return {
    data: [
      { name: "A", value: 30, breakdown: [
        { name: "A1", value: 10 },
        { name: "A2", value: 20 }
      ]},
      { name: "B", value: 50, breakdown: [
        { name: "B1", value: 25 },
        { name: "B2", value: 25 }
      ]}
    ],
    animate: false,
    components: [
      { type: "pie", data_key: "value", label_key: "name" },
      { type: "drilldown", key: "breakdown" }
    ],
    ...overrides
  }
}

describe("Drill-down", () => {
  it("bar click with sub-data drills down", async () => {
    const el = await createChart(drillBarConfig())
    const drillPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drilldown", (e) => resolve(e.detail))
    })

    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await drillPromise
    expect(detail.level).toBe(1)
    expect(detail.label).toBe("Jan")

    // SVG should have re-rendered with sub-data (2 bars instead of 3)
    const bars = el.querySelectorAll(".trackplot-bar")
    expect(bars.length).toBe(2)
  })

  it("pie click with sub-data drills down", async () => {
    const el = await createChart(drillPieConfig())
    const drillPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drilldown", (e) => resolve(e.detail))
    })

    const slice = el.querySelector(".trackplot-pie path")
    slice.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await drillPromise
    expect(detail.level).toBe(1)
    expect(detail.label).toBe("A")
  })

  it("breadcrumb appears when drilled in", async () => {
    const el = await createChart(drillBarConfig())

    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    // Wait for drilldown event
    await new Promise(r => setTimeout(r, 10))

    const breadcrumb = el.querySelector(".trackplot-breadcrumb")
    expect(breadcrumb).not.toBeNull()
    expect(breadcrumb.textContent).toContain("All")
    expect(breadcrumb.textContent).toContain("Jan")
  })

  it("breadcrumb All click resets to root", async () => {
    const el = await createChart(drillBarConfig())

    // Drill in
    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    // Click "All" in breadcrumb
    const allLink = el.querySelector(".trackplot-breadcrumb span")
    const upPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drillup", (e) => resolve(e.detail))
    })
    allLink.click()
    const detail = await upPromise

    expect(detail.level).toBe(0)

    // Should be back to 3 bars
    const bars = el.querySelectorAll(".trackplot-bar")
    expect(bars.length).toBe(3)

    // Breadcrumb should be removed
    expect(el.querySelector(".trackplot-breadcrumb")).toBeNull()
  })

  it("leaf node click does NOT drill, fires normal click", async () => {
    const el = await createChart(drillBarConfig())

    // Click the third bar ("Mar") which has no breakdown
    const bars = el.querySelectorAll(".trackplot-bar")
    const leafBar = bars[2] // Mar

    const clickPromise = new Promise(resolve => {
      el.addEventListener("trackplot:click", (e) => resolve(e.detail))
    })
    leafBar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await clickPromise
    expect(detail.chartType).toBe("bar")
    // Should still show 3 bars (not drilled)
    expect(el.querySelectorAll(".trackplot-bar").length).toBe(3)
  })

  it("drillUp() goes back one level", async () => {
    const el = await createChart(drillBarConfig())

    // Drill in
    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    expect(el.querySelectorAll(".trackplot-bar").length).toBe(2)

    const result = el.drillUp()
    expect(result).toBe(true)
    expect(el.querySelectorAll(".trackplot-bar").length).toBe(3)
  })

  it("drillReset() returns to root from any depth", async () => {
    const el = await createChart(drillBarConfig())

    // Drill in
    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    const result = el.drillReset()
    expect(result).toBe(true)
    expect(el.querySelectorAll(".trackplot-bar").length).toBe(3)
    expect(el.querySelector(".trackplot-breadcrumb")).toBeNull()
  })

  it("multi-level drill shows correct breadcrumb", async () => {
    const multiData = [
      { month: "Jan", revenue: 100, breakdown: [
        { month: "Week 1", revenue: 40, breakdown: [
          { month: "Mon", revenue: 10 },
          { month: "Tue", revenue: 30 }
        ]},
        { month: "Week 2", revenue: 60 }
      ]}
    ]
    const el = await createChart(drillBarConfig({ data: multiData }))

    // Drill level 1
    let bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    // Drill level 2
    bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    const breadcrumb = el.querySelector(".trackplot-breadcrumb")
    expect(breadcrumb).not.toBeNull()
    expect(breadcrumb.textContent).toContain("All")
    expect(breadcrumb.textContent).toContain("Jan")
    expect(breadcrumb.textContent).toContain("Week 1")
  })

  it("trackplot:drilldown event fires with correct detail", async () => {
    const el = await createChart(drillBarConfig())

    const drillPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drilldown", (e) => resolve(e.detail))
    })

    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await drillPromise
    expect(detail.level).toBe(1)
    expect(detail.datum).toBeDefined()
    expect(detail.label).toBe("Jan")
  })

  it("trackplot:drillup event fires on drill back", async () => {
    const el = await createChart(drillBarConfig())

    // Drill in
    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    const upPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drillup", (e) => resolve(e.detail))
    })
    el.drillUp()

    const detail = await upPromise
    expect(detail.level).toBe(0)
  })

  it("updateData() while drilled resets to root", async () => {
    const el = await createChart(drillBarConfig())

    // Drill in
    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await new Promise(r => setTimeout(r, 10))

    // Update data should reset drill state
    el.updateData(DRILL_DATA)
    expect(el.querySelector(".trackplot-breadcrumb")).toBeNull()
    expect(el.querySelectorAll(".trackplot-bar").length).toBe(3)
  })

  it("no drilldown component - clicks work normally", async () => {
    const el = await createChart(barConfig())

    const clickPromise = new Promise(resolve => {
      el.addEventListener("trackplot:click", (e) => resolve(e.detail))
    })

    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await clickPromise
    expect(detail.chartType).toBe("bar")
    // Still 4 bars (no drill)
    expect(el.querySelectorAll(".trackplot-bar").length).toBe(4)
  })

  it("stacked bar click drills correctly", async () => {
    const stackData = [
      { month: "Jan", revenue: 100, cost: 60, breakdown: [
        { month: "Week 1", revenue: 40, cost: 20 },
        { month: "Week 2", revenue: 60, cost: 40 }
      ]},
      { month: "Feb", revenue: 200, cost: 80 }
    ]
    const el = await createChart({
      data: stackData,
      animate: false,
      components: [
        { type: "bar", data_key: "revenue", stack: "main" },
        { type: "bar", data_key: "cost", stack: "main" },
        { type: "axis", direction: "x", data_key: "month" },
        { type: "axis", direction: "y" },
        { type: "drilldown", key: "breakdown" }
      ]
    })

    const drillPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drilldown", (e) => resolve(e.detail))
    })

    // Click a stacked bar (first bar for "Jan")
    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await drillPromise
    expect(detail.level).toBe(1)
    expect(detail.label).toBe("Jan")
  })

  it("heatmap click with sub-data drills down", async () => {
    const heatmapData = [
      { day: "Q1", hour: "Sales", count: 120, breakdown: [
        { day: "Jan", hour: "Sales", count: 40 },
        { day: "Feb", hour: "Sales", count: 80 }
      ]},
      { day: "Q2", hour: "Sales", count: 90 }
    ]
    const el = await createChart({
      data: heatmapData,
      animate: false,
      components: [
        { type: "heatmap", x_key: "day", y_key: "hour", value_key: "count", color_range: ["#f0f9ff", "#1e40af"], radius: 2 },
        { type: "drilldown", key: "breakdown" }
      ]
    })

    const drillPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drilldown", (e) => resolve(e.detail))
    })

    const cell = el.querySelector(".trackplot-heatmap-cell")
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await drillPromise
    expect(detail.level).toBe(1)
  })

  it("treemap click with sub-data drills down", async () => {
    const treemapData = [
      { name: "Engineering", size: 9500, breakdown: [
        { name: "Frontend", size: 3800 },
        { name: "Backend", size: 3500 },
        { name: "DevOps", size: 2200 }
      ]},
      { name: "Sales", size: 6200 }
    ]
    const el = await createChart({
      data: treemapData,
      animate: false,
      components: [
        { type: "treemap", value_key: "size", label_key: "name" },
        { type: "drilldown", key: "breakdown" }
      ]
    })

    const drillPromise = new Promise(resolve => {
      el.addEventListener("trackplot:drilldown", (e) => resolve(e.detail))
    })

    const cell = el.querySelector(".trackplot-treemap-cell")
    cell.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await drillPromise
    expect(detail.level).toBe(1)
  })

  it("drillUp() returns false when already at root", async () => {
    const el = await createChart(drillBarConfig())
    const result = el.drillUp()
    expect(result).toBe(false)
  })

  it("drillReset() returns false when already at root", async () => {
    const el = await createChart(drillBarConfig())
    const result = el.drillReset()
    expect(result).toBe(false)
  })
})
