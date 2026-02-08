# Trackplot

**Drop-in D3.js charts for Rails.** Write Ruby, get beautiful interactive visualizations. No JavaScript required.

Trackplot gives you a Recharts-like DSL that feels right at home in your `.erb` templates. Under the hood it renders a `<trackplot-chart>` custom element powered by D3.js — with animations, tooltips, theming, and Turbo support out of the box.

```erb
<%= trackplot_chart @monthly_sales do |c| %>
  <% c.line :revenue, color: "#6366f1", curve: true %>
  <% c.bar  :orders,  color: "#06b6d4", opacity: 0.6 %>
  <% c.axis :x, data_key: :month %>
  <% c.axis :y, format: :currency %>
  <% c.tooltip format: :currency %>
  <% c.reference_line y: 10_000, label: "Goal" %>
  <% c.legend %>
  <% c.grid %>
<% end %>
```

That's it. No JavaScript files to write, no chart config objects to manage, no build step drama.

---

## Chart Types

| Cartesian | Radial | Hierarchical | Other |
|-----------|--------|--------------|-------|
| Line | Pie / Donut | Treemap | Horizontal Bar |
| Bar (grouped + stacked) | Radar | | Funnel |
| Area (+ stacked) | | | Candlestick (OHLC) |
| Scatter | | | Heatmap |

Plus **sparklines** for inline mini-charts in tables and dashboards.

Mix and match freely — bars + lines on the same chart just work.

## Installation

Add to your Gemfile:

```ruby
gem "trackplot"
```

Then run the install generator:

```bash
bin/rails generate trackplot:install
```

The generator auto-detects your JS setup (importmap vs jsbundling), installs the right packages, and adds `import "trackplot"` to `application.js`.

Pass `--stimulus` to also get a Stimulus controller with auto-refresh polling and export actions:

```bash
bin/rails generate trackplot:install --stimulus
```

### With importmap (default Rails 7+)

You're done. The engine auto-registers D3 from CDN and pins the trackplot module.

### With esbuild / jsbundling-rails

Install D3 and trackplot from npm:

```bash
yarn add d3 trackplot
```

Then import it in your `app/javascript/application.js`:

```javascript
import "trackplot"
```

## Quick Start

Pass any array of hashes (or ActiveRecord collection) and describe what you want:

```erb
<%= trackplot_chart @data, height: "300px" do |c| %>
  <% c.line :temperature, color: "#ef4444", curve: true %>
  <% c.axis :x, data_key: :date %>
  <% c.axis :y, label: "Temp (F)" %>
  <% c.tooltip %>
  <% c.grid %>
<% end %>
```

Your data can use symbol or string keys — Trackplot normalizes both:

```ruby
@data = [
  { date: "Mon", temperature: 72 },
  { date: "Tue", temperature: 68 },
  { date: "Wed", temperature: 75 }
]
```

## Chart Types

### Line

```erb
<% c.line :revenue, color: "#6366f1", curve: true, dashed: true %>
```

Options: `color`, `curve` (smooth), `dashed`, `stroke_width`, `dot` (true/false), `dot_size`, `y_axis`.

### Bar

```erb
<% c.bar :sales, color: "#06b6d4", opacity: 0.8, radius: 6 %>
```

Multiple bar series render as grouped bars automatically. Options: `color`, `opacity`, `radius` (corner rounding), `stack` (group name for stacking), `y_axis`.

Stack bars by giving them the same `stack` name:

```erb
<% c.bar :revenue, stack: "main", color: "#6366f1" %>
<% c.bar :costs,   stack: "main", color: "#f59e0b" %>
```

### Area

```erb
<% c.area :revenue, color: "#8b5cf6", curve: true %>
```

Renders a gradient fill with a stroke line. Stack multiple areas by giving them the same `stack` name:

```erb
<% c.area :revenue, stack: "main", color: "#10b981", curve: true %>
<% c.area :costs,   stack: "main", color: "#f59e0b", curve: true %>
```

### Scatter

```erb
<% c.scatter :weight, color: "#ec4899", dot_size: 6 %>
```

Options: `color`, `dot_size`, `opacity`, `x_key` (override x-axis key), `y_axis`.

### Pie / Donut

```erb
<% c.pie :value, label_key: :segment %>
<% c.pie :value, label_key: :segment, donut: true %>
```

Options: `label_key`, `donut`, `pad_angle`.

### Radar

```erb
<% c.radar :player_a, color: "#6366f1" %>
<% c.radar :player_b, color: "#ef4444" %>
```

Options: `color`, `opacity`, `stroke_width`, `dot`, `dot_size`.

### Horizontal Bar

```erb
<% c.horizontal_bar :popularity, color: "#14b8a6" %>
```

Same options as regular bar. The x-axis `data_key` becomes the category axis.

### Candlestick

```erb
<% c.candlestick open: :open, high: :high, low: :low, close: :close %>
```

Options: `up_color`, `down_color`.

### Funnel

```erb
<% c.funnel :count, label_key: :stage %>
```

Options: `label_key`.

### Heatmap

Visualize density or intensity across two dimensions:

```erb
<%= trackplot_chart @activity_data, height: "300px" do |c| %>
  <% c.heatmap x_key: :day, y_key: :hour, value_key: :count,
               color_range: ["#f0f9ff", "#1e40af"] %>
  <% c.tooltip %>
<% end %>
```

Options: `x_key`, `y_key`, `value_key`, `color_range` (two-color array), `radius`.

### Treemap

Show hierarchical data as nested rectangles:

```erb
<%= trackplot_chart @budget_data, height: "300px" do |c| %>
  <% c.treemap value_key: :amount, label_key: :name, parent_key: :department %>
  <% c.tooltip %>
<% end %>
```

Options: `value_key`, `label_key`, `parent_key` (optional — groups data into a hierarchy). Without `parent_key`, data is treated as flat.

### Combined Charts

Layer different series types on the same chart:

```erb
<%= trackplot_chart @data do |c| %>
  <% c.bar  :revenue, color: "#06b6d4", opacity: 0.6 %>
  <% c.line :profit,  color: "#6366f1", curve: true %>
  <% c.axis :x, data_key: :month %>
  <% c.axis :y %>
  <% c.tooltip %>
  <% c.legend %>
  <% c.grid %>
<% end %>
```

## Sparklines

Inline mini-charts for tables and dashboards — no axes, no labels, just the shape:

```erb
<%= trackplot_sparkline @trend_data, key: :revenue, type: :line, color: "#6366f1" %>
```

Types: `:line` (default, with last-dot indicator), `:bar`, `:area`.

Options: `key:` (required), `type:`, `color:`, `width:` (default `"120px"`), `height:` (default `"32px"`), `stroke_width:`, `dot:`.

Use them in tables:

```erb
<table>
  <% @metrics.each do |metric| %>
    <tr>
      <td><%= metric.name %></td>
      <td><%= trackplot_sparkline metric.history, key: :value, color: "#10b981" %></td>
      <td><%= metric.current_value %></td>
    </tr>
  <% end %>
</table>
```

## Components

### Axis

```erb
<% c.axis :x, data_key: :month %>
<% c.axis :y, label: "Revenue ($)", format: :currency, tick_count: 5 %>
```

Options: `data_key`, `label`, `format`, `tick_count`, `tick_rotation`, `axis_id`.

### Dual Y-Axis

Compare series with different scales on the same chart:

```erb
<%= trackplot_chart @data do |c| %>
  <% c.bar  :revenue, color: "#6366f1" %>
  <% c.line :conversion_rate, color: "#ef4444", y_axis: :right %>
  <% c.axis :x, data_key: :month %>
  <% c.axis :y, format: :currency %>
  <% c.axis :y, axis_id: :right, format: :percent %>
<% end %>
```

Add `axis_id: :right` to a y-axis, then bind series to it with `y_axis: :right`. Works on line, bar, area, and scatter.

### Tooltip

```erb
<% c.tooltip format: :currency %>
```

Options: `format`, `label_format`.

### Legend

```erb
<% c.legend position: :top %>
```

Options: `position` (`:top` or `:bottom`), `clickable`.

### Grid

```erb
<% c.grid horizontal: true, vertical: true %>
```

Options: `horizontal` (default true), `vertical`.

### Reference Line

Draw horizontal or vertical lines for targets, thresholds, or annotations:

```erb
<% c.reference_line y: 5000, label: "Target", color: "#ef4444" %>
<% c.reference_line x: "Mar", label: "Launch", color: "#6366f1", dashed: false %>
```

Options: `y` or `x` (value), `label`, `color`, `dashed` (default true), `stroke_width`.

### Data Labels

Show formatted values directly on bars, dots, and pie slices:

```erb
<% c.data_label format: :currency, position: :top %>
```

Options: `format` (any format preset or D3 format string), `position` (`:top`, `:center`, `:outside`), `font_size` (default 11).

### Brush

Interactive range selection for exploring large datasets:

```erb
<% c.brush axis: :x %>
```

Renders a mini preview below the chart. Drag to select a range — the chart zooms in. Double-click to reset.

Options: `axis` (default `:x`), `height` (default 40).

## Number Formatting

Both axes and tooltips accept format presets or raw D3 format strings:

| Preset | Output | Example |
|--------|--------|---------|
| `:currency` | `$1,234` | `format: :currency` |
| `:percent` | `42%` | `format: :percent` |
| `:compact` | `1.2k` | `format: :compact` |
| `:decimal` | `1,234.56` | `format: :decimal` |
| `:integer` | `1,234` | `format: :integer` |

Or pass a raw D3 format string: `format: "$,.2f"`.

## Theming

Four built-in themes, plus fully custom themes via Hash:

```erb
<%= trackplot_chart @data, theme: :dark do |c| %>
  ...
<% end %>
```

Available presets: `:default`, `:dark`, `:vibrant`, `:minimal`.

Custom theme (merges with defaults):

```erb
<%= trackplot_chart @data, theme: { colors: ["#ff0000", "#00ff00"], background: "#111" } do |c| %>
  ...
<% end %>
```

Theme properties: `colors`, `background`, `text_color`, `axis_color`, `grid_color`, `tooltip_bg`, `tooltip_text`, `tooltip_border`, `font`.

### Color Scales

Generate color palettes programmatically instead of hand-picking every color:

```ruby
# Light-to-dark ramp from a single color
Trackplot::ColorScale.sequential("#6366f1", count: 6)
# => ["#d8d9fb", "#b1b2f7", "#8a8cf3", "#6366f1", "#3c3de0", "#2627a0"]

# Two-color diverging gradient (light midpoint)
Trackplot::ColorScale.diverging("#ef4444", "#3b82f6", count: 7)

# Evenly-spaced hues preserving saturation and lightness
Trackplot::ColorScale.categorical("#6366f1", count: 8)
```

Use them as theme colors:

```erb
<%= trackplot_chart @data, theme: { colors: Trackplot::ColorScale.sequential("#6366f1") } do |c| %>
  ...
<% end %>
```

| Method | Description |
|--------|-------------|
| `.sequential(hex, count: 8)` | Light-to-dark palette varying lightness from 0.90 to 0.25 |
| `.diverging(hex1, hex2, count: 8)` | Two-color gradient with light midpoint |
| `.categorical(hex, count: 8)` | Evenly-spaced hues (360°/count steps) |

All methods accept standard `#RGB` or `#RRGGBB` hex strings. `count: 0` returns `[]`, `count: 1` returns a single color, and invalid hex raises `ArgumentError`.

## Accessibility

Charts support ARIA attributes for screen readers:

```erb
<%= trackplot_chart @data, title: "Monthly Revenue", description: "Revenue trend from Jan to Jul" do |c| %>
  <% c.line :revenue %>
  <% c.axis :x, data_key: :month %>
  <% c.axis :y %>
<% end %>
```

When `title:` is set:
- The `<trackplot-chart>` element gets `role="img"` and `aria-label`
- The SVG includes `<title>` and `<desc>` elements
- Decorative elements (grid lines, crosshair) are marked `aria-hidden="true"`
- Data points get `aria-label` attributes with their values

## Empty State

Charts gracefully handle empty data with a centered message:

```erb
<%= trackplot_chart [], empty_message: "No sales data for this period" do |c| %>
  <% c.line :revenue %>
  <% c.axis :x, data_key: :month %>
  <% c.axis :y %>
<% end %>
```

The default message is "No data available". Customize it with `empty_message:`.

## Click Events

Every interactive element (bars, dots, pie slices, funnel stages...) dispatches a `trackplot:click` CustomEvent that bubbles up the DOM:

```javascript
document.addEventListener("trackplot:click", function(e) {
  console.log(e.detail)
  // => { chartType: "bar", dataKey: "revenue", datum: {...}, index: 2, value: 4200 }
})
```

Works great with Stimulus:

```html
<div data-controller="chart" data-action="trackplot:click->chart#onClick">
  <%= trackplot_chart @data do |c| %>
    ...
  <% end %>
</div>
```

## Export to PNG / SVG

Download charts as images from JavaScript:

```javascript
const chart = document.querySelector("trackplot-chart")

// PNG (default 2x resolution)
chart.exportPNG()
chart.exportPNG(3, "revenue.png")  // custom scale and filename

// SVG
chart.exportSVG()
chart.exportSVG("revenue.svg")
```

Both methods return a Promise that resolves with the Blob.

## Turbo Support

Trackplot is built for Turbo. Charts clean up before Turbo caches pages, survive morphing, and re-render cleanly on Turbo Stream updates.

### Stable IDs for Turbo Streams

Pass `id:` so `turbo_stream.replace` can target your chart:

```erb
<%= trackplot_chart @data, id: "revenue-chart" do |c| %>
  <% c.line :revenue, curve: true %>
  <% c.axis :x, data_key: :month %>
  <% c.axis :y %>
<% end %>
```

Then push updates from your server:

```erb
<%= turbo_stream.replace "revenue-chart" do %>
  <%= trackplot_chart @fresh_data, id: "revenue-chart" do |c| %>
    <% c.line :revenue, curve: true %>
    <% c.axis :x, data_key: :month %>
    <% c.axis :y %>
  <% end %>
<% end %>
```

### Programmatic Data Updates

Update chart data from JavaScript (e.g., from a Stimulus controller receiving ActionCable broadcasts):

```javascript
const chart = document.getElementById("revenue-chart")
chart.updateData(newDataArray)
```

### Real-time Data Append

Push new data points without a full re-render — great for live dashboards:

```javascript
const chart = document.getElementById("live-chart")
chart.appendData(
  [{ time: "12:05", value: 42 }],
  { maxPoints: 50 }  // sliding window
)
```

Dispatches a `trackplot:data-update` event after each append.

The `trackplot:render` event fires after every render:

```javascript
document.addEventListener("trackplot:render", function(e) {
  console.log("Chart ready:", e.target.id)
})
```

## Stimulus Controller

Run `bin/rails generate trackplot:install --stimulus` to get a controller with auto-refresh polling and export actions:

```html
<div data-controller="trackplot"
     data-trackplot-url-value="/api/chart_data.json"
     data-trackplot-interval-value="5000">
  <%= trackplot_chart @data do |c| %>
    <% c.line :revenue, curve: true %>
    <% c.axis :x, data_key: :month %>
    <% c.axis :y %>
  <% end %>

  <button data-action="trackplot#exportPng">Download PNG</button>
  <button data-action="trackplot#exportSvg">Download SVG</button>
</div>
```

| Value | Type | Description |
|-------|------|-------------|
| `url` | String | JSON endpoint to poll for fresh data |
| `interval` | Number | Polling interval in ms (0 = disabled) |

Actions: `exportPng`, `exportSvg`, `refresh` (manual trigger).

## ViewComponent / Phlex Support

If you use [ViewComponent](https://viewcomponent.org/) or [Phlex](https://www.phlex.fun/), Trackplot provides optional integrations.

### ViewComponent

```ruby
# In your view
render Trackplot::Component.new(data: @data, height: "300px") { |c|
  c.line :revenue, color: "#6366f1"
  c.axis :x, data_key: :month
  c.axis :y
}
```

Requires `view_component` in your Gemfile. Trackplot loads the component class only when ViewComponent is available.

### Phlex

```ruby
render Trackplot::PhlexComponent.new(data: @data, height: "300px") { |c|
  c.line :revenue, color: "#6366f1"
  c.axis :x, data_key: :month
  c.axis :y
}
```

Requires `phlex` in your Gemfile.

## Chart Options

Pass options directly to `trackplot_chart`:

| Option | Default | Description |
|--------|---------|-------------|
| `id:` | auto-generated | Stable DOM id for Turbo targeting |
| `width:` | `"100%"` | CSS width |
| `height:` | `"400px"` | CSS height |
| `animate:` | `true` | Entry animations |
| `theme:` | `:default` | Theme preset or custom Hash |
| `class:` | `nil` | Additional CSS classes |
| `title:` | `nil` | Accessibility label (adds ARIA attributes) |
| `description:` | `nil` | Accessibility description (requires `title:`) |
| `empty_message:` | `"No data available"` | Message shown when data is empty |

## TypeScript

Trackplot ships TypeScript declarations for the npm package. Type-checked `querySelector` narrows to the correct element:

```typescript
const chart = document.querySelector("trackplot-chart")
// => TrackplotElement | null

chart?.addEventListener("trackplot:click", (e) => {
  e.detail.chartType  // string
  e.detail.dataKey    // string
  e.detail.value      // unknown
})

chart?.exportPNG(2, "report.png")  // Promise<Blob | null>
```

All config interfaces are exported: `ChartConfig`, `LineConfig`, `BarConfig`, `ThemeConfig`, `SparklineConfig`, etc.

## Development

Run the test suite:

```bash
ruby -Ilib -Itest -e "Dir['test/**/*_test.rb'].each { |f| require File.expand_path(f) }"
```

Boot the demo app:

```bash
cd test/dummy && bin/rails server
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT License. See [LICENSE.txt](LICENSE.txt).

---

*Made️ by [eagerworks](https://eagerworks.com)*
