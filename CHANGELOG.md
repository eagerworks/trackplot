# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-06-16

### Added
- **Custom series labels**: `name:` option on `line`, `bar`, `area`, `scatter`, `radar`, and `horizontal_bar` series to set the label shown in the legend, tooltips, and ARIA text. Defaults to the data key, so existing charts render unchanged.

## [0.2.0] - 2026-02-09

### Added
- **Accessibility (ARIA + keyboard)**: `title:` and `description:` options on charts, `role="img"` and `aria-label` on SVG elements, `aria-hidden` on decorative elements (grid, crosshair, reference lines), `aria-label` on data points
- **Empty state**: Centered "No data available" message (customizable via `empty_message:`) when data array is empty, with placeholder icon
- **Data labels**: `c.data_label format: :currency, position: :top` to render formatted values directly on bars, lines, scatter dots, and pie slices
- **Sparklines**: `trackplot_sparkline @data, key: :revenue` helper for inline mini-charts (line, bar, area) via `<trackplot-sparkline>` custom element
- **Stacked bars**: `c.bar :revenue, stack: "main"` now renders stacked bars using `d3.stack()`, matching the existing stacked area pattern
- **Dual Y-axis**: `c.axis :y, axis_id: :right` creates a right-side axis; series bind via `y_axis: :right`
- **Export to PNG/SVG**: `element.exportPNG()` and `element.exportSVG()` methods on `<trackplot-chart>` for downloading charts
- **ViewComponent support**: `Trackplot::Component` (optional, requires `view_component` gem)
- **Phlex support**: `Trackplot::PhlexComponent` (optional, requires `phlex` gem)
- **Brush/zoom**: `c.brush(axis: :x)` for interactive range selection on cartesian charts with mini preview
- **Real-time data append**: `element.appendData(newPoints, { maxPoints: 50 })` for live dashboard updates with `trackplot:data-update` event
- **Heatmap chart type**: `c.heatmap(x_key: :day, y_key: :hour, value_key: :count)` for density/intensity visualization
- **Treemap chart type**: `c.treemap(value_key: :size, label_key: :name)` for hierarchical data with optional `parent_key` grouping

## [0.1.0] - 2026-02-08

### Added
- Initial release with 10 chart types: Line, Bar, Area (with stacking), Scatter, Pie/Donut, Radar, Horizontal Bar, Candlestick, Funnel
- Declarative Ruby DSL via `trackplot_chart` helper with block syntax
- D3.js rendering via `<trackplot-chart>` custom element
- Theming system with 4 presets (default, dark, vibrant, minimal) and custom hash support
- Tooltip with crosshair for cartesian charts, hover tooltips for pie/radar/funnel
- Legend component with configurable position
- Grid lines (horizontal/vertical)
- Reference lines (horizontal/vertical) with labels, colors, and dash styles
- Format helpers (`:currency`, `:percent`, `:compact`, `:decimal`, `:integer`) for axes and tooltips
- Click events via `trackplot:click` custom event with datum detail
- Turbo support: stable `id:` option, `turbo:before-cache` cleanup, `updateData()` / `updateConfig()` public API
- ResizeObserver for responsive re-rendering
- Importmap integration via Rails engine
- Animated transitions with configurable `animate:` option
- DataAdapter: normalizes Hash, Array, ActiveRecord::Relation inputs to string-keyed hashes
