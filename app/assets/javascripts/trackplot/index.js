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

// ─── Utilities ───────────────────────────────────────────────────────────────

function sanitizeClass(str) {
  return String(str).replace(/[^a-zA-Z0-9_-]/g, "_")
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
  return d3.scaleLinear().domain(extent).nice().range([0, width])
}

function createYScale(data, seriesConfigs, height) {
  let maxVal = 0

  const stackGroups = {}
  seriesConfigs.forEach(s => {
    if (s.type === "bar" && s.stack) {
      stackGroups[s.stack] = stackGroups[s.stack] || []
      stackGroups[s.stack].push(s.data_key)
    }
  })

  seriesConfigs.forEach(s => {
    if (!(s.type === "bar" && s.stack)) {
      const sMax = d3.max(data, d => +d[s.data_key] || 0)
      if (sMax > maxVal) maxVal = sMax
    }
  })

  Object.values(stackGroups).forEach(keys => {
    data.forEach(d => {
      const sum = keys.reduce((acc, k) => acc + (+d[k] || 0), 0)
      if (sum > maxVal) maxVal = sum
    })
  })

  if (maxVal === 0) maxVal = 1
  return d3.scaleLinear().domain([0, maxVal]).nice().range([height, 0])
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

function createTooltipDiv(container) {
  const el = document.createElement("div")
  Object.assign(el.style, {
    position: "absolute",
    pointerEvents: "none",
    background: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontFamily: FONT,
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

function renderGrid(g, config, xScale, yScale, width, height) {
  const grid = g.append("g").attr("class", "trackplot-grid")

  if (config.horizontal !== false) {
    grid.append("g")
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""))
      .call(g => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3 3"))
      .call(g => g.selectAll(".domain").remove())
      .call(g => g.selectAll(".tick text").remove())
  }

  if (config.vertical) {
    grid.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(""))
      .call(g => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3 3"))
      .call(g => g.selectAll(".domain").remove())
      .call(g => g.selectAll(".tick text").remove())
  }
}

// ─── Axes Renderer ───────────────────────────────────────────────────────────

function renderAxes(g, axesConfigs, xScale, yScale, width, height) {
  axesConfigs.forEach(axis => {
    if (axis.direction === "x") {
      const xG = g.append("g")
        .attr("class", "trackplot-axis-x")
        .attr("transform", `translate(0,${height})`)

      let gen = d3.axisBottom(xScale)
      if (axis.format) gen = gen.tickFormat(d3.format(axis.format))
      if (axis.tick_count) gen = gen.ticks(axis.tick_count)

      xG.call(gen)
      xG.selectAll("text").attr("fill", "#6b7280").attr("font-size", "12px").attr("font-family", FONT)
      if (axis.tick_rotation) {
        xG.selectAll("text").attr("transform", `rotate(${axis.tick_rotation})`).attr("text-anchor", "end")
      }
      xG.selectAll("line").attr("stroke", "#d1d5db")
      xG.select(".domain").attr("stroke", "#d1d5db")

      if (axis.label) {
        xG.append("text").attr("x", width / 2).attr("y", 36)
          .attr("fill", "#374151").attr("font-size", "13px").attr("font-family", FONT)
          .attr("text-anchor", "middle").text(axis.label)
      }
    }

    if (axis.direction === "y") {
      const yG = g.append("g").attr("class", "trackplot-axis-y")
      let gen = d3.axisLeft(yScale)
      if (axis.format) gen = gen.tickFormat(d3.format(axis.format))
      if (axis.tick_count) gen = gen.ticks(axis.tick_count)

      yG.call(gen)
      yG.selectAll("text").attr("fill", "#6b7280").attr("font-size", "12px").attr("font-family", FONT)
      yG.selectAll("line").attr("stroke", "#d1d5db")
      yG.select(".domain").attr("stroke", "#d1d5db")

      if (axis.label) {
        yG.append("text").attr("transform", "rotate(-90)")
          .attr("x", -height / 2).attr("y", -40)
          .attr("fill", "#374151").attr("font-size", "13px").attr("font-family", FONT)
          .attr("text-anchor", "middle").text(axis.label)
      }
    }
  })
}

// ─── Line Renderer ───────────────────────────────────────────────────────────

function renderLine(g, data, xScale, yScale, xKey, series, animate) {
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

    if (animate) {
      dots.attr("r", 0).transition().delay(DURATION).duration(300).attr("r", dotR)
    } else {
      dots.attr("r", dotR)
    }
  }
}

// ─── Bar Renderer ────────────────────────────────────────────────────────────

function renderBars(g, data, xScale, yScale, xKey, barSeries, animate) {
  if (barSeries.length === 0) return

  const bandwidth = xScale.bandwidth()
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
      .transition().duration(animate ? DURATION : 0).ease(EASE)
      .delay((_, i) => animate ? i * 40 : 0)
      .attr("y", d => yScale(+d[series.data_key] || 0))
      .attr("height", d => Math.max(0, yScale(0) - yScale(+d[series.data_key] || 0)))
  })
}

// ─── Area Renderer ───────────────────────────────────────────────────────────

function renderArea(g, data, xScale, yScale, xKey, series, animate) {
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

  // Stroke on top
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

// ─── Pie Renderer ────────────────────────────────────────────────────────────

function renderPieSlices(g, data, series, width, height, animate) {
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
    .attr("fill", (_, i) => COLORS[i % COLORS.length])
    .attr("stroke", "white")
    .attr("stroke-width", 2)
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
}

// ─── Cartesian Tooltip ───────────────────────────────────────────────────────

function setupCartesianTooltip(element, g, data, xScale, yScale, xKey, series, config, width, height, margin) {
  const tooltip = createTooltipDiv(element)
  const getX = xAccessorFor(xScale, xKey)
  const fmtValue = config.format ? d3.format(config.format) : v => v

  const crosshair = g.append("line")
    .attr("class", "trackplot-crosshair")
    .attr("stroke", "#9ca3af").attr("stroke-width", 1).attr("stroke-dasharray", "4 3")
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

      // Highlight dots
      series.forEach(s => {
        const cls = sanitizeClass(s.data_key)
        const dotR = s.dot_size || 4
        g.selectAll(`.trackplot-dot-${cls}`)
          .attr("r", (dd, i) => i === idx ? dotR * 1.5 : dotR)
          .attr("fill", (dd, i) => i === idx ? s.color : "white")
      })

      // Build tooltip HTML
      const label = xKey ? d[xKey] : `#${idx}`
      let html = `<div style="font-weight:600;color:#111827;margin-bottom:4px">${label}</div>`
      series.forEach(s => {
        const val = d[s.data_key]
        if (val != null) {
          const formatted = isNaN(+val) ? val : fmtValue(+val)
          html += `<div style="display:flex;align-items:center;gap:8px">`
          html += `<span style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></span>`
          html += `<span style="color:#6b7280">${s.data_key}</span>`
          html += `<span style="font-weight:500;color:#111827;margin-left:auto;padding-left:12px">${formatted}</span>`
          html += `</div>`
        }
      })
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"

      // Position
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
        const cls = sanitizeClass(s.data_key)
        const dotR = s.dot_size || 4
        g.selectAll(`.trackplot-dot-${cls}`).attr("r", dotR).attr("fill", "white")
      })
    })
}

// ─── Pie Tooltip ─────────────────────────────────────────────────────────────

function setupPieTooltip(element, g, data, series, config) {
  const tooltip = createTooltipDiv(element)
  const total = d3.sum(data, d => +d[series.data_key])
  const labelKey = series.label_key

  g.selectAll(".trackplot-pie path")
    .on("mouseenter.tooltip", function (event, d) {
      const val = +d.data[series.data_key]
      const pct = ((val / total) * 100).toFixed(1)
      const name = labelKey ? d.data[labelKey] : ""
      let html = ""
      if (name) html += `<div style="font-weight:600;color:#111827;margin-bottom:2px">${name}</div>`
      html += `<div style="color:#374151">${val} <span style="color:#9ca3af">(${pct}%)</span></div>`
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

function renderLegend(element, items, config) {
  const legend = document.createElement("div")
  Object.assign(legend.style, {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    padding: "8px 0 0",
    fontFamily: FONT,
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
    label.textContent = item.data_key
    label.style.color = "#374151"

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

// ─── Chart Class ─────────────────────────────────────────────────────────────

class Chart {
  constructor(element, config) {
    this.element = element
    this.data = config.data || []
    this.components = config.components || []
    this.animate = config.animate !== false
    this.margin = { ...DEFAULT_MARGIN }

    this.seriesList = this.components.filter(c => ["line", "bar", "area", "pie"].includes(c.type))
    this.axesList = this.components.filter(c => c.type === "axis")
    this.gridConfig = this.components.find(c => c.type === "grid")
    this.tooltipConfig = this.components.find(c => c.type === "tooltip")
    this.legendConfig = this.components.find(c => c.type === "legend")

    this.seriesList.forEach((s, i) => { s.color = s.color || COLORS[i % COLORS.length] })
    this.isPie = this.seriesList.some(s => s.type === "pie")
    this.xKey = getXKey(this.components)
  }

  render() {
    this.clear()
    if (this.data.length === 0) return

    const rect = this.element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    if (this.isPie) {
      this.renderPie(rect.width, rect.height)
    } else {
      this.renderCartesian(rect.width, rect.height)
    }
  }

  renderCartesian(totalW, totalH) {
    const legendH = this.legendConfig ? 32 : 0
    const m = this.margin
    const w = totalW - m.left - m.right
    const h = totalH - m.top - m.bottom - legendH
    if (w <= 0 || h <= 0) return

    const svg = d3.select(this.element)
      .append("svg")
      .attr("width", totalW).attr("height", totalH - legendH)

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`)

    const hasBars = this.seriesList.some(s => s.type === "bar")
    const scaleType = hasBars ? "band" : detectScaleType(this.data, this.xKey)
    const xScale = createXScale(this.data, this.xKey, scaleType, w)
    const yScale = createYScale(this.data, this.seriesList, h)

    if (this.gridConfig) renderGrid(g, this.gridConfig, xScale, yScale, w, h)
    renderAxes(g, this.axesList, xScale, yScale, w, h)

    // Render in order: areas → bars → lines (layering)
    this.seriesList.filter(s => s.type === "area").forEach(s => renderArea(g, this.data, xScale, yScale, this.xKey, s, this.animate))
    const barSeries = this.seriesList.filter(s => s.type === "bar")
    if (barSeries.length > 0) renderBars(g, this.data, xScale, yScale, this.xKey, barSeries, this.animate)
    this.seriesList.filter(s => s.type === "line").forEach(s => renderLine(g, this.data, xScale, yScale, this.xKey, s, this.animate))

    if (this.tooltipConfig) {
      setupCartesianTooltip(this.element, g, this.data, xScale, yScale, this.xKey, this.seriesList.filter(s => s.type !== "pie"), this.tooltipConfig, w, h, m)
    }

    if (this.legendConfig) renderLegend(this.element, this.seriesList, this.legendConfig)
  }

  renderPie(totalW, totalH) {
    const pieSeries = this.seriesList.find(s => s.type === "pie")
    if (!pieSeries) return

    const legendH = this.legendConfig ? 40 : 0
    const chartH = totalH - legendH

    const svg = d3.select(this.element)
      .append("svg")
      .attr("width", totalW).attr("height", chartH)

    const g = svg.append("g")
    renderPieSlices(g, this.data, pieSeries, totalW, chartH, this.animate)

    if (this.tooltipConfig) setupPieTooltip(this.element, g, this.data, pieSeries, this.tooltipConfig)

    if (this.legendConfig) {
      const labelKey = pieSeries.label_key || this.xKey
      const items = this.data.map((d, i) => ({
        data_key: labelKey ? d[labelKey] : `Slice ${i + 1}`,
        color: COLORS[i % COLORS.length]
      }))
      renderLegend(this.element, items, this.legendConfig)
    }
  }

  clear() { this.element.innerHTML = "" }

  destroy() {
    this.resizeObserver?.disconnect()
    this.clear()
  }
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

    this.chart = new Chart(this, this.chartConfig)
    requestAnimationFrame(() => this.chart.render())

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
  }

  disconnectedCallback() {
    clearTimeout(this._resizeTimeout)
    this.resizeObserver?.disconnect()
    this.chart?.destroy()
    this.chart = null
  }

  static get observedAttributes() { return ["config"] }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "config" && oldVal !== null && newVal) {
      try {
        this.chartConfig = JSON.parse(newVal)
        this.chart = new Chart(this, this.chartConfig)
        this.chart.render()
      } catch (e) {
        console.error("Trackplot: invalid config JSON", e)
      }
    }
  }
}

customElements.define("trackplot-chart", TrackplotElement)
