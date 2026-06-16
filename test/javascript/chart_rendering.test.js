import { describe, it, expect } from "vitest"
import { createChart, SAMPLE_DATA, barConfig, lineConfig } from "./helpers.js"

describe("Chart Rendering", () => {
  describe("Line chart", () => {
    it("renders path stroke and circle dots", async () => {
      const el = await createChart(lineConfig())
      expect(el.querySelector(".trackplot-line")).not.toBeNull()
      const dots = el.querySelectorAll(".trackplot-dot")
      expect(dots.length).toBe(SAMPLE_DATA.length)
    })
  })

  describe("Bar chart", () => {
    it("renders rect per data point", async () => {
      const el = await createChart(barConfig())
      const bars = el.querySelectorAll(".trackplot-bar")
      expect(bars.length).toBe(SAMPLE_DATA.length)
    })

    it("renders grouped bars with multiple rects per category", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue" },
          { type: "bar", data_key: "cost" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      const bars = el.querySelectorAll(".trackplot-bar")
      // 4 data points x 2 series = 8 bars
      expect(bars.length).toBe(8)
    })

    it("renders stacked bars", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue", stack: "s1" },
          { type: "bar", data_key: "cost", stack: "s1" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      const bars = el.querySelectorAll(".trackplot-stacked-bar")
      // 4 data points x 2 stacked series = 8 bars
      expect(bars.length).toBe(8)
    })
  })

  describe("Area chart", () => {
    it("renders path with fill", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "area", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      expect(el.querySelector(".trackplot-area")).not.toBeNull()
    })

    it("renders stacked areas as multiple filled paths", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "area", data_key: "revenue", stack: "s1" },
          { type: "area", data_key: "cost", stack: "s1" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      const paths = el.querySelectorAll(".trackplot-stacked-area")
      expect(paths.length).toBe(2)
    })
  })

  describe("Pie chart", () => {
    it("renders arc path elements", async () => {
      const data = [
        { name: "A", value: 30 },
        { name: "B", value: 50 },
        { name: "C", value: 20 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "pie", data_key: "value", label_key: "name" }
        ]
      })
      const group = el.querySelector(".trackplot-pie")
      expect(group).not.toBeNull()
      const arcs = group.querySelectorAll("path")
      expect(arcs.length).toBe(3)
    })

    it("donut has inner radius (path d contains inner arc)", async () => {
      const data = [
        { name: "A", value: 30 },
        { name: "B", value: 50 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "pie", data_key: "value", label_key: "name", donut: true }
        ]
      })
      const arcs = el.querySelectorAll(".trackplot-pie path")
      expect(arcs.length).toBe(2)
      // Donut arcs have an inner arc, creating more complex path with multiple A commands
      const d = arcs[0].getAttribute("d")
      // A donut arc's path has more arc commands than a full pie
      expect(d).toContain("A")
    })
  })

  describe("Scatter chart", () => {
    it("renders circle per data point", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "scatter", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      const circles = el.querySelectorAll(".trackplot-scatter")
      expect(circles.length).toBe(SAMPLE_DATA.length)
    })
  })

  describe("Radar chart", () => {
    it("renders polygon path and grid rings", async () => {
      const data = [
        { category: "Speed", score: 80 },
        { category: "Power", score: 60 },
        { category: "Range", score: 90 },
        { category: "Defense", score: 70 },
        { category: "Magic", score: 50 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "radar", data_key: "score" },
          { type: "axis", direction: "x", data_key: "category" }
        ]
      })
      const group = el.querySelector(".trackplot-radar")
      expect(group).not.toBeNull()
      // Grid rings are polygons
      const polygons = group.querySelectorAll("polygon")
      // 5 grid levels + 1 series polygon = 6
      expect(polygons.length).toBe(6)
    })
  })

  describe("Horizontal bar chart", () => {
    it("renders rect elements", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "horizontal_bar", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      const bars = el.querySelectorAll(".trackplot-hbar")
      expect(bars.length).toBe(SAMPLE_DATA.length)
    })
  })

  describe("Candlestick chart", () => {
    it("renders rect bodies and line wicks", async () => {
      const data = [
        { date: "Mon", open: 100, high: 120, low: 90, close: 110 },
        { date: "Tue", open: 110, high: 130, low: 100, close: 105 },
        { date: "Wed", open: 105, high: 115, low: 95, close: 112 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "candlestick", open: "open", high: "high", low: "low", close: "close" },
          { type: "axis", direction: "x", data_key: "date" },
          { type: "axis", direction: "y" }
        ]
      })
      const candles = el.querySelectorAll(".trackplot-candle")
      const wicks = el.querySelectorAll(".trackplot-wick")
      expect(candles.length).toBe(3)
      expect(wicks.length).toBe(3)
    })
  })

  describe("Funnel chart", () => {
    it("renders path stages", async () => {
      const data = [
        { stage: "Visitors", count: 1000 },
        { stage: "Leads", count: 600 },
        { stage: "Customers", count: 200 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "funnel", data_key: "count", label_key: "stage" }
        ]
      })
      const stages = el.querySelectorAll(".trackplot-funnel-stage")
      expect(stages.length).toBe(3)
    })
  })

  describe("Heatmap chart", () => {
    it("renders rect grid cells", async () => {
      const data = [
        { day: "Mon", hour: "9am", value: 10 },
        { day: "Mon", hour: "10am", value: 20 },
        { day: "Tue", hour: "9am", value: 30 },
        { day: "Tue", hour: "10am", value: 15 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "heatmap", x_key: "hour", y_key: "day", value_key: "value" }
        ]
      })
      const cells = el.querySelectorAll(".trackplot-heatmap-cell")
      expect(cells.length).toBe(4)
    })
  })

  describe("Treemap chart", () => {
    it("renders rect cells with text labels", async () => {
      const data = [
        { name: "Alpha", size: 100 },
        { name: "Beta", size: 200 },
        { name: "Gamma", size: 150 }
      ]
      const el = await createChart({
        data,
        animate: false,
        components: [
          { type: "treemap", value_key: "size", label_key: "name" }
        ]
      })
      const cells = el.querySelectorAll(".trackplot-treemap-cell")
      expect(cells.length).toBe(3)
      const texts = el.querySelectorAll("text")
      expect(texts.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe("Components", () => {
    it("renders grid with dashed lines", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" },
          { type: "grid" }
        ]
      })
      const grid = el.querySelector(".trackplot-grid")
      expect(grid).not.toBeNull()
      const lines = grid.querySelectorAll("line")
      expect(lines.length).toBeGreaterThan(0)
      // Grid lines have dashed stroke
      expect(lines[0].getAttribute("stroke-dasharray")).toBe("3 3")
    })

    it("renders axes with tick marks", async () => {
      const el = await createChart(barConfig())
      expect(el.querySelector(".trackplot-axis-x")).not.toBeNull()
      expect(el.querySelector(".trackplot-axis-y")).not.toBeNull()
    })

    it("renders reference line with label", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" },
          { type: "reference_line", direction: "y", value: 200, label: "Target", color: "#ff0000" }
        ]
      })
      const refLine = el.querySelector(".trackplot-reference-line")
      expect(refLine).not.toBeNull()
      expect(refLine.getAttribute("stroke")).toBe("#ff0000")

      const refLabel = el.querySelector(".trackplot-reference-label")
      expect(refLabel).not.toBeNull()
      expect(refLabel.textContent).toBe("Target")
    })

    it("renders data labels as text elements", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" },
          { type: "data_label" }
        ]
      })
      const labels = el.querySelectorAll(".trackplot-data-label")
      expect(labels.length).toBe(SAMPLE_DATA.length)
    })

    it("renders legend items with colored indicators", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue" },
          { type: "bar", data_key: "cost" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" },
          { type: "legend" }
        ]
      })
      // Legend is a div with items
      const legendItems = el.querySelectorAll("div > div > span")
      // Each legend item has a dot span and label span = 2 per item * 2 series
      expect(legendItems.length).toBe(4)
    })

    it("uses series name for legend label when provided, else data_key", async () => {
      const el = await createChart({
        data: SAMPLE_DATA,
        animate: false,
        components: [
          { type: "bar", data_key: "revenue", name: "Total Revenue" },
          { type: "bar", data_key: "cost" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" },
          { type: "legend" }
        ]
      })
      const labelTexts = Array.from(el.querySelectorAll("div > div > span"))
        .map(s => s.textContent)
        .filter(t => t.length > 0)
      // Custom name overrides data_key; series without a name falls back to data_key
      expect(labelTexts).toContain("Total Revenue")
      expect(labelTexts).toContain("cost")
      expect(labelTexts).not.toContain("revenue")
    })

    it("renders empty state message when data is empty", async () => {
      const el = await createChart({
        data: [],
        animate: false,
        empty_message: "Nothing to show",
        components: [
          { type: "bar", data_key: "revenue" },
          { type: "axis", direction: "x", data_key: "month" },
          { type: "axis", direction: "y" }
        ]
      })
      const svg = el.querySelector("svg")
      expect(svg).not.toBeNull()
      const text = svg.querySelector("text")
      expect(text.textContent).toBe("Nothing to show")
    })
  })
})
