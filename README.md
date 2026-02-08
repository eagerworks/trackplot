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

## 10 Chart Types

| Cartesian | Radial | Other |
|-----------|--------|-------|
| Line | Pie / Donut | Horizontal Bar |
| Bar | Radar | Funnel |
| Area (+ stacked) | | Candlestick (OHLC) |
| Scatter | | |

Mix and match freely — bars + lines on the same chart just work.

## Installation

Add to your Gemfile:

```ruby
gem "trackplot"
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

Options: `color`, `curve` (smooth), `dashed`, `stroke_width`, `dot` (true/false), `dot_size`.

### Bar

```erb
<% c.bar :sales, color: "#06b6d4", opacity: 0.8, radius: 6 %>
```

Multiple bar series render as grouped bars automatically. Options: `color`, `opacity`, `radius` (corner rounding), `stack` (group name for stacking).

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

Options: `color`, `dot_size`, `opacity`, `x_key` (override x-axis key).

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

## Components

### Axis

```erb
<% c.axis :x, data_key: :month %>
<% c.axis :y, label: "Revenue ($)", format: :currency, tick_count: 5 %>
```

Options: `data_key`, `label`, `format`, `tick_count`, `tick_rotation`.

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

The `trackplot:render` event fires after every render:

```javascript
document.addEventListener("trackplot:render", function(e) {
  console.log("Chart ready:", e.target.id)
})
```

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

## Development

Run the test suite:

```bash
ruby -Ilib -Itest -e "Dir['test/**/*_test.rb'].each { |f| require File.expand_path(f) }"
```

Boot the demo app:

```bash
cd test/dummy && bin/rails server
```

## License

MIT License. See [LICENSE.txt](LICENSE.txt).

---

*Made️ by [eagerworks](https://eagerworks.com)*
