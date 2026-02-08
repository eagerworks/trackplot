import { describe, it, expect } from "vitest"
import { createSparkline } from "./helpers.js"

const sparkData = [
  { value: 10 }, { value: 30 }, { value: 20 }, { value: 50 }, { value: 40 }
]

describe("SparklineElement", () => {
  it("line sparkline renders SVG with path", async () => {
    const el = await createSparkline({ data: sparkData, key: "value", type: "line" })
    expect(el.querySelector("svg")).not.toBeNull()
    const paths = el.querySelectorAll("path")
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })

  it("bar sparkline renders rect elements", async () => {
    const el = await createSparkline({ data: sparkData, key: "value", type: "bar" })
    expect(el.querySelector("svg")).not.toBeNull()
    const rects = el.querySelectorAll("rect")
    expect(rects.length).toBe(sparkData.length)
  })

  it("area sparkline renders path with fill", async () => {
    const el = await createSparkline({ data: sparkData, key: "value", type: "area" })
    const paths = el.querySelectorAll("path")
    // area has fill path + stroke path
    expect(paths.length).toBe(2)
    // first path has fill-opacity
    expect(paths[0].getAttribute("fill-opacity")).toBe("0.2")
  })

  it("empty data renders no SVG content", async () => {
    const el = await createSparkline({ data: [], key: "value", type: "line" })
    // SVG should not be created for empty data
    expect(el.querySelector("path")).toBeNull()
  })

  it("respects color option", async () => {
    const el = await createSparkline({ data: sparkData, key: "value", type: "line", color: "#ff0000" })
    const path = el.querySelector("path")
    expect(path.getAttribute("stroke")).toBe("#ff0000")
  })

  it("handles zero-size container gracefully", async () => {
    const el = await createSparkline({ data: sparkData, key: "value", type: "line" }, { width: 0, height: 0 })
    // Should not render SVG when container has no size
    expect(el.querySelector("svg")).toBeNull()
  })
})
