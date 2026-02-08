import { describe, it, expect } from "vitest"
import { createChart, barConfig, lineConfig, SAMPLE_DATA } from "./helpers.js"

describe("Events", () => {
  it("trackplot:click fires on bar click with expected detail", async () => {
    const el = await createChart(barConfig())
    const eventPromise = new Promise(resolve => {
      el.addEventListener("trackplot:click", (e) => resolve(e.detail))
    })

    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await eventPromise
    expect(detail.chartType).toBe("bar")
    expect(detail.dataKey).toBe("revenue")
    expect(detail.datum).toBeDefined()
    expect(typeof detail.index).toBe("number")
    expect(detail.value).toBeDefined()
  })

  it("trackplot:click fires on pie slice click", async () => {
    const data = [
      { name: "A", value: 30 },
      { name: "B", value: 50 },
      { name: "C", value: 20 }
    ]
    const el = await createChart({
      data,
      animate: false,
      components: [{ type: "pie", data_key: "value", label_key: "name" }]
    })

    const eventPromise = new Promise(resolve => {
      el.addEventListener("trackplot:click", (e) => resolve(e.detail))
    })

    const slice = el.querySelector(".trackplot-pie path")
    slice.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await eventPromise
    expect(detail.chartType).toBe("pie")
    expect(detail.dataKey).toBe("value")
  })

  it("trackplot:render fires after initial render", async () => {
    const eventPromise = new Promise(resolve => {
      document.addEventListener("trackplot:render", resolve, { once: true })
    })
    await createChart(barConfig())
    const event = await eventPromise
    expect(event.type).toBe("trackplot:render")
  })

  it("trackplot:data-update fires after appendData() with count", async () => {
    const el = await createChart(barConfig())
    const eventPromise = new Promise(resolve => {
      el.addEventListener("trackplot:data-update", (e) => resolve(e.detail))
    })

    el.appendData([{ month: "May", revenue: 500 }])

    const detail = await eventPromise
    expect(detail.count).toBe(5)
  })

  it("events bubble up the DOM", async () => {
    const el = await createChart(barConfig())
    const eventPromise = new Promise(resolve => {
      document.body.addEventListener("trackplot:click", (e) => resolve(e.detail), { once: true })
    })

    const bar = el.querySelector(".trackplot-bar")
    bar.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await eventPromise
    expect(detail.chartType).toBe("bar")
  })

  it("click on line dot fires event", async () => {
    const el = await createChart(lineConfig())
    const eventPromise = new Promise(resolve => {
      el.addEventListener("trackplot:click", (e) => resolve(e.detail))
    })

    const dot = el.querySelector(".trackplot-dot")
    dot.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    const detail = await eventPromise
    expect(detail.chartType).toBe("line")
    expect(detail.dataKey).toBe("revenue")
  })
})
