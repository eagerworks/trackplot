import * as d3 from "d3"

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"
]

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const DURATION = 750
const EASE = d3.easeCubicOut
const DEFAULT_MARGIN = { top: 24, right: 24, bottom: 44, left: 52 }

const ALL_SERIES_TYPES = ["line", "bar", "area", "pie", "scatter", "radar", "horizontal_bar", "candlestick", "funnel", "heatmap", "treemap"]
const CARTESIAN_TYPES = ["line", "bar", "area", "scatter", "candlestick"]

// ─── Default Theme ──────────────────────────────────────────────────────────

const DEFAULT_THEME = {
  colors: COLORS,
  background: "transparent",
  text_color: "#374151",
  axis_color: "#d1d5db",
  grid_color: "#e5e7eb",
  tooltip_bg: "rgba(255, 255, 255, 0.96)",
  tooltip_text: "#111827",
  tooltip_border: "#e5e7eb",
  font: FONT
}

// ─── Format Presets ─────────────────────────────────────────────────────────

const FORMAT_PRESETS = {
  currency: v => "$" + d3.format(",.0f")(v),
  percent: v => d3.format(",.0f")(v) + "%",
  compact: d3.format("~s"),
  decimal: d3.format(",.2f"),
  integer: d3.format(",.0f")
}

function resolveFormatter(fmt) {
  if (!fmt) return v => v
  if (FORMAT_PRESETS[fmt]) return FORMAT_PRESETS[fmt]
  try { return d3.format(fmt) } catch { return v => v }
}

// ─── Click Event Helper ─────────────────────────────────────────────────────

function dispatchClick(element, detail) {
  element.dispatchEvent(new CustomEvent("trackplot:click", {
    bubbles: true,
    detail: detail
  }))
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sanitizeClass(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, "_")
}

function seriesLabel(s) {
  return s.name || s.data_key
}

function getXKey(components) {
  const xAxis = components.find(c => c.type === "axis" && c.direction === "x")
  return xAxis ? xAxis.data_key : null
}

function detectScaleType(data, key) {
  if (!key) return "band"
  const sample = data[0]?.[key]
  if (sample != null && !isNaN(parseFloat(sample)) && isFinite(sample)) return "linear"
  return "band"
}

function createXScale(data, key, type, width) {
  if (type === "band") {
    const domain = key ? data.map(d => d[key]) : data.map((_, i) => i)
    return d3.scaleBand().domain(domain).range([0, width]).padding(0.2)
  }
  const extent = d3.extent(data, d => +d[key])
  const padding = (extent[1] - extent[0]) * 0.05 || 1
  return d3.scaleLinear().domain([extent[0] - padding, extent[1] + padding]).nice().range([0, width])
}

function createYScale(data, seriesConfigs, height) {
  let maxVal = 0
  let minVal = 0

  const stackGroups = {}
  seriesConfigs.forEach(s => {
    if (s.type === "bar" && s.stack) {
      stackGroups[s.stack] = stackGroups[s.stack] || []
      stackGroups[s.stack].push(s.data_key)
    }
    if (s.type === "area" && s.stack) {
      const key = `area_${s.stack}`
      stackGroups[key] = stackGroups[key] || []
      stackGroups[key].push(s.data_key)
    }
  })

  seriesConfigs.forEach(s => {
    if (s.type === "candlestick") {
      const hi = d3.max(data, d => +d[s.high] || 0)
      const lo = d3.min(data, d => +d[s.low] || 0)
      if (hi > maxVal) maxVal = hi
      if (lo < minVal) minVal = lo
    } else if (!((s.type === "bar" || s.type === "area") && s.stack)) {
      if (s.data_key) {
        const sMax = d3.max(data, d => +d[s.data_key] || 0)
        if (sMax > maxVal) maxVal = sMax
      }
    }
  })

  Object.values(stackGroups).forEach(keys => {
    data.forEach(d => {
      const sum = keys.reduce((acc, k) => acc + (+d[k] || 0), 0)
      if (sum > maxVal) maxVal = sum
    })
  })

  if (maxVal === 0) maxVal = 1
  return d3.scaleLinear().domain([minVal, maxVal]).nice().range([height, 0])
}

function createYScaleRight(data, seriesConfigs, height) {
  let maxVal = 0
  let minVal = 0

  seriesConfigs.forEach(s => {
    if (s.data_key) {
      const sMax = d3.max(data, d => +d[s.data_key] || 0)
      const sMin = d3.min(data, d => +d[s.data_key] || 0)
      if (sMax > maxVal) maxVal = sMax
      if (sMin < minVal) minVal = sMin
    }
  })

  if (maxVal === 0) maxVal = 1
  return d3.scaleLinear().domain([minVal, maxVal]).nice().range([height, 0])
}

function xAccessorFor(xScale, xKey) {
  const offset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0
  return xKey
    ? d => xScale(d[xKey]) + offset
    : (_, i) => xScale(i) + offset
}

function findNearestIndex(mouseX, data, getX) {
  let nearest = 0
  let minDist = Infinity
  for (let i = 0; i < data.length; i++) {
    const dist = Math.abs(getX(data[i], i) - mouseX)
    if (dist < minDist) { minDist = dist; nearest = i }
  }
  return nearest
}

function createTooltipDiv(container, theme) {
  const t = theme || DEFAULT_THEME
  const el = document.createElement("div")
  Object.assign(el.style, {
    position: "absolute",
    pointerEvents: "none",
    background: t.tooltip_bg,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: `1px solid ${t.tooltip_border}`,
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontFamily: t.font || FONT,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
    opacity: "0",
    transition: "opacity 0.15s ease",
    zIndex: "10",
    whiteSpace: "nowrap",
    lineHeight: "1.6"
  })
  container.style.position = "relative"
  container.appendChild(el)
  return el
}

// ─── Grid Renderer ───────────────────────────────────────────────────────────

function renderGrid(g, config, xScale, yScale, width, height, theme) {
  const t = theme || DEFAULT_THEME
  const grid = g.append("g").attr("class", "trackplot-grid").attr("aria-hidden", "true")

  if (config.horizontal !== false) {
    grid.append("g")
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
      .call(g => g.selectAll("line").attr("stroke", t.grid_color).attr("stroke-dasharray", "3 3"))
      .call(g => g.selectAll(".domain").remove())
      .call(g => g.selectAll(".tick text").remove())
  }

  if (config.vertical) {
    grid.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(""))
      .call(g => g.selectAll("line").attr("stroke", t.grid_color).attr("stroke-dasharray", "3 3"))
      .call(g => g.selectAll(".domain").remove())
      .call(g => g.selectAll(".tick text").remove())
  }
}

// ─── Axes Renderer ───────────────────────────────────────────────────────────

function renderAxes(g, axesConfigs, xScale, yScale, width, height, theme, yScaleRight) {
  const t = theme || DEFAULT_THEME
  const textColor = t.text_color
  const axisStroke = t.axis_color
  const font = t.font || FONT

  axesConfigs.forEach(axis => {
    if (axis.direction === "x") {
      const xG = g.append("g")
        .attr("class", "trackplot-axis-x")
        .attr("transform", `translate(0,${height})`)

      let gen = d3.axisBottom(xScale)
      const fmt = resolveFormatter(axis.format)
      if (axis.format) gen = gen.tickFormat(fmt)
      if (axis.tick_count) gen = gen.ticks(axis.tick_count)

      xG.call(gen)
      xG.selectAll("text").attr("fill", textColor).attr("font-size", "12px").attr("font-family", font)
      if (axis.tick_rotation) {
        xG.selectAll("text").attr("transform", `rotate(${axis.tick_rotation})`).attr("text-anchor", "end")
      }
      xG.selectAll("line").attr("stroke", axisStroke)
      xG.select(".domain").attr("stroke", axisStroke)

      if (axis.label) {
        xG.append("text").attr("x", width / 2).attr("y", 36)
          .attr("fill", textColor).attr("font-size", "13px").attr("font-family", font)
          .attr("text-anchor", "middle").text(axis.label)
      }
    }

    if (axis.direction === "y") {
      const isRight = axis.axis_id === "right"
      const scale = isRight && yScaleRight ? yScaleRight : yScale

      if (isRight) {
        const yG = g.append("g")
          .attr("class", "trackplot-axis-y-right")
          .attr("transform", `translate(${width},0)`)
        let gen = d3.axisRight(scale)
        const fmt = resolveFormatter(axis.format)
        if (axis.format) gen = gen.tickFormat(fmt)
        if (axis.tick_count) gen = gen.ticks(axis.tick_count)

        yG.call(gen)
        yG.selectAll("text").attr("fill", textColor).attr("font-size", "12px").attr("font-family", font)
        yG.selectAll("line").attr("stroke", axisStroke)
        yG.select(".domain").attr("stroke", axisStroke)

        if (axis.label) {
          yG.append("text").attr("transform", "rotate(90)")
            .attr("x", height / 2).attr("y", -40)
            .attr("fill", textColor).attr("font-size", "13px").attr("font-family", font)
            .attr("text-anchor", "middle").text(axis.label)
        }
      } else {
        const yG = g.append("g").attr("class", "trackplot-axis-y")
        let gen = d3.axisLeft(scale)
        const fmt = resolveFormatter(axis.format)
        if (axis.format) gen = gen.tickFormat(fmt)
        if (axis.tick_count) gen = gen.ticks(axis.tick_count)

        yG.call(gen)
        yG.selectAll("text").attr("fill", textColor).attr("font-size", "12px").attr("font-family", font)
        yG.selectAll("line").attr("stroke", axisStroke)
        yG.select(".domain").attr("stroke", axisStroke)

        if (axis.label) {
          yG.append("text").attr("transform", "rotate(-90)")
            .attr("x", -height / 2).attr("y", -40)
            .attr("fill", textColor).attr("font-size", "13px").attr("font-family", font)
            .attr("text-anchor", "middle").text(axis.label)
        }
      }
    }
  })
}

// ─── Reference Lines Renderer ───────────────────────────────────────────────

function renderReferenceLines(g, refs, xScale, yScale, width, height, theme) {
  if (!refs || refs.length === 0) return
  const t = theme || DEFAULT_THEME

  refs.forEach(ref => {
    const color = ref.color || "#ef4444"
    const strokeWidth = ref.stroke_width || 1.5
    const dashed = ref.dashed !== false

    if (ref.direction === "y") {
      const y = yScale(ref.value)
      if (y == null || isNaN(y)) return

      g.append("line")
        .attr("class", "trackplot-reference-line")
        .attr("aria-hidden", "true")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y).attr("y2", y)
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", dashed ? "6 4" : null)

      if (ref.label) {
        g.append("text")
          .attr("class", "trackplot-reference-label")
          .attr("x", width - 4).attr("y", y - 6)
          .attr("text-anchor", "end")
          .attr("fill", color)
          .attr("font-size", "11px")
          .attr("font-family", t.font || FONT)
          .attr("font-weight", "500")
          .text(ref.label)
      }
    }

    if (ref.direction === "x") {
      let x
      if (xScale.bandwidth) {
        x = xScale(ref.value) + xScale.bandwidth() / 2
      } else {
        x = xScale(ref.value)
      }
      if (x == null || isNaN(x)) return

      g.append("line")
        .attr("class", "trackplot-reference-line")
        .attr("aria-hidden", "true")
        .attr("x1", x).attr("x2", x)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-dasharray", dashed ? "6 4" : null)

      if (ref.label) {
        g.append("text")
          .attr("class", "trackplot-reference-label")
          .attr("x", x + 6).attr("y", 12)
          .attr("text-anchor", "start")
          .attr("fill", color)
          .attr("font-size", "11px")
          .attr("font-family", t.font || FONT)
          .attr("font-weight", "500")
          .text(ref.label)
      }
    }
  })
}

// ─── Data Labels Renderer ───────────────────────────────────────────────────

function renderDataLabels(g, data, xScale, yScale, xKey, seriesList, dataLabelConfig, theme) {
  if (!dataLabelConfig) return
  const t = theme || DEFAULT_THEME
  const fmt = resolveFormatter(dataLabelConfig.format)
  const position = dataLabelConfig.position || "top"
  const fontSize = dataLabelConfig.font_size || 11

  seriesList.forEach(series => {
    if (!series.data_key) return
    const getX = xAccessorFor(xScale, xKey)

    if (series.type === "bar") {
      const barSeries = seriesList.filter(s => s.type === "bar")
      const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 0
      const subScale = d3.scaleBand()
        .domain(barSeries.map(s => s.data_key))
        .range([0, bandwidth])
        .padding(0.05)

      data.forEach((d, i) => {
        const val = +d[series.data_key] || 0
        const xPos = (xKey ? xScale(d[xKey]) : xScale(i)) + subScale(series.data_key) + subScale.bandwidth() / 2
        let yPos
        if (position === "center") {
          yPos = yScale(val) + (yScale(0) - yScale(val)) / 2
        } else {
          yPos = yScale(val) - 6
        }

        g.append("text")
          .attr("class", "trackplot-data-label")
          .attr("x", xPos)
          .attr("y", yPos)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", position === "center" ? "white" : t.text_color)
          .attr("font-size", `${fontSize}px`)
          .attr("font-family", t.font || FONT)
          .attr("font-weight", "500")
          .text(fmt(val))
      })
    } else if (series.type === "line" || series.type === "area" || series.type === "scatter") {
      data.forEach((d, i) => {
        if (d[series.data_key] == null) return
        const val = +d[series.data_key]
        const xPos = getX(d, i)
        const yPos = yScale(val) - 10

        g.append("text")
          .attr("class", "trackplot-data-label")
          .attr("x", xPos)
          .attr("y", yPos)
          .attr("text-anchor", "middle")
          .attr("fill", t.text_color)
          .attr("font-size", `${fontSize}px`)
          .attr("font-family", t.font || FONT)
          .attr("font-weight", "500")
          .text(fmt(val))
      })
    }
  })
}

function renderPieDataLabels(g, data, series, dataLabelConfig, width, height, theme) {
  if (!dataLabelConfig) return
  const t = theme || DEFAULT_THEME
  const fmt = resolveFormatter(dataLabelConfig.format)
  const fontSize = dataLabelConfig.font_size || 11

  const radius = Math.min(width, height) / 2
  const innerR = series.donut ? radius * 0.6 : 0
  const labelRadius = series.donut ? (innerR + radius - 8) / 2 : radius * 0.65

  const pie = d3.pie()
    .value(d => +d[series.data_key])
    .padAngle(series.pad_angle ?? 0.02)
    .sort(null)

  const labelArc = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius)
  const pieData = pie(data)

  const labelsG = g.select(".trackplot-pie")
  if (labelsG.empty()) return

  pieData.forEach(d => {
    const [x, y] = labelArc.centroid(d)
    labelsG.append("text")
      .attr("class", "trackplot-data-label")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", dataLabelConfig.position === "outside" ? t.text_color : "white")
      .attr("font-size", `${fontSize}px`)
      .attr("font-family", t.font || FONT)
      .attr("font-weight", "600")
      .text(fmt(+d.data[series.data_key]))
  })
}

// ─── Line Renderer ───────────────────────────────────────────────────────────

function renderLine(g, data, xScale, yScale, xKey, series, animate, chartElement) {
  const getX = xAccessorFor(xScale, xKey)
  const cls = sanitizeClass(series.data_key)

  const lineGen = d3.line()
    .x((d, i) => getX(d, i))
    .y(d => yScale(+d[series.data_key]))
    .defined(d => d[series.data_key] != null)

  if (series.curve) lineGen.curve(d3.curveMonotoneX)

  const path = g.append("path")
    .datum(data)
    .attr("class", `trackplot-line trackplot-line-${cls}`)
    .attr("fill", "none")
    .attr("stroke", series.color)
    .attr("stroke-width", series.stroke_width || 2)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("d", lineGen)

  if (series.dashed) path.attr("stroke-dasharray", "6 3")

  if (animate) {
    const len = path.node().getTotalLength()
    path
      .attr("stroke-dasharray", `${len} ${len}`)
      .attr("stroke-dashoffset", len)
      .transition().duration(DURATION).ease(EASE)
      .attr("stroke-dashoffset", 0)
      .on("end", function () {
        if (!series.dashed) d3.select(this).attr("stroke-dasharray", null)
      })
  }

  if (series.dot !== false) {
    const dotR = series.dot_size || 4
    const dots = g.selectAll(null)
      .data(data.filter(d => d[series.data_key] != null))
      .enter().append("circle")
      .attr("class", `trackplot-dot trackplot-dot-${cls}`)
      .attr("cx", (d, i) => getX(d, i))
      .attr("cy", d => yScale(+d[series.data_key]))
      .attr("fill", "white")
      .attr("stroke", series.color)
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("aria-label", d => `${seriesLabel(series)}: ${d[series.data_key]}`)

    if (animate) {
      dots.attr("r", 0).transition().delay(DURATION).duration(300).attr("r", dotR)
    } else {
      dots.attr("r", dotR)
    }

    if (chartElement) {
      dots.on("click", function (event, d) {
        const i = data.indexOf(d)
        dispatchClick(chartElement, {
          chartType: "line",
          dataKey: series.data_key,
          datum: d,
          index: i,
          value: d[series.data_key]
        })
      })
    }
  }
}

// ─── Bar Renderer ────────────────────────────────────────────────────────────

function renderBars(g, data, xScale, yScale, xKey, barSeries, animate, chartElement) {
  if (barSeries.length === 0) return

  // Separate stacked and grouped bars
  const stackGroups = {}
  const groupedSeries = []
  barSeries.forEach(s => {
    if (s.stack) {
      stackGroups[s.stack] = stackGroups[s.stack] || []
      stackGroups[s.stack].push(s)
    } else {
      groupedSeries.push(s)
    }
  })

  // Render stacked bars
  Object.entries(stackGroups).forEach(([, group]) => {
    renderStackedBars(g, data, xScale, yScale, xKey, group, animate, chartElement)
  })

  // Render grouped bars
  if (groupedSeries.length > 0) {
    const bandwidth = xScale.bandwidth()
    const subScale = d3.scaleBand()
      .domain(groupedSeries.map(s => s.data_key))
      .range([0, bandwidth])
      .padding(0.05)

    groupedSeries.forEach(series => {
      const cls = sanitizeClass(series.data_key)
      const radius = Math.min(series.radius ?? 4, subScale.bandwidth() / 2)

      const rects = g.selectAll(null)
        .data(data)
        .enter().append("rect")
        .attr("class", `trackplot-bar trackplot-bar-${cls}`)
        .attr("x", d => {
          const base = xKey ? xScale(d[xKey]) : xScale(data.indexOf(d))
          return base + subScale(series.data_key)
        })
        .attr("width", subScale.bandwidth())
        .attr("rx", radius)
        .attr("ry", radius)
        .attr("fill", series.color)
        .attr("opacity", series.opacity ?? 1)
        .attr("y", animate ? yScale(0) : d => yScale(+d[series.data_key] || 0))
        .attr("height", animate ? 0 : d => Math.max(0, yScale(0) - yScale(+d[series.data_key] || 0)))
        .attr("aria-label", d => `${seriesLabel(series)}: ${d[series.data_key]}`)
        .style("cursor", "pointer")
        .transition().duration(animate ? DURATION : 0).ease(EASE)
        .delay((_, i) => animate ? i * 40 : 0)
        .attr("y", d => yScale(+d[series.data_key] || 0))
        .attr("height", d => Math.max(0, yScale(0) - yScale(+d[series.data_key] || 0)))

      if (chartElement) {
        g.selectAll(`.trackplot-bar-${cls}`)
          .on("click", function (event, d) {
            const i = data.indexOf(d)
            dispatchClick(chartElement, {
              chartType: "bar",
              dataKey: series.data_key,
              datum: d,
              index: i,
              value: d[series.data_key]
            })
          })
      }
    })
  }
}

// ─── Stacked Bar Renderer ───────────────────────────────────────────────────

function renderStackedBars(g, data, xScale, yScale, xKey, stackedSeries, animate, chartElement) {
  const keys = stackedSeries.map(s => s.data_key)
  const stack = d3.stack().keys(keys)
  const stackedData = stack(data)

  const bandwidth = xScale.bandwidth()
  const barWidth = bandwidth * 0.8
  const barOffset = (bandwidth - barWidth) / 2

  stackedData.forEach((layer, idx) => {
    const series = stackedSeries[idx]
    const cls = sanitizeClass(series.data_key)
    const radius = idx === stackedData.length - 1 ? Math.min(series.radius ?? 4, barWidth / 2) : 0

    g.selectAll(null)
      .data(layer)
      .enter().append("rect")
      .attr("class", `trackplot-bar trackplot-stacked-bar trackplot-bar-${cls}`)
      .attr("x", (d, i) => {
        const base = xKey ? xScale(data[i][xKey]) : xScale(i)
        return base + barOffset
      })
      .attr("width", barWidth)
      .attr("rx", radius)
      .attr("ry", radius)
      .attr("fill", series.color)
      .attr("opacity", series.opacity ?? 1)
      .attr("y", animate ? yScale(0) : d => yScale(d[1]))
      .attr("height", animate ? 0 : d => Math.max(0, yScale(d[0]) - yScale(d[1])))
      .attr("aria-label", (d, i) => `${seriesLabel(series)}: ${data[i][series.data_key]}`)
      .style("cursor", "pointer")
      .transition().duration(animate ? DURATION : 0).ease(EASE)
      .delay((_, i) => animate ? i * 40 : 0)
      .attr("y", d => yScale(d[1]))
      .attr("height", d => Math.max(0, yScale(d[0]) - yScale(d[1])))

    if (chartElement) {
      g.selectAll(`.trackplot-bar-${cls}`)
        .on("click", function (event, d) {
          const i = layer.indexOf(d)
          dispatchClick(chartElement, {
            chartType: "bar",
            dataKey: series.data_key,
            datum: data[i],
            index: i,
            value: data[i][series.data_key]
          })
        })
    }
  })
}

// ─── Area Renderer ───────────────────────────────────────────────────────────

function renderArea(g, data, xScale, yScale, xKey, series, animate, chartElement) {
  const getX = xAccessorFor(xScale, xKey)
  const cls = sanitizeClass(series.data_key)
  const gradientId = `trackplot-grad-${cls}-${Math.random().toString(36).slice(2, 9)}`

  const defs = g.append("defs")
  const grad = defs.append("linearGradient")
    .attr("id", gradientId).attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%")
  grad.append("stop").attr("offset", "0%")
    .attr("stop-color", series.color).attr("stop-opacity", series.opacity || 0.3)
  grad.append("stop").attr("offset", "100%")
    .attr("stop-color", series.color).attr("stop-opacity", 0.05)

  const areaGen = d3.area()
    .x((d, i) => getX(d, i))
    .y0(yScale(0))
    .y1(d => yScale(+d[series.data_key]))
    .defined(d => d[series.data_key] != null)
  if (series.curve) areaGen.curve(d3.curveMonotoneX)

  const areaPath = g.append("path")
    .datum(data)
    .attr("class", `trackplot-area trackplot-area-${cls}`)
    .attr("fill", `url(#${gradientId})`)
    .attr("d", areaGen)

  if (animate) {
    areaPath.attr("opacity", 0).transition().duration(DURATION).ease(EASE).attr("opacity", 1)
  }

  const lineGen = d3.line()
    .x((d, i) => getX(d, i))
    .y(d => yScale(+d[series.data_key]))
    .defined(d => d[series.data_key] != null)
  if (series.curve) lineGen.curve(d3.curveMonotoneX)

  const linePath = g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", series.color)
    .attr("stroke-width", series.stroke_width || 2)
    .attr("d", lineGen)

  if (animate) {
    const len = linePath.node().getTotalLength()
    linePath
      .attr("stroke-dasharray", `${len} ${len}`)
      .attr("stroke-dashoffset", len)
      .transition().duration(DURATION).ease(EASE)
      .attr("stroke-dashoffset", 0)
      .on("end", function () { d3.select(this).attr("stroke-dasharray", null) })
  }
}

// ─── Stacked Area Renderer ───────────────────────────────────────────────────

function renderStackedAreas(g, data, xScale, yScale, xKey, stackedAreas, animate) {
  const keys = stackedAreas.map(s => s.data_key)
  const stack = d3.stack().keys(keys)
  const stackedData = stack(data)
  const getX = xAccessorFor(xScale, xKey)

  stackedData.forEach((layer, idx) => {
    const series = stackedAreas[idx]
    const cls = sanitizeClass(series.data_key)

    const areaGen = d3.area()
      .x((d, i) => getX(data[i], i))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
    if (series.curve) areaGen.curve(d3.curveMonotoneX)

    const path = g.append("path")
      .datum(layer)
      .attr("class", `trackplot-stacked-area trackplot-stacked-area-${cls}`)
      .attr("fill", series.color)
      .attr("fill-opacity", series.opacity || 0.6)
      .attr("stroke", series.color)
      .attr("stroke-width", 1.5)
      .attr("d", areaGen)

    if (animate) {
      path.attr("opacity", 0).transition().duration(DURATION).ease(EASE).attr("opacity", 1)
    }
  })
}

// ─── Scatter Renderer ────────────────────────────────────────────────────────

function renderScatter(g, data, xScale, yScale, xKey, series, animate, chartElement) {
  const xDataKey = series.x_key || xKey
  const cls = sanitizeClass(series.data_key)
  const dotR = series.dot_size || 5

  const valid = data.filter(d => d[series.data_key] != null && d[xDataKey] != null)

  const dots = g.selectAll(null)
    .data(valid)
    .enter().append("circle")
    .attr("class", `trackplot-scatter trackplot-scatter-${cls}`)
    .attr("cx", d => {
      if (xScale.bandwidth) return xScale(d[xDataKey]) + xScale.bandwidth() / 2
      return xScale(+d[xDataKey])
    })
    .attr("cy", d => yScale(+d[series.data_key]))
    .attr("fill", series.color)
    .attr("fill-opacity", series.opacity || 0.7)
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("aria-label", d => `${seriesLabel(series)}: ${d[series.data_key]}`)
    .style("cursor", "pointer")

  if (animate) {
    dots.attr("r", 0).transition().duration(DURATION).ease(EASE)
      .delay((_, i) => i * 15).attr("r", dotR)
  } else {
    dots.attr("r", dotR)
  }

  dots
    .on("mouseenter", function () {
      d3.select(this).transition().duration(150).attr("r", dotR * 1.4).attr("fill-opacity", 1)
    })
    .on("mouseleave", function () {
      d3.select(this).transition().duration(150).attr("r", dotR).attr("fill-opacity", series.opacity || 0.7)
    })

  if (chartElement) {
    dots.on("click", function (event, d) {
      const i = data.indexOf(d)
      dispatchClick(chartElement, {
        chartType: "scatter",
        dataKey: series.data_key,
        datum: d,
        index: i,
        value: d[series.data_key]
      })
    })
  }
}

// ─── Horizontal Bar Renderer ─────────────────────────────────────────────────

function renderHorizontalBars(g, data, xScale, yScale, yKey, barSeries, animate, chartElement) {
  if (barSeries.length === 0) return

  const bandwidth = yScale.bandwidth()
  const subScale = d3.scaleBand()
    .domain(barSeries.map(s => s.data_key))
    .range([0, bandwidth])
    .padding(0.05)

  barSeries.forEach(series => {
    const cls = sanitizeClass(series.data_key)
    const radius = Math.min(series.radius ?? 4, subScale.bandwidth() / 2)

    g.selectAll(null)
      .data(data)
      .enter().append("rect")
      .attr("class", `trackplot-hbar trackplot-hbar-${cls}`)
      .attr("y", d => yScale(d[yKey]) + subScale(series.data_key))
      .attr("height", subScale.bandwidth())
      .attr("x", 0)
      .attr("rx", radius)
      .attr("ry", radius)
      .attr("fill", series.color)
      .attr("opacity", series.opacity ?? 1)
      .attr("aria-label", d => `${seriesLabel(series)}: ${d[series.data_key]}`)
      .style("cursor", "pointer")
      .attr("width", animate ? 0 : d => Math.max(0, xScale(+d[series.data_key] || 0)))
      .transition().duration(animate ? DURATION : 0).ease(EASE)
      .delay((_, i) => animate ? i * 40 : 0)
      .attr("width", d => Math.max(0, xScale(+d[series.data_key] || 0)))

    if (chartElement) {
      g.selectAll(`.trackplot-hbar-${cls}`)
        .on("click", function (event, d) {
          const i = data.indexOf(d)
          dispatchClick(chartElement, {
            chartType: "horizontal_bar",
            dataKey: series.data_key,
            datum: d,
            index: i,
            value: d[series.data_key]
          })
        })
    }
  })
}

// ─── Candlestick Renderer ────────────────────────────────────────────────────

function renderCandlestick(g, data, xScale, yScale, xKey, series, animate, chartElement) {
  const getX = xAccessorFor(xScale, xKey)
  const candleWidth = xScale.bandwidth ? xScale.bandwidth() * 0.6 : 8

  data.forEach((d, i) => {
    const open = +d[series.open]
    const high = +d[series.high]
    const low = +d[series.low]
    const close = +d[series.close]
    const x = getX(d, i)
    const isUp = close >= open
    const color = isUp ? (series.up_color || "#10b981") : (series.down_color || "#ef4444")

    // Wick
    const wick = g.append("line")
      .attr("class", "trackplot-wick")
      .attr("aria-hidden", "true")
      .attr("x1", x).attr("x2", x)
      .attr("y1", yScale(high)).attr("y2", yScale(low))
      .attr("stroke", color).attr("stroke-width", 1.5)

    // Body
    const bodyTop = yScale(Math.max(open, close))
    const bodyH = Math.max(1, Math.abs(yScale(open) - yScale(close)))

    const body = g.append("rect")
      .attr("class", "trackplot-candle")
      .attr("x", x - candleWidth / 2)
      .attr("y", bodyTop)
      .attr("width", candleWidth)
      .attr("height", bodyH)
      .attr("fill", isUp ? color : color)
      .attr("stroke", color)
      .attr("stroke-width", 1)
      .attr("rx", 1.5)
      .attr("aria-label", `O:${open} H:${high} L:${low} C:${close}`)
      .style("cursor", "pointer")

    if (animate) {
      wick.attr("opacity", 0).transition().delay(i * 20).duration(300).attr("opacity", 1)
      body.attr("opacity", 0).transition().delay(i * 20).duration(300).attr("opacity", 1)
    }

    if (chartElement) {
      body.on("click", function () {
        dispatchClick(chartElement, {
          chartType: "candlestick",
          dataKey: null,
          datum: d,
          index: i,
          value: { open, high, low, close }
        })
      })
    }
  })
}

// ─── Pie Renderer ────────────────────────────────────────────────────────────

function renderPieSlices(g, data, series, width, height, animate, theme, chartElement) {
  const t = theme || DEFAULT_THEME
  const radius = Math.min(width, height) / 2
  const innerR = series.donut ? radius * 0.6 : 0

  const pie = d3.pie()
    .value(d => +d[series.data_key])
    .padAngle(series.pad_angle ?? 0.02)
    .sort(null)

  const arc = d3.arc().innerRadius(innerR).outerRadius(radius - 8).cornerRadius(3)
  const arcHover = d3.arc().innerRadius(innerR).outerRadius(radius - 2).cornerRadius(3)

  const center = g.append("g")
    .attr("class", "trackplot-pie")
    .attr("transform", `translate(${width / 2},${height / 2})`)

  const pieData = pie(data)

  const slices = center.selectAll("path")
    .data(pieData)
    .enter().append("path")
    .attr("fill", (_, i) => t.colors[i % t.colors.length])
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("aria-label", d => `${series.label_key ? d.data[series.label_key] : ""}: ${d.data[series.data_key]}`)
    .style("cursor", "pointer")

  if (animate) {
    const zeroArc = d3.arc().innerRadius(innerR).outerRadius(innerR).cornerRadius(3)
    slices
      .attr("d", zeroArc)
      .transition().duration(DURATION).ease(EASE)
      .attrTween("d", function (d) {
        const interp = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d)
        return t => arc(interp(t))
      })
  } else {
    slices.attr("d", arc)
  }

  slices
    .on("mouseenter", function (_, d) {
      d3.select(this).transition().duration(150).attr("d", arcHover(d))
    })
    .on("mouseleave", function (_, d) {
      d3.select(this).transition().duration(150).attr("d", arc(d))
    })

  if (chartElement) {
    slices.on("click", function (event, d) {
      dispatchClick(chartElement, {
        chartType: "pie",
        dataKey: series.data_key,
        datum: d.data,
        index: d.index,
        value: d.data[series.data_key]
      })
    })
  }
}

// ─── Radar Renderer ──────────────────────────────────────────────────────────

function renderRadarChart(g, data, radarSeries, labelKey, width, height, animate, theme, chartElement) {
  const t = theme || DEFAULT_THEME
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) / 2 - 40
  const categories = data.map(d => labelKey ? d[labelKey] : "")
  const n = categories.length
  if (n === 0) return
  const angleSlice = (2 * Math.PI) / n

  let maxVal = 0
  radarSeries.forEach(s => {
    data.forEach(d => {
      const v = +d[s.data_key] || 0
      if (v > maxVal) maxVal = v
    })
  })
  if (maxVal === 0) maxVal = 1
  const rScale = d3.scaleLinear().domain([0, maxVal]).range([0, radius])

  const center = g.append("g")
    .attr("class", "trackplot-radar")
    .attr("transform", `translate(${cx},${cy})`)

  // Grid rings
  const levels = 5
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (radius / levels) * lvl
    const pts = categories.map((_, j) => {
      const a = angleSlice * j - Math.PI / 2
      return [r * Math.cos(a), r * Math.sin(a)]
    })
    center.append("polygon")
      .attr("points", pts.map(p => p.join(",")).join(" "))
      .attr("fill", "none")
      .attr("stroke", t.grid_color)
      .attr("stroke-width", lvl === levels ? 1.5 : 0.8)
      .attr("aria-hidden", "true")

    // Level label
    if (lvl < levels) {
      center.append("text")
        .attr("x", 4).attr("y", -r + 4)
        .attr("fill", t.axis_color).attr("font-size", "10px").attr("font-family", t.font || FONT)
        .text(Math.round((maxVal / levels) * lvl))
    }
  }

  // Axis spokes + labels
  categories.forEach((cat, i) => {
    const a = angleSlice * i - Math.PI / 2
    const x = radius * Math.cos(a)
    const y = radius * Math.sin(a)

    center.append("line")
      .attr("x1", 0).attr("y1", 0).attr("x2", x).attr("y2", y)
      .attr("stroke", t.axis_color).attr("stroke-width", 0.8)
      .attr("aria-hidden", "true")

    const lx = (radius + 18) * Math.cos(a)
    const ly = (radius + 18) * Math.sin(a)
    center.append("text")
      .attr("x", lx).attr("y", ly)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", t.text_color).attr("font-size", "12px").attr("font-family", t.font || FONT)
      .text(cat)
  })

  // Series polygons
  radarSeries.forEach(series => {
    const pts = data.map((d, i) => {
      const a = angleSlice * i - Math.PI / 2
      const r = rScale(+d[series.data_key] || 0)
      return [r * Math.cos(a), r * Math.sin(a)]
    })

    const polygon = center.append("polygon")
      .attr("points", pts.map(p => p.join(",")).join(" "))
      .attr("fill", series.color)
      .attr("fill-opacity", series.opacity || 0.15)
      .attr("stroke", series.color)
      .attr("stroke-width", series.stroke_width || 2)
      .attr("stroke-linejoin", "round")

    if (animate) {
      polygon.attr("opacity", 0).transition().duration(DURATION).ease(EASE).attr("opacity", 1)
    }

    // Dots
    if (series.dot !== false) {
      const dotR = series.dot_size || 4
      pts.forEach((p, i) => {
        const dot = center.append("circle")
          .attr("class", `trackplot-radar-dot`)
          .attr("cx", p[0]).attr("cy", p[1])
          .attr("fill", "white").attr("stroke", series.color).attr("stroke-width", 2)
          .attr("aria-label", `${categories[i]}: ${data[i][series.data_key]}`)
          .style("cursor", "pointer")

        if (animate) {
          dot.attr("r", 0).transition().delay(DURATION).duration(200).attr("r", dotR)
        } else {
          dot.attr("r", dotR)
        }

        // Hover
        dot
          .on("mouseenter", function () { d3.select(this).transition().duration(100).attr("r", dotR * 1.5).attr("fill", series.color) })
          .on("mouseleave", function () { d3.select(this).transition().duration(100).attr("r", dotR).attr("fill", "white") })

        if (chartElement) {
          dot.on("click", function () {
            dispatchClick(chartElement, {
              chartType: "radar",
              dataKey: series.data_key,
              datum: data[i],
              index: i,
              value: data[i][series.data_key]
            })
          })
        }
      })
    }
  })
}

// ─── Funnel Renderer ─────────────────────────────────────────────────────────

function renderFunnelChart(g, data, series, width, height, animate, theme, chartElement) {
  const t = theme || DEFAULT_THEME
  const labelKey = series.label_key
  const maxVal = d3.max(data, d => +d[series.data_key]) || 1
  const n = data.length
  const gap = 3
  const stageH = (height - gap * (n - 1)) / n
  const maxW = width * 0.85
  const cx = width / 2

  data.forEach((d, i) => {
    const val = +d[series.data_key]
    const nextVal = i < n - 1 ? +data[i + 1][series.data_key] : val * 0.6
    const topW = (val / maxVal) * maxW
    const botW = (nextVal / maxVal) * maxW
    const y = i * (stageH + gap)
    const color = t.colors[i % t.colors.length]

    const path = [
      `M${cx - topW / 2},${y}`,
      `L${cx + topW / 2},${y}`,
      `L${cx + botW / 2},${y + stageH}`,
      `L${cx - botW / 2},${y + stageH}`,
      "Z"
    ].join(" ")

    const stage = g.append("path")
      .attr("class", "trackplot-funnel-stage")
      .attr("d", path)
      .attr("fill", color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("aria-label", `${labelKey ? d[labelKey] : `Stage ${i + 1}`}: ${val}`)
      .style("cursor", "pointer")

    if (animate) {
      stage.attr("opacity", 0).transition().delay(i * 80).duration(400).ease(EASE).attr("opacity", 1)
    }

    // Hover
    stage
      .on("mouseenter", function () { d3.select(this).transition().duration(150).attr("opacity", 0.85) })
      .on("mouseleave", function () { d3.select(this).transition().duration(150).attr("opacity", 1) })

    if (chartElement) {
      stage.on("click", function () {
        dispatchClick(chartElement, {
          chartType: "funnel",
          dataKey: series.data_key,
          datum: d,
          index: i,
          value: val
        })
      })
    }

    // Label
    const label = labelKey ? d[labelKey] : `Stage ${i + 1}`
    const textEl = g.append("text")
      .attr("x", cx).attr("y", y + stageH / 2)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", "white").attr("font-weight", "600")
      .attr("font-size", "13px").attr("font-family", t.font || FONT)
      .text(`${label} — ${val}`)

    if (animate) {
      textEl.attr("opacity", 0).transition().delay(i * 80 + 200).duration(300).attr("opacity", 1)
    }
  })
}

// ─── Heatmap Renderer ───────────────────────────────────────────────────────

function renderHeatmapChart(g, data, config, width, height, theme, chartElement) {
  const t = theme || DEFAULT_THEME
  const xKey = config.x_key
  const yKey = config.y_key
  const valueKey = config.value_key
  const colorRange = config.color_range || ["#f0f9ff", "#1e40af"]
  const radius = config.radius || 2

  const xDomain = [...new Set(data.map(d => d[xKey]))]
  const yDomain = [...new Set(data.map(d => d[yKey]))]

  const xScale = d3.scaleBand().domain(xDomain).range([0, width]).padding(0.05)
  const yScale = d3.scaleBand().domain(yDomain).range([0, height]).padding(0.05)

  const extent = d3.extent(data, d => +d[valueKey])
  const colorScale = d3.scaleSequential()
    .domain(extent)
    .interpolator(d3.interpolateRgb(colorRange[0], colorRange[1]))

  // Render cells
  g.selectAll(null)
    .data(data)
    .enter().append("rect")
    .attr("class", "trackplot-heatmap-cell")
    .attr("x", d => xScale(d[xKey]))
    .attr("y", d => yScale(d[yKey]))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("rx", radius)
    .attr("ry", radius)
    .attr("fill", d => colorScale(+d[valueKey]))
    .attr("aria-label", d => `${d[xKey]}, ${d[yKey]}: ${d[valueKey]}`)
    .style("cursor", "pointer")

  // X axis
  const xG = g.append("g")
    .attr("class", "trackplot-axis-x")
    .attr("transform", `translate(0,${height})`)
  xG.call(d3.axisBottom(xScale))
  xG.selectAll("text").attr("fill", t.text_color).attr("font-size", "11px").attr("font-family", t.font || FONT)
  xG.selectAll("line").attr("stroke", t.axis_color)
  xG.select(".domain").attr("stroke", t.axis_color)

  // Y axis
  const yG = g.append("g").attr("class", "trackplot-axis-y")
  yG.call(d3.axisLeft(yScale))
  yG.selectAll("text").attr("fill", t.text_color).attr("font-size", "11px").attr("font-family", t.font || FONT)
  yG.selectAll("line").attr("stroke", t.axis_color)
  yG.select(".domain").attr("stroke", t.axis_color)

  if (chartElement) {
    g.selectAll(".trackplot-heatmap-cell")
      .on("click", function (event, d) {
        dispatchClick(chartElement, {
          chartType: "heatmap",
          dataKey: valueKey,
          datum: d,
          index: data.indexOf(d),
          value: d[valueKey]
        })
      })
  }
}

// ─── Treemap Renderer ───────────────────────────────────────────────────────

function renderTreemapChart(g, data, config, width, height, theme, chartElement) {
  const t = theme || DEFAULT_THEME
  const valueKey = config.value_key
  const labelKey = config.label_key
  const parentKey = config.parent_key

  let root
  if (parentKey) {
    // Build hierarchy from parent_key
    const grouped = d3.group(data, d => d[parentKey])
    const children = Array.from(grouped, ([key, values]) => ({
      name: key,
      children: values.map(v => ({ name: labelKey ? v[labelKey] : "", value: +v[valueKey], _data: v }))
    }))
    root = d3.hierarchy({ name: "root", children })
      .sum(d => d.value || 0)
  } else {
    // Flat data
    const children = data.map(d => ({ name: labelKey ? d[labelKey] : "", value: +d[valueKey], _data: d }))
    root = d3.hierarchy({ name: "root", children })
      .sum(d => d.value || 0)
  }

  d3.treemap()
    .size([width, height])
    .padding(2)
    .round(true)(root)

  const themeColors = t.colors || COLORS
  const leaves = root.leaves()

  const cells = g.selectAll(null)
    .data(leaves)
    .enter().append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`)

  cells.append("rect")
    .attr("class", "trackplot-treemap-cell")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", (_, i) => themeColors[i % themeColors.length])
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("aria-label", d => `${d.data.name}: ${d.value}`)
    .style("cursor", "pointer")

  // Labels
  cells.append("text")
    .attr("x", 6)
    .attr("y", 16)
    .attr("fill", "white")
    .attr("font-size", d => {
      const w = d.x1 - d.x0
      const h = d.y1 - d.y0
      return w > 60 && h > 24 ? "12px" : w > 40 && h > 18 ? "10px" : "0px"
    })
    .attr("font-family", t.font || FONT)
    .attr("font-weight", "600")
    .text(d => d.data.name)
    .each(function (d) {
      const maxW = d.x1 - d.x0 - 12
      const node = d3.select(this)
      if (node.node().getComputedTextLength() > maxW) {
        const text = d.data.name
        for (let i = text.length - 1; i >= 0; i--) {
          node.text(text.slice(0, i) + "…")
          if (node.node().getComputedTextLength() <= maxW) break
        }
      }
    })

  // Value labels
  cells.append("text")
    .attr("x", 6)
    .attr("y", 30)
    .attr("fill", "rgba(255,255,255,0.75)")
    .attr("font-size", d => {
      const w = d.x1 - d.x0
      const h = d.y1 - d.y0
      return w > 50 && h > 36 ? "10px" : "0px"
    })
    .attr("font-family", t.font || FONT)
    .text(d => d.value)

  if (chartElement) {
    cells.select("rect")
      .on("click", function (event, d) {
        const datum = d.data._data || d.data
        dispatchClick(chartElement, {
          chartType: "treemap",
          dataKey: valueKey,
          datum: datum,
          index: leaves.indexOf(d),
          value: d.value
        })
      })
  }
}

// ─── Brush Renderer ─────────────────────────────────────────────────────────

function setupBrush(svg, g, data, xScale, yScale, xKey, chart, width, height, margin, brushConfig) {
  const brushHeight = brushConfig.height || 40
  const brushMarginTop = 8

  const brushG = svg.append("g")
    .attr("class", "trackplot-brush")
    .attr("transform", `translate(${margin.left},${height + margin.top + brushMarginTop})`)

  const brushXScale = xScale.copy()
  const brush = d3.brushX()
    .extent([[0, 0], [width, brushHeight]])
    .on("end", function (event) {
      if (!event.selection) {
        // Reset on double-click / clear
        chart._brushDomain = null
        chart.animate = false
        chart.render()
        return
      }

      const [x0, x1] = event.selection

      if (xScale.bandwidth) {
        // Band scale: find which bands fall in range
        const domain = xScale.domain()
        const filtered = domain.filter(d => {
          const pos = xScale(d) + xScale.bandwidth() / 2
          return pos >= x0 && pos <= x1
        })
        if (filtered.length > 0) {
          chart._brushDomain = filtered
          chart.animate = false
          chart.render()
        }
      } else {
        const d0 = xScale.invert(x0)
        const d1 = xScale.invert(x1)
        chart._brushDomain = [d0, d1]
        chart.animate = false
        chart.render()
      }
    })

  // Mini preview area
  const miniYScale = d3.scaleLinear()
    .domain(yScale.domain())
    .range([brushHeight, 0])

  const seriesWithData = chart.seriesList.filter(s => s.data_key && CARTESIAN_TYPES.includes(s.type))
  if (seriesWithData.length > 0) {
    const firstSeries = seriesWithData[0]
    const getX = xAccessorFor(brushXScale, xKey)
    const miniLine = d3.line()
      .x((d, i) => getX(d, i))
      .y(d => miniYScale(+d[firstSeries.data_key] || 0))
      .defined(d => d[firstSeries.data_key] != null)

    brushG.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", firstSeries.color || "#6366f1")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.5)
      .attr("d", miniLine)
  }

  brushG.append("g").call(brush)
}

// ─── Cartesian Tooltip ───────────────────────────────────────────────────────

function setupCartesianTooltip(element, g, data, xScale, yScale, xKey, series, config, width, height, margin, theme) {
  const t = theme || DEFAULT_THEME
  const tooltip = createTooltipDiv(element, t)
  const getX = xAccessorFor(xScale, xKey)
  const fmtValue = resolveFormatter(config.format)

  const crosshair = g.append("line")
    .attr("class", "trackplot-crosshair")
    .attr("aria-hidden", "true")
    .attr("stroke", t.axis_color).attr("stroke-width", 1).attr("stroke-dasharray", "4 3")
    .attr("y1", 0).attr("y2", height)
    .style("opacity", 0)

  g.append("rect")
    .attr("class", "trackplot-overlay")
    .attr("width", width).attr("height", height)
    .attr("fill", "transparent").style("cursor", "crosshair")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this)
      const idx = findNearestIndex(mx, data, getX)
      const xPos = getX(data[idx], idx)
      const d = data[idx]

      crosshair.attr("x1", xPos).attr("x2", xPos).style("opacity", 1)

      series.forEach(s => {
        if (!s.data_key) return
        const cls = sanitizeClass(s.data_key)
        const dotR = s.dot_size || 4
        g.selectAll(`.trackplot-dot-${cls}`)
          .attr("r", (dd, i) => i === idx ? dotR * 1.5 : dotR)
          .attr("fill", (dd, i) => i === idx ? s.color : "white")
      })

      const label = xKey ? d[xKey] : `#${idx}`
      let html = `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:4px">${label}</div>`

      series.forEach(s => {
        if (s.type === "candlestick") {
          const o = d[s.open], h = d[s.high], l = d[s.low], c = d[s.close]
          html += `<div style="color:${t.text_color};display:grid;grid-template-columns:auto auto;gap:0 12px">`
          html += `<span>Open:</span><span style="font-weight:500;color:${t.tooltip_text}">${fmtValue(+o)}</span>`
          html += `<span>High:</span><span style="font-weight:500;color:${t.tooltip_text}">${fmtValue(+h)}</span>`
          html += `<span>Low:</span><span style="font-weight:500;color:${t.tooltip_text}">${fmtValue(+l)}</span>`
          html += `<span>Close:</span><span style="font-weight:500;color:${t.tooltip_text}">${fmtValue(+c)}</span>`
          html += `</div>`
        } else if (s.data_key) {
          const val = d[s.data_key]
          if (val != null) {
            const formatted = isNaN(+val) ? val : fmtValue(+val)
            html += `<div style="display:flex;align-items:center;gap:8px">`
            html += `<span style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></span>`
            html += `<span style="color:${t.text_color}">${seriesLabel(s)}</span>`
            html += `<span style="font-weight:500;color:${t.tooltip_text};margin-left:auto;padding-left:12px">${formatted}</span>`
            html += `</div>`
          }
        }
      })
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"

      const tipRect = tooltip.getBoundingClientRect()
      const elRect = element.getBoundingClientRect()
      let left = xPos + margin.left + 16
      if (left + tipRect.width > elRect.width - 8) {
        left = xPos + margin.left - tipRect.width - 16
      }
      const [, my] = d3.pointer(event, element)
      let top = my - tipRect.height / 2
      top = Math.max(8, Math.min(top, elRect.height - tipRect.height - 8))
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
    })
    .on("mouseleave", function () {
      tooltip.style.opacity = "0"
      crosshair.style("opacity", 0)
      series.forEach(s => {
        if (!s.data_key) return
        const cls = sanitizeClass(s.data_key)
        const dotR = s.dot_size || 4
        g.selectAll(`.trackplot-dot-${cls}`).attr("r", dotR).attr("fill", "white")
      })
    })
}

// ─── Pie Tooltip ─────────────────────────────────────────────────────────────

function setupPieTooltip(element, g, data, series, config, theme) {
  const t = theme || DEFAULT_THEME
  const tooltip = createTooltipDiv(element, t)
  const total = d3.sum(data, d => +d[series.data_key])
  const labelKey = series.label_key

  g.selectAll(".trackplot-pie path")
    .on("mouseenter.tooltip", function (event, d) {
      const val = +d.data[series.data_key]
      const pct = ((val / total) * 100).toFixed(1)
      const name = labelKey ? d.data[labelKey] : ""
      let html = ""
      if (name) html += `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:2px">${name}</div>`
      html += `<div style="color:${t.text_color}">${val} <span style="color:${t.axis_color}">(${pct}%)</span></div>`
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"
    })
    .on("mousemove.tooltip", function (event) {
      const [x, y] = d3.pointer(event, element)
      tooltip.style.left = `${x + 16}px`
      tooltip.style.top = `${y - 16}px`
    })
    .on("mouseleave.tooltip", function () {
      tooltip.style.opacity = "0"
    })
}

// ─── Radar Tooltip ───────────────────────────────────────────────────────────

function setupRadarTooltip(element, g, data, radarSeries, labelKey, config, theme) {
  const t = theme || DEFAULT_THEME
  const tooltip = createTooltipDiv(element, t)

  g.selectAll(".trackplot-radar-dot")
    .on("mouseenter.tooltip", function (event) {
      const [mx, my] = d3.pointer(event, element)

      const allDots = g.selectAll(".trackplot-radar-dot").nodes()
      const dotIndex = allDots.indexOf(this)
      const totalPoints = data.length
      const seriesIdx = Math.floor(dotIndex / totalPoints)
      const pointIdx = dotIndex % totalPoints

      const series = radarSeries[seriesIdx]
      const d = data[pointIdx]
      if (!series || !d) return

      const cat = labelKey ? d[labelKey] : `#${pointIdx}`
      let html = `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:2px">${cat}</div>`
      html += `<div style="display:flex;align-items:center;gap:8px">`
      html += `<span style="width:8px;height:8px;border-radius:50%;background:${series.color};flex-shrink:0"></span>`
      html += `<span style="color:${t.text_color}">${seriesLabel(series)}</span>`
      html += `<span style="font-weight:500;color:${t.tooltip_text};margin-left:auto;padding-left:12px">${d[series.data_key]}</span>`
      html += `</div>`
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"
      tooltip.style.left = `${mx + 16}px`
      tooltip.style.top = `${my - 16}px`
    })
    .on("mouseleave.tooltip", function () {
      tooltip.style.opacity = "0"
    })
}

// ─── Funnel Tooltip ──────────────────────────────────────────────────────────

function setupFunnelTooltip(element, g, data, series, config, theme) {
  const t = theme || DEFAULT_THEME
  const tooltip = createTooltipDiv(element, t)
  const labelKey = series.label_key
  const total = +data[0]?.[series.data_key] || 1

  g.selectAll(".trackplot-funnel-stage")
    .on("mouseenter.tooltip", function (event, d, i) {
      const stages = g.selectAll(".trackplot-funnel-stage").nodes()
      const idx = stages.indexOf(this)
      const datum = data[idx]
      if (!datum) return

      const val = +datum[series.data_key]
      const pct = ((val / total) * 100).toFixed(1)
      const name = labelKey ? datum[labelKey] : `Stage ${idx + 1}`

      let html = `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:2px">${name}</div>`
      html += `<div style="color:${t.text_color}">${val} <span style="color:${t.axis_color}">(${pct}% of first)</span></div>`
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"
    })
    .on("mousemove.tooltip", function (event) {
      const [x, y] = d3.pointer(event, element)
      tooltip.style.left = `${x + 16}px`
      tooltip.style.top = `${y - 16}px`
    })
    .on("mouseleave.tooltip", function () {
      tooltip.style.opacity = "0"
    })
}

// ─── Heatmap Tooltip ────────────────────────────────────────────────────────

function setupHeatmapTooltip(element, g, data, config, theme) {
  const t = theme || DEFAULT_THEME
  const tooltip = createTooltipDiv(element, t)

  g.selectAll(".trackplot-heatmap-cell")
    .on("mouseenter.tooltip", function (event, d) {
      const xVal = d[config.x_key]
      const yVal = d[config.y_key]
      const val = d[config.value_key]
      let html = `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:2px">${xVal}, ${yVal}</div>`
      html += `<div style="color:${t.text_color}">${val}</div>`
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"
    })
    .on("mousemove.tooltip", function (event) {
      const [x, y] = d3.pointer(event, element)
      tooltip.style.left = `${x + 16}px`
      tooltip.style.top = `${y - 16}px`
    })
    .on("mouseleave.tooltip", function () {
      tooltip.style.opacity = "0"
    })
}

// ─── Treemap Tooltip ────────────────────────────────────────────────────────

function setupTreemapTooltip(element, g, data, config, theme) {
  const t = theme || DEFAULT_THEME
  const tooltip = createTooltipDiv(element, t)

  g.selectAll(".trackplot-treemap-cell")
    .on("mouseenter.tooltip", function (event) {
      const parent = d3.select(this.parentNode)
      const d = parent.datum()
      if (!d) return
      const name = d.data.name || ""
      const val = d.value
      let html = ""
      if (name) html += `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:2px">${name}</div>`
      html += `<div style="color:${t.text_color}">${val}</div>`
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"
    })
    .on("mousemove.tooltip", function (event) {
      const [x, y] = d3.pointer(event, element)
      tooltip.style.left = `${x + 16}px`
      tooltip.style.top = `${y - 16}px`
    })
    .on("mouseleave.tooltip", function () {
      tooltip.style.opacity = "0"
    })
}

// ─── Legend Renderer ─────────────────────────────────────────────────────────

function renderLegend(element, items, config, theme) {
  const t = theme || DEFAULT_THEME
  const legend = document.createElement("div")
  Object.assign(legend.style, {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    padding: "8px 0 0",
    fontFamily: t.font || FONT,
    fontSize: "13px"
  })

  items.forEach(item => {
    const el = document.createElement("div")
    Object.assign(el.style, {
      display: "flex", alignItems: "center", gap: "6px",
      cursor: config.clickable !== false ? "pointer" : "default",
      userSelect: "none", transition: "opacity 0.2s ease"
    })

    const dot = document.createElement("span")
    Object.assign(dot.style, {
      width: "10px", height: "10px", borderRadius: "50%",
      background: item.color, flexShrink: "0"
    })
    const label = document.createElement("span")
    label.textContent = seriesLabel(item)
    label.style.color = t.text_color

    el.appendChild(dot)
    el.appendChild(label)
    legend.appendChild(el)
  })

  if (config.position === "top") {
    element.insertBefore(legend, element.firstChild)
  } else {
    element.appendChild(legend)
  }
}

// ─── Empty State Renderer ───────────────────────────────────────────────────

function renderEmptyState(element, message, theme) {
  const t = theme || DEFAULT_THEME
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const svg = d3.select(element)
    .append("svg")
    .attr("width", rect.width)
    .attr("height", rect.height)
    .attr("role", "img")
    .attr("aria-label", message)

  // Icon (empty chart placeholder)
  const cx = rect.width / 2
  const cy = rect.height / 2 - 12
  const iconG = svg.append("g")
    .attr("transform", `translate(${cx - 20},${cy - 24})`)
    .attr("aria-hidden", "true")

  iconG.append("rect")
    .attr("x", 0).attr("y", 24).attr("width", 8).attr("height", 16)
    .attr("rx", 2).attr("fill", t.axis_color).attr("opacity", 0.4)
  iconG.append("rect")
    .attr("x", 12).attr("y", 16).attr("width", 8).attr("height", 24)
    .attr("rx", 2).attr("fill", t.axis_color).attr("opacity", 0.4)
  iconG.append("rect")
    .attr("x", 24).attr("y", 8).attr("width", 8).attr("height", 32)
    .attr("rx", 2).attr("fill", t.axis_color).attr("opacity", 0.4)
  iconG.append("rect")
    .attr("x", 36).attr("y", 20).attr("width", 8).attr("height", 20)
    .attr("rx", 2).attr("fill", t.axis_color).attr("opacity", 0.4)

  svg.append("text")
    .attr("x", cx)
    .attr("y", cy + 32)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", t.axis_color)
    .attr("font-size", "14px")
    .attr("font-family", t.font || FONT)
    .text(message)
}

// ─── Chart Class ─────────────────────────────────────────────────────────────

class Chart {
  constructor(element, config) {
    this.element = element
    this.data = config.data || []
    this.components = config.components || []
    this.animate = config.animate !== false
    this.margin = { ...DEFAULT_MARGIN }
    this.theme = config.theme || DEFAULT_THEME
    this.chartConfig = config

    this.seriesList = this.components.filter(c => ALL_SERIES_TYPES.includes(c.type))
    this.axesList = this.components.filter(c => c.type === "axis")
    this.gridConfig = this.components.find(c => c.type === "grid")
    this.tooltipConfig = this.components.find(c => c.type === "tooltip")
    this.legendConfig = this.components.find(c => c.type === "legend")
    this.referenceLines = this.components.filter(c => c.type === "reference_line")
    this.dataLabelConfig = this.components.find(c => c.type === "data_label")
    this.brushConfig = this.components.find(c => c.type === "brush")

    const themeColors = this.theme.colors || COLORS
    this.seriesList.forEach((s, i) => { s.color = s.color || themeColors[i % themeColors.length] })
    this.isPie = this.seriesList.some(s => s.type === "pie")
    this.isRadar = this.seriesList.some(s => s.type === "radar")
    this.isFunnel = this.seriesList.some(s => s.type === "funnel")
    this.isHorizontal = this.seriesList.some(s => s.type === "horizontal_bar")
    this.isHeatmap = this.seriesList.some(s => s.type === "heatmap")
    this.isTreemap = this.seriesList.some(s => s.type === "treemap")
    this.xKey = getXKey(this.components)

    // Apply theme background
    if (this.theme.background && this.theme.background !== "transparent") {
      this.element.style.background = this.theme.background
      this.element.style.borderRadius = "8px"
    }
  }

  render() {
    this.clear()

    if (this.data.length === 0) {
      const message = this.chartConfig.empty_message || "No data available"
      renderEmptyState(this.element, message, this.theme)
      return
    }

    const rect = this.element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    if (this.isHeatmap) this.renderHeatmap(rect.width, rect.height)
    else if (this.isTreemap) this.renderTreemap(rect.width, rect.height)
    else if (this.isRadar) this.renderRadar(rect.width, rect.height)
    else if (this.isFunnel) this.renderFunnel(rect.width, rect.height)
    else if (this.isPie) this.renderPie(rect.width, rect.height)
    else if (this.isHorizontal) this.renderHorizontalCartesian(rect.width, rect.height)
    else this.renderCartesian(rect.width, rect.height)
  }

  renderCartesian(totalW, totalH) {
    const legendH = this.legendConfig ? 32 : 0
    const brushH = this.brushConfig ? (this.brushConfig.height || 40) + 16 : 0
    const hasRightAxis = this.axesList.some(a => a.axis_id === "right")
    const m = { ...this.margin }
    if (hasRightAxis) m.right = Math.max(m.right, 52)

    const w = totalW - m.left - m.right
    const h = totalH - m.top - m.bottom - legendH - brushH
    if (w <= 0 || h <= 0) return

    const svgH = totalH - legendH
    const svg = d3.select(this.element)
      .append("svg").attr("width", totalW).attr("height", svgH)

    // Accessibility
    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`)

    // Apply brush domain filtering if active
    let data = this.data
    if (this._brushDomain) {
      if (Array.isArray(this._brushDomain) && typeof this._brushDomain[0] === "number") {
        data = data.filter(d => {
          const v = +d[this.xKey]
          return v >= this._brushDomain[0] && v <= this._brushDomain[1]
        })
      } else if (Array.isArray(this._brushDomain)) {
        data = data.filter(d => this._brushDomain.includes(d[this.xKey]))
      }
    }

    const hasBars = this.seriesList.some(s => s.type === "bar")
    const hasScatter = this.seriesList.some(s => s.type === "scatter")
    let scaleType = hasBars ? "band" : detectScaleType(data, this.xKey)
    if (hasScatter && !hasBars && scaleType === "band") scaleType = "band"
    const xScale = createXScale(data, this.xKey, scaleType, w)

    // Split series by y-axis
    const leftSeries = this.seriesList.filter(s => CARTESIAN_TYPES.includes(s.type) && s.y_axis !== "right")
    const rightSeries = this.seriesList.filter(s => CARTESIAN_TYPES.includes(s.type) && s.y_axis === "right")
    const cartesianSeries = this.seriesList.filter(s => CARTESIAN_TYPES.includes(s.type))

    const yScale = createYScale(data, leftSeries.length > 0 ? leftSeries : cartesianSeries, h)
    const yScaleRight = rightSeries.length > 0 ? createYScaleRight(data, rightSeries, h) : null

    if (this.gridConfig) renderGrid(g, this.gridConfig, xScale, yScale, w, h, this.theme)
    renderAxes(g, this.axesList, xScale, yScale, w, h, this.theme, yScaleRight)

    // Stacked areas
    const areaList = this.seriesList.filter(s => s.type === "area")
    const stackedGroups = {}
    const freeAreas = []
    areaList.forEach(s => {
      if (s.stack) {
        stackedGroups[s.stack] = stackedGroups[s.stack] || []
        stackedGroups[s.stack].push(s)
      } else {
        freeAreas.push(s)
      }
    })
    Object.values(stackedGroups).forEach(group => {
      const scale = group[0].y_axis === "right" && yScaleRight ? yScaleRight : yScale
      renderStackedAreas(g, data, xScale, scale, this.xKey, group, this.animate)
    })
    freeAreas.forEach(s => {
      const scale = s.y_axis === "right" && yScaleRight ? yScaleRight : yScale
      renderArea(g, data, xScale, scale, this.xKey, s, this.animate, this.element)
    })

    // Bars
    const barSeries = this.seriesList.filter(s => s.type === "bar")
    if (barSeries.length > 0) {
      const scale = barSeries[0].y_axis === "right" && yScaleRight ? yScaleRight : yScale
      renderBars(g, data, xScale, scale, this.xKey, barSeries, this.animate, this.element)
    }

    // Candlestick
    this.seriesList.filter(s => s.type === "candlestick").forEach(s => renderCandlestick(g, data, xScale, yScale, this.xKey, s, this.animate, this.element))

    // Lines
    this.seriesList.filter(s => s.type === "line").forEach(s => {
      const scale = s.y_axis === "right" && yScaleRight ? yScaleRight : yScale
      renderLine(g, data, xScale, scale, this.xKey, s, this.animate, this.element)
    })

    // Scatter
    this.seriesList.filter(s => s.type === "scatter").forEach(s => {
      const scale = s.y_axis === "right" && yScaleRight ? yScaleRight : yScale
      renderScatter(g, data, xScale, scale, this.xKey, s, this.animate, this.element)
    })

    // Reference lines (rendered after series so they appear on top)
    renderReferenceLines(g, this.referenceLines, xScale, yScale, w, h, this.theme)

    // Data labels
    if (this.dataLabelConfig) {
      renderDataLabels(g, data, xScale, yScale, this.xKey, cartesianSeries, this.dataLabelConfig, this.theme)
    }

    if (this.tooltipConfig) {
      setupCartesianTooltip(this.element, g, data, xScale, yScale, this.xKey, cartesianSeries, this.tooltipConfig, w, h, m, this.theme)
    }
    if (this.legendConfig) renderLegend(this.element, this.seriesList.filter(s => s.data_key), this.legendConfig, this.theme)

    // Brush
    if (this.brushConfig && !this._brushDomain) {
      setupBrush(svg, g, this.data, xScale, yScale, this.xKey, this, w, h, m, this.brushConfig)
    }
  }

  renderHorizontalCartesian(totalW, totalH) {
    const legendH = this.legendConfig ? 32 : 0
    const m = { ...this.margin, left: 80 }
    const w = totalW - m.left - m.right
    const h = totalH - m.top - m.bottom - legendH
    if (w <= 0 || h <= 0) return

    const svg = d3.select(this.element)
      .append("svg").attr("width", totalW).attr("height", totalH - legendH)

    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`)

    const catKey = this.xKey
    const hBarSeries = this.seriesList.filter(s => s.type === "horizontal_bar")

    const yScale = d3.scaleBand()
      .domain(this.data.map(d => d[catKey]))
      .range([0, h]).padding(0.2)

    const maxVal = d3.max(this.data, d => d3.max(hBarSeries, s => +d[s.data_key] || 0)) || 1
    const xScale = d3.scaleLinear().domain([0, maxVal]).nice().range([0, w])

    if (this.gridConfig) {
      const grid = g.append("g").attr("class", "trackplot-grid").attr("aria-hidden", "true")
      grid.append("g")
        .call(d3.axisBottom(xScale).tickSize(h).tickFormat(""))
        .attr("transform", `translate(0,0)`)
        .call(g => g.selectAll("line").attr("stroke", this.theme.grid_color).attr("stroke-dasharray", "3 3"))
        .call(g => g.selectAll(".domain").remove())
    }

    const t = this.theme
    // Y axis (categories)
    const yG = g.append("g").attr("class", "trackplot-axis-y")
    yG.call(d3.axisLeft(yScale))
    yG.selectAll("text").attr("fill", t.text_color).attr("font-size", "12px").attr("font-family", t.font || FONT)
    yG.selectAll("line").attr("stroke", t.axis_color)
    yG.select(".domain").attr("stroke", t.axis_color)

    // X axis (values)
    this.axesList.filter(a => a.direction === "y" || (a.direction === "x" && !a.data_key)).forEach(axis => {
      const xG = g.append("g").attr("class", "trackplot-axis-x")
        .attr("transform", `translate(0,${h})`)
      let gen = d3.axisBottom(xScale)
      const fmt = resolveFormatter(axis.format)
      if (axis.format) gen = gen.tickFormat(fmt)
      xG.call(gen)
      xG.selectAll("text").attr("fill", t.text_color).attr("font-size", "12px").attr("font-family", t.font || FONT)
      xG.selectAll("line").attr("stroke", t.axis_color)
      xG.select(".domain").attr("stroke", t.axis_color)
      if (axis.label) {
        xG.append("text").attr("x", w / 2).attr("y", 36)
          .attr("fill", t.text_color).attr("font-size", "13px").attr("font-family", t.font || FONT)
          .attr("text-anchor", "middle").text(axis.label)
      }
    })

    renderHorizontalBars(g, this.data, xScale, yScale, catKey, hBarSeries, this.animate, this.element)

    if (this.tooltipConfig) {
      const tooltip = createTooltipDiv(this.element, t)
      const fmtValue = resolveFormatter(this.tooltipConfig.format)

      g.selectAll(".trackplot-hbar")
        .on("mouseenter", function (event) {
          const datum = d3.select(this).datum()
          const cat = catKey ? datum[catKey] : ""
          let html = `<div style="font-weight:600;color:${t.tooltip_text};margin-bottom:4px">${cat}</div>`
          hBarSeries.forEach(s => {
            const val = datum[s.data_key]
            if (val != null) {
              const formatted = isNaN(+val) ? val : fmtValue(+val)
              html += `<div style="display:flex;align-items:center;gap:8px">`
              html += `<span style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></span>`
              html += `<span style="color:${t.text_color}">${seriesLabel(s)}</span>`
              html += `<span style="font-weight:500;color:${t.tooltip_text};margin-left:auto;padding-left:12px">${formatted}</span>`
              html += `</div>`
            }
          })
          tooltip.innerHTML = html
          tooltip.style.opacity = "1"
        })
        .on("mousemove", function (event) {
          const [x, y] = d3.pointer(event, this.closest("trackplot-chart"))
          tooltip.style.left = `${x + 16}px`
          tooltip.style.top = `${y - 16}px`
        })
        .on("mouseleave", function () {
          tooltip.style.opacity = "0"
        })
    }

    if (this.legendConfig) renderLegend(this.element, hBarSeries, this.legendConfig, this.theme)
  }

  renderPie(totalW, totalH) {
    const pieSeries = this.seriesList.find(s => s.type === "pie")
    if (!pieSeries) return

    const legendH = this.legendConfig ? 40 : 0
    const chartH = totalH - legendH
    const svg = d3.select(this.element).append("svg").attr("width", totalW).attr("height", chartH)

    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g")

    renderPieSlices(g, this.data, pieSeries, totalW, chartH, this.animate, this.theme, this.element)

    // Data labels on pie
    if (this.dataLabelConfig) {
      renderPieDataLabels(g, this.data, pieSeries, this.dataLabelConfig, totalW, chartH, this.theme)
    }

    if (this.tooltipConfig) setupPieTooltip(this.element, g, this.data, pieSeries, this.tooltipConfig, this.theme)

    if (this.legendConfig) {
      const labelKey = pieSeries.label_key || this.xKey
      const themeColors = this.theme.colors || COLORS
      const items = this.data.map((d, i) => ({
        data_key: labelKey ? d[labelKey] : `Slice ${i + 1}`,
        color: themeColors[i % themeColors.length]
      }))
      renderLegend(this.element, items, this.legendConfig, this.theme)
    }
  }

  renderRadar(totalW, totalH) {
    const legendH = this.legendConfig ? 40 : 0
    const chartH = totalH - legendH
    const svg = d3.select(this.element).append("svg").attr("width", totalW).attr("height", chartH)

    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g")

    const radarSeries = this.seriesList.filter(s => s.type === "radar")
    renderRadarChart(g, this.data, radarSeries, this.xKey, totalW, chartH, this.animate, this.theme, this.element)
    if (this.tooltipConfig) setupRadarTooltip(this.element, g, this.data, radarSeries, this.xKey, this.tooltipConfig, this.theme)
    if (this.legendConfig) renderLegend(this.element, radarSeries, this.legendConfig, this.theme)
  }

  renderFunnel(totalW, totalH) {
    const funnelSeries = this.seriesList.find(s => s.type === "funnel")
    if (!funnelSeries) return

    const legendH = this.legendConfig ? 40 : 0
    const chartH = totalH - legendH
    const svg = d3.select(this.element).append("svg").attr("width", totalW).attr("height", chartH)

    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g")

    renderFunnelChart(g, this.data, funnelSeries, totalW, chartH, this.animate, this.theme, this.element)
    if (this.tooltipConfig) setupFunnelTooltip(this.element, g, this.data, funnelSeries, this.tooltipConfig, this.theme)

    if (this.legendConfig) {
      const labelKey = funnelSeries.label_key
      const themeColors = this.theme.colors || COLORS
      const items = this.data.map((d, i) => ({
        data_key: labelKey ? d[labelKey] : `Stage ${i + 1}`,
        color: themeColors[i % themeColors.length]
      }))
      renderLegend(this.element, items, this.legendConfig, this.theme)
    }
  }

  renderHeatmap(totalW, totalH) {
    const heatmapConfig = this.seriesList.find(s => s.type === "heatmap")
    if (!heatmapConfig) return

    const m = { ...this.margin, left: 60 }
    const w = totalW - m.left - m.right
    const h = totalH - m.top - m.bottom
    if (w <= 0 || h <= 0) return

    const svg = d3.select(this.element)
      .append("svg").attr("width", totalW).attr("height", totalH)

    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`)
    renderHeatmapChart(g, this.data, heatmapConfig, w, h, this.theme, this.element)
    if (this.tooltipConfig) setupHeatmapTooltip(this.element, g, this.data, heatmapConfig, this.theme)
  }

  renderTreemap(totalW, totalH) {
    const treemapConfig = this.seriesList.find(s => s.type === "treemap")
    if (!treemapConfig) return

    const legendH = this.legendConfig ? 40 : 0
    const chartH = totalH - legendH
    const svg = d3.select(this.element)
      .append("svg").attr("width", totalW).attr("height", chartH)

    if (this.chartConfig.title) {
      svg.attr("role", "img").attr("aria-label", this.chartConfig.title)
      svg.append("title").text(this.chartConfig.title)
      if (this.chartConfig.description) svg.append("desc").text(this.chartConfig.description)
    }

    const g = svg.append("g")
    renderTreemapChart(g, this.data, treemapConfig, totalW, chartH, this.theme, this.element)
    if (this.tooltipConfig) setupTreemapTooltip(this.element, g, this.data, treemapConfig, this.theme)
  }

  clear() {
    // Preserve background on re-render
    const bg = this.element.style.background
    this.element.innerHTML = ""
    if (bg) this.element.style.background = bg
  }

  destroy() {
    this.resizeObserver?.disconnect()
    this.clear()
  }
}

// ─── Export Helpers ──────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Custom Element ──────────────────────────────────────────────────────────

class TrackplotElement extends HTMLElement {
  connectedCallback() {
    try {
      this.chartConfig = JSON.parse(this.getAttribute("config"))
    } catch (e) {
      console.error("Trackplot: invalid config JSON", e)
      return
    }

    // Clear stale content from Turbo cache restoration or Turbo Stream replace
    this.innerHTML = ""

    // Drill-down state
    this._drillConfig = this.chartConfig.components?.find(c => c.type === "drilldown") || null
    this._drillStack = []
    this._originalData = this.chartConfig.data ? [...this.chartConfig.data] : []
    this._drillClickHandler = null

    this.chart = new Chart(this, this.chartConfig)
    requestAnimationFrame(() => {
      this.chart.render()
      this._dispatchRender()
      if (this._drillConfig) this._setupDrillListener()
    })

    this._resizeTimeout = null
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this._resizeTimeout)
      this._resizeTimeout = setTimeout(() => {
        if (this.chart) {
          this.chart.animate = false
          this.chart.render()
        }
      }, 150)
    })
    this.resizeObserver.observe(this)

    // Clear before Turbo caches the page so snapshots don't contain stale SVG
    this._turboCacheHandler = () => this.chart?.clear()
    document.addEventListener("turbo:before-cache", this._turboCacheHandler)
  }

  disconnectedCallback() {
    clearTimeout(this._resizeTimeout)
    this.resizeObserver?.disconnect()
    document.removeEventListener("turbo:before-cache", this._turboCacheHandler)
    this._removeDrillListener()
    this.chart?.destroy()
    this.chart = null
  }

  static get observedAttributes() { return ["config"] }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "config" && oldVal !== null && newVal && !this._internalUpdate) {
      try {
        this.chartConfig = JSON.parse(newVal)
        this._drillConfig = this.chartConfig.components?.find(c => c.type === "drilldown") || null
        this._drillStack = []
        this._originalData = this.chartConfig.data ? [...this.chartConfig.data] : []
        this._removeDrillListener()
        this._removeBreadcrumb()
        this.chart = new Chart(this, this.chartConfig)
        this.chart.animate = false
        this.chart.render()
        this._dispatchRender()
        if (this._drillConfig) this._setupDrillListener()
      } catch (e) {
        console.error("Trackplot: invalid config JSON", e)
      }
    }
  }

  // ── Public API ──────────────────────────────────────────

  /** Replace chart data and re-render without animation. */
  updateData(newData) {
    if (!this.chartConfig) return
    this._drillStack = []
    this._originalData = [...newData]
    this._removeBreadcrumb()
    this.chartConfig.data = newData
    this._rebuildChart(false)
  }

  /** Replace the full config object and re-render. */
  updateConfig(config) {
    this.chartConfig = config
    this._drillConfig = config.components?.find(c => c.type === "drilldown") || null
    this._drillStack = []
    this._originalData = config.data ? [...config.data] : []
    this._removeDrillListener()
    this._removeBreadcrumb()
    this._rebuildChart(false)
    if (this._drillConfig) this._setupDrillListener()
  }

  /** Append new data points and re-render with sliding window. */
  appendData(newPoints, { maxPoints = 50 } = {}) {
    if (!this.chartConfig) return
    // Reset to root level if drilled in
    if (this._drillStack.length > 0) {
      this._drillStack = []
      this._removeBreadcrumb()
      this.chartConfig.data = this._originalData
    }
    const current = this.chartConfig.data || []
    this.chartConfig.data = [...current, ...newPoints].slice(-maxPoints)
    this._originalData = [...this.chartConfig.data]
    this._rebuildChart(false)
    this.dispatchEvent(new CustomEvent("trackplot:data-update", {
      bubbles: true,
      detail: { count: this.chartConfig.data.length }
    }))
  }

  /** Export chart as SVG file download. Returns a Promise. */
  exportSVG(filename = "chart.svg") {
    return new Promise((resolve) => {
      const svgEl = this.querySelector("svg")
      if (!svgEl) { resolve(null); return }

      const clone = svgEl.cloneNode(true)
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      const blob = new Blob([clone.outerHTML], { type: "image/svg+xml;charset=utf-8" })
      triggerDownload(blob, filename)
      resolve(blob)
    })
  }

  /** Export chart as PNG file download. Returns a Promise. */
  exportPNG(scale = 2, filename = "chart.png") {
    return new Promise((resolve, reject) => {
      const svgEl = this.querySelector("svg")
      if (!svgEl) { resolve(null); return }

      const clone = svgEl.cloneNode(true)
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      const svgData = new XMLSerializer().serializeToString(clone)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = svgEl.clientWidth * scale
        canvas.height = svgEl.clientHeight * scale
        const ctx = canvas.getContext("2d")
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        canvas.toBlob(blob => {
          triggerDownload(blob, filename)
          resolve(blob)
        }, "image/png")
      }
      img.onerror = reject
      img.src = url
    })
  }

  // ── Internals ───────────────────────────────────────────

  _rebuildChart(animate) {
    this.chart = new Chart(this, this.chartConfig)
    this.chart.animate = animate
    this.chart.render()
    // Sync attribute so Turbo morphing sees current state
    this._internalUpdate = true
    this.setAttribute("config", JSON.stringify(this.chartConfig))
    this._internalUpdate = false
    this._dispatchRender()
  }

  _dispatchRender() {
    this.dispatchEvent(new CustomEvent("trackplot:render", { bubbles: true }))
  }

  // ── Drill-down Public API ────────────────────────────────

  /** Go back one drill level. Returns false if already at root. */
  drillUp() {
    if (this._drillStack.length === 0) return false
    const prev = this._drillStack.pop()
    this.chartConfig.data = prev.data
    this._rebuildChart(true)
    this._renderBreadcrumb()
    this.dispatchEvent(new CustomEvent("trackplot:drillup", {
      bubbles: true,
      detail: { level: this._drillStack.length }
    }))
    return true
  }

  /** Reset to root data from any drill depth. Returns false if already at root. */
  drillReset() {
    if (this._drillStack.length === 0) return false
    this._drillStack = []
    this.chartConfig.data = [...this._originalData]
    this._rebuildChart(true)
    this._removeBreadcrumb()
    this.dispatchEvent(new CustomEvent("trackplot:drillup", {
      bubbles: true,
      detail: { level: 0 }
    }))
    return true
  }

  // ── Drill-down Internals ─────────────────────────────────

  _setupDrillListener() {
    this._removeDrillListener()
    this._drillClickHandler = (e) => {
      const { chartType, datum } = e.detail
      if (chartType !== "bar" && chartType !== "pie" && chartType !== "heatmap" && chartType !== "treemap") return

      const drillKey = this._drillConfig.key
      const children = datum?.[drillKey]
      if (!Array.isArray(children) || children.length === 0) return

      e.stopImmediatePropagation()

      // Determine label from the datum
      const xAxis = this.chartConfig.components?.find(c => c.type === "axis" && c.direction === "x")
      const pieSeries = this.chartConfig.components?.find(c => c.type === "pie")
      let label
      if (chartType === "pie" && pieSeries?.label_key) {
        label = datum[pieSeries.label_key]
      } else if (xAxis?.data_key) {
        label = datum[xAxis.data_key]
      }
      label = label ?? `Level ${this._drillStack.length + 1}`

      this._drillStack.push({ data: this.chartConfig.data, label })
      this.chartConfig.data = children
      this._rebuildChart(true)
      this._renderBreadcrumb()
      this.dispatchEvent(new CustomEvent("trackplot:drilldown", {
        bubbles: true,
        detail: { level: this._drillStack.length, datum, label }
      }))
    }
    this.addEventListener("trackplot:click", this._drillClickHandler)
  }

  _removeDrillListener() {
    if (this._drillClickHandler) {
      this.removeEventListener("trackplot:click", this._drillClickHandler)
      this._drillClickHandler = null
    }
  }

  _drillToLevel(n) {
    while (this._drillStack.length > n) {
      const prev = this._drillStack.pop()
      this.chartConfig.data = prev.data
    }
    this._rebuildChart(true)
    this._renderBreadcrumb()
    this.dispatchEvent(new CustomEvent("trackplot:drillup", {
      bubbles: true,
      detail: { level: this._drillStack.length }
    }))
  }

  _renderBreadcrumb() {
    this._removeBreadcrumb()
    if (this._drillStack.length === 0) return

    const t = this.chartConfig.theme || DEFAULT_THEME
    const crumbDiv = document.createElement("div")
    crumbDiv.className = "trackplot-breadcrumb"
    crumbDiv.style.cssText = `display:flex;align-items:center;gap:4px;padding:4px 8px;font-family:${t.font || FONT};font-size:13px;color:${t.text_color || "#374151"};`

    // "All" link (root)
    const allLink = document.createElement("span")
    allLink.textContent = "All"
    allLink.style.cssText = "cursor:pointer;text-decoration:underline;"
    allLink.addEventListener("click", () => this._drillToLevel(0))
    crumbDiv.appendChild(allLink)

    // Intermediate levels
    this._drillStack.forEach((entry, i) => {
      const sep = document.createElement("span")
      sep.textContent = " \u203A "
      crumbDiv.appendChild(sep)

      if (i < this._drillStack.length - 1) {
        const link = document.createElement("span")
        link.textContent = entry.label
        link.style.cssText = "cursor:pointer;text-decoration:underline;"
        const level = i + 1
        link.addEventListener("click", () => this._drillToLevel(level))
        crumbDiv.appendChild(link)
      } else {
        // Current level (bold, not clickable)
        const current = document.createElement("span")
        current.textContent = entry.label
        current.style.fontWeight = "bold"
        crumbDiv.appendChild(current)
      }
    })

    this.insertBefore(crumbDiv, this.firstChild)
  }

  _removeBreadcrumb() {
    const crumb = this.querySelector(".trackplot-breadcrumb")
    if (crumb) crumb.remove()
  }
}

customElements.define("trackplot-chart", TrackplotElement)

// ─── Sparkline Custom Element ───────────────────────────────────────────────

class SparklineElement extends HTMLElement {
  connectedCallback() {
    try {
      this.sparkConfig = JSON.parse(this.getAttribute("config"))
    } catch (e) {
      console.error("Trackplot: invalid sparkline config JSON", e)
      return
    }

    this.innerHTML = ""
    requestAnimationFrame(() => this._render())

    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this._resizeTimeout)
      this._resizeTimeout = setTimeout(() => this._render(), 100)
    })
    this.resizeObserver.observe(this)
  }

  disconnectedCallback() {
    clearTimeout(this._resizeTimeout)
    this.resizeObserver?.disconnect()
  }

  _render() {
    this.innerHTML = ""
    const rect = this.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const { data, key, type, color, fill, stroke_width, dot } = this.sparkConfig
    if (!data || data.length === 0) return

    const w = rect.width
    const h = rect.height
    const pad = 2

    const svg = d3.select(this).append("svg")
      .attr("width", w).attr("height", h)
      .attr("aria-hidden", "true")
      .style("display", "block")

    const values = data.map(d => +d[key]).filter(v => !isNaN(v))
    if (values.length === 0) return

    const xScale = d3.scaleLinear().domain([0, values.length - 1]).range([pad, w - pad])
    const yScale = d3.scaleLinear().domain(d3.extent(values)).range([h - pad, pad])

    if (type === "bar") {
      const barW = Math.max(1, (w - pad * 2) / values.length - 1)
      svg.selectAll(null)
        .data(values)
        .enter().append("rect")
        .attr("x", (_, i) => xScale(i) - barW / 2)
        .attr("y", v => yScale(v))
        .attr("width", barW)
        .attr("height", v => Math.max(0, h - pad - yScale(v)))
        .attr("fill", color || "#6366f1")
        .attr("rx", 1)
    } else if (type === "area") {
      const areaGen = d3.area()
        .x((_, i) => xScale(i))
        .y0(h - pad)
        .y1((_, i) => yScale(values[i]))
        .curve(d3.curveMonotoneX)

      svg.append("path")
        .datum(values)
        .attr("fill", fill || color || "#6366f1")
        .attr("fill-opacity", 0.2)
        .attr("d", areaGen)

      const lineGen = d3.line()
        .x((_, i) => xScale(i))
        .y((_, i) => yScale(values[i]))
        .curve(d3.curveMonotoneX)

      svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color || "#6366f1")
        .attr("stroke-width", stroke_width || 1.5)
        .attr("d", lineGen)
    } else {
      // line (default)
      const lineGen = d3.line()
        .x((_, i) => xScale(i))
        .y((_, i) => yScale(values[i]))
        .curve(d3.curveMonotoneX)

      svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color || "#6366f1")
        .attr("stroke-width", stroke_width || 1.5)
        .attr("stroke-linecap", "round")
        .attr("d", lineGen)

      // Last dot indicator
      if (dot !== false) {
        const lastIdx = values.length - 1
        svg.append("circle")
          .attr("cx", xScale(lastIdx))
          .attr("cy", yScale(values[lastIdx]))
          .attr("r", 2.5)
          .attr("fill", color || "#6366f1")
      }
    }
  }
}

customElements.define("trackplot-sparkline", SparklineElement)
