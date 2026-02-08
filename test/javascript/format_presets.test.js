import { describe, it, expect } from "vitest"
import { createChart, SAMPLE_DATA } from "./helpers.js"

function yAxisConfig(format) {
  return {
    data: SAMPLE_DATA,
    animate: false,
    components: [
      { type: "bar", data_key: "revenue" },
      { type: "axis", direction: "x", data_key: "month" },
      { type: "axis", direction: "y", format }
    ]
  }
}

function getYTickTexts(el) {
  const yAxis = el.querySelector(".trackplot-axis-y")
  return Array.from(yAxis.querySelectorAll(".tick text")).map(t => t.textContent)
}

describe("Format Presets", () => {
  it("currency format renders $ prefix on y-axis ticks", async () => {
    const el = await createChart(yAxisConfig("currency"))
    const texts = getYTickTexts(el)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.every(t => t.startsWith("$"))).toBe(true)
  })

  it("percent format renders % suffix on y-axis ticks", async () => {
    const el = await createChart(yAxisConfig("percent"))
    const texts = getYTickTexts(el)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.every(t => t.endsWith("%"))).toBe(true)
  })

  it("compact format abbreviates numbers", async () => {
    const bigData = [
      { month: "Jan", revenue: 1000 },
      { month: "Feb", revenue: 2000 },
      { month: "Mar", revenue: 5000 }
    ]
    const el = await createChart({
      data: bigData,
      animate: false,
      components: [
        { type: "bar", data_key: "revenue" },
        { type: "axis", direction: "x", data_key: "month" },
        { type: "axis", direction: "y", format: "compact" }
      ]
    })
    const texts = getYTickTexts(el)
    expect(texts.length).toBeGreaterThan(0)
    // Compact format uses SI suffixes like "1k", "2k"
    expect(texts.some(t => /[kMGT]/.test(t))).toBe(true)
  })

  it("integer format has no decimals", async () => {
    const el = await createChart(yAxisConfig("integer"))
    const texts = getYTickTexts(el)
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.every(t => !t.includes("."))).toBe(true)
  })

  it("custom D3 format string applied correctly", async () => {
    const el = await createChart(yAxisConfig(".1f"))
    const texts = getYTickTexts(el)
    expect(texts.length).toBeGreaterThan(0)
    // .1f format should show exactly one decimal place
    expect(texts.every(t => /\.\d$/.test(t) || t === "0.0")).toBe(true)
  })
})
