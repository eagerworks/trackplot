import { describe, it, expect, vi } from "vitest"
import { createChart, barConfig, SAMPLE_DATA } from "./helpers.js"

describe("TrackplotElement", () => {
  it("parses config attribute and creates SVG", async () => {
    const el = await createChart(barConfig())
    expect(el.querySelector("svg")).not.toBeNull()
  })

  it("cleans up SVG on disconnect", async () => {
    const el = await createChart(barConfig())
    expect(el.querySelector("svg")).not.toBeNull()
    el.remove()
    expect(el.querySelector("svg")).toBeNull()
  })

  it("re-renders on config attribute change", async () => {
    const el = await createChart(barConfig())
    const initialRects = el.querySelectorAll("rect").length

    const newConfig = barConfig({
      data: [...SAMPLE_DATA, { month: "May", revenue: 400, cost: 130 }]
    })
    el.setAttribute("config", JSON.stringify(newConfig))
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    const newRects = el.querySelectorAll(".trackplot-bar").length
    expect(newRects).toBe(5)
  })

  it("handles invalid JSON gracefully", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const el = document.createElement("trackplot-chart")
    el.style.width = "600px"
    el.style.height = "400px"
    el.setAttribute("config", "NOT_VALID_JSON")
    document.body.appendChild(el)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    // Should not throw, just log error
    expect(el.querySelector("svg")).toBeNull()
    spy.mockRestore()
  })

  it("updateData() re-renders with new data", async () => {
    const el = await createChart(barConfig())
    const initialCount = el.querySelectorAll(".trackplot-bar").length
    expect(initialCount).toBe(4)

    el.updateData([
      { month: "Jan", revenue: 100 },
      { month: "Feb", revenue: 200 }
    ])
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    expect(el.querySelectorAll(".trackplot-bar").length).toBe(2)
  })

  it("updateConfig() swaps the entire config", async () => {
    const el = await createChart(barConfig())
    expect(el.querySelectorAll(".trackplot-bar").length).toBeGreaterThan(0)

    el.updateConfig({
      data: SAMPLE_DATA,
      animate: false,
      components: [
        { type: "line", data_key: "revenue" },
        { type: "axis", direction: "x", data_key: "month" },
        { type: "axis", direction: "y" }
      ]
    })
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    expect(el.querySelectorAll(".trackplot-line").length).toBe(1)
  })

  it("appendData() adds points and respects maxPoints", async () => {
    const smallData = [
      { month: "Jan", revenue: 100 },
      { month: "Feb", revenue: 200 }
    ]
    const el = await createChart(barConfig({ data: smallData }))

    el.appendData(
      [{ month: "Mar", revenue: 150 }, { month: "Apr", revenue: 300 }],
      { maxPoints: 3 }
    )
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    // maxPoints=3, so sliding window keeps last 3
    expect(el.querySelectorAll(".trackplot-bar").length).toBe(3)
  })

  it("appendData() dispatches trackplot:data-update event", async () => {
    const el = await createChart(barConfig())
    const eventPromise = new Promise(resolve => {
      el.addEventListener("trackplot:data-update", (e) => resolve(e.detail))
    })

    el.appendData([{ month: "May", revenue: 500 }])

    const detail = await eventPromise
    expect(detail.count).toBe(5)
  })

  it("syncs config attribute after updateData()", async () => {
    const el = await createChart(barConfig())
    el.updateData([{ month: "Jan", revenue: 999 }])

    const syncedConfig = JSON.parse(el.getAttribute("config"))
    expect(syncedConfig.data).toHaveLength(1)
    expect(syncedConfig.data[0].revenue).toBe(999)
  })

  it("dispatches trackplot:render on initial render", async () => {
    const eventPromise = new Promise(resolve => {
      document.addEventListener("trackplot:render", resolve, { once: true })
    })
    await createChart(barConfig())
    const event = await eventPromise
    expect(event).toBeTruthy()
  })
})
