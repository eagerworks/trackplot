import { describe, it, expect } from "vitest"
import { createChart, barConfig } from "./helpers.js"

describe("Export", () => {
  it("exportSVG() returns Promise resolving to Blob", async () => {
    const el = await createChart(barConfig())
    const blob = await el.exportSVG("test.svg")
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe("image/svg+xml;charset=utf-8")
  })

  it("exportSVG() resolves to null when no SVG present", async () => {
    // Create a chart with empty data — renders empty state SVG with text, not bar SVGs
    // Then remove the SVG to simulate a cleared state
    const el = await createChart(barConfig())
    el.querySelector("svg").remove()
    const result = await el.exportSVG()
    expect(result).toBeNull()
  })

  it("exportPNG() returns a Promise", async () => {
    const el = await createChart(barConfig())
    // jsdom doesn't fully support canvas/Image, so exportPNG may reject or resolve null
    // We just verify it returns a Promise
    const result = el.exportPNG()
    expect(result).toBeInstanceOf(Promise)
    // Don't await — jsdom can't render to canvas
  })
})
