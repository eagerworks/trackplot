require_relative "../test_helper"

class ChartBuilderTest < Minitest::Test
  def sample_data
    [{"month" => "Jan", "revenue" => 100, "profit" => 50}]
  end

  def test_collects_line_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.line(:revenue, color: "#8884d8", curve: true)

    assert_nil result
    assert_equal 1, builder.components.length
    assert_equal "line", builder.components[0].to_config[:type]
    assert_equal :revenue, builder.components[0].to_config[:data_key]
    assert_equal "#8884d8", builder.components[0].to_config[:color]
    assert_equal true, builder.components[0].to_config[:curve]
  end

  def test_collects_bar_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.bar(:revenue, color: "#06b6d4")

    config = builder.components[0].to_config
    assert_equal "bar", config[:type]
    assert_equal :revenue, config[:data_key]
  end

  def test_collects_area_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.area(:revenue, color: "#10b981", curve: true)

    config = builder.components[0].to_config
    assert_equal "area", config[:type]
    assert_equal 0.3, config[:opacity]
  end

  def test_collects_pie_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.pie(:revenue, label_key: :month, donut: true)

    config = builder.components[0].to_config
    assert_equal "pie", config[:type]
    assert_equal true, config[:donut]
    assert_equal :month, config[:label_key]
  end

  def test_collects_axis_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:x, data_key: :month)

    config = builder.components[0].to_config
    assert_equal "axis", config[:type]
    assert_equal "x", config[:direction]
    assert_equal :month, config[:data_key]
  end

  def test_collects_tooltip_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.tooltip(format: "$,.0f")

    config = builder.components[0].to_config
    assert_equal "tooltip", config[:type]
    assert_equal "$,.0f", config[:format]
  end

  def test_collects_legend_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.legend(position: :right)

    config = builder.components[0].to_config
    assert_equal "legend", config[:type]
    assert_equal :right, config[:position]
  end

  def test_collects_grid_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.grid(horizontal: true, vertical: true)

    config = builder.components[0].to_config
    assert_equal "grid", config[:type]
    assert_equal true, config[:vertical]
  end

  def test_multiple_components
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue, color: "#8884d8")
    builder.line(:profit, color: "#82ca9d")
    builder.axis(:x, data_key: :month)
    builder.axis(:y)
    builder.tooltip
    builder.legend
    builder.grid

    assert_equal 7, builder.components.length
  end

  def test_data_is_normalized
    raw = [{month: "Jan", revenue: 100}]
    builder = Trackplot::ChartBuilder.new(raw)

    assert_equal [{"month" => "Jan", "revenue" => 100}], builder.data
  end

  def test_default_options
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue)

    config = builder.components[0].to_config
    assert_equal 2, config[:stroke_width]
    assert_equal true, config[:dot]
    assert_equal 4, config[:dot_size]
  end

  def test_collects_scatter_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.scatter(:profit, x_key: :revenue, color: "#ef4444")

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "scatter", config[:type]
    assert_equal :profit, config[:data_key]
    assert_equal :revenue, config[:x_key]
    assert_equal 5, config[:dot_size]
  end

  def test_collects_radar_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.radar(:revenue, color: "#8b5cf6")

    config = builder.components[0].to_config
    assert_equal "radar", config[:type]
    assert_equal :revenue, config[:data_key]
    assert_equal 0.15, config[:opacity]
  end

  def test_collects_horizontal_bar_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.horizontal_bar(:revenue, color: "#06b6d4")

    config = builder.components[0].to_config
    assert_equal "horizontal_bar", config[:type]
    assert_equal :revenue, config[:data_key]
    assert_equal 4, config[:radius]
  end

  def test_collects_candlestick_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.candlestick(open: :open, high: :high, low: :low, close: :close)

    config = builder.components[0].to_config
    assert_equal "candlestick", config[:type]
    assert_equal :open, config[:open]
    assert_equal :high, config[:high]
    assert_equal :low, config[:low]
    assert_equal :close, config[:close]
    assert_equal "#10b981", config[:up_color]
    assert_equal "#ef4444", config[:down_color]
  end

  def test_collects_funnel_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.funnel(:revenue, label_key: :month)

    config = builder.components[0].to_config
    assert_equal "funnel", config[:type]
    assert_equal :revenue, config[:data_key]
    assert_equal :month, config[:label_key]
  end

  def test_area_with_stack_option
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.area(:revenue, stack: "main", color: "#6366f1")
    builder.area(:profit, stack: "main", color: "#10b981")

    assert_equal 2, builder.components.length
    assert_equal "main", builder.components[0].to_config[:stack]
    assert_equal "main", builder.components[1].to_config[:stack]
  end

  # ─── Theme Tests ──────────────────────────────────────────

  def test_theme_resolve_default
    theme = Trackplot::Theme.resolve(nil)
    assert_equal "transparent", theme[:background]
    assert_equal 8, theme[:colors].length
  end

  def test_theme_resolve_dark
    theme = Trackplot::Theme.resolve(:dark)
    assert_equal "#1e1e2e", theme[:background]
    assert_equal "#e2e8f0", theme[:text_color]
  end

  def test_theme_resolve_vibrant
    theme = Trackplot::Theme.resolve(:vibrant)
    assert_includes theme[:colors], "#ff6b6b"
  end

  def test_theme_resolve_minimal
    theme = Trackplot::Theme.resolve(:minimal)
    assert_equal "#64748b", theme[:text_color]
  end

  def test_theme_resolve_custom_hash
    theme = Trackplot::Theme.resolve({colors: ["#ff0000"], background: "#111"})
    assert_equal ["#ff0000"], theme[:colors]
    assert_equal "#111", theme[:background]
    # Inherits defaults for unspecified keys
    assert_equal "#374151", theme[:text_color]
  end

  def test_theme_resolve_invalid_symbol
    assert_raises(ArgumentError) { Trackplot::Theme.resolve(:nonexistent) }
  end

  def test_theme_resolve_invalid_type
    assert_raises(ArgumentError) { Trackplot::Theme.resolve(42) }
  end

  def test_build_config_includes_theme
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue)

    config = builder.send(:build_config)
    assert config[:theme]
    assert_equal "transparent", config[:theme][:background]
  end

  def test_build_config_with_dark_theme
    builder = Trackplot::ChartBuilder.new(sample_data, theme: :dark)
    builder.line(:revenue)

    config = builder.send(:build_config)
    assert_equal "#1e1e2e", config[:theme][:background]
  end

  # ─── Reference Line Tests ─────────────────────────────────

  def test_collects_reference_line_y
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.reference_line(y: 5000, label: "Target", color: "#ef4444")

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "reference_line", config[:type]
    assert_equal "y", config[:direction]
    assert_equal 5000, config[:value]
    assert_equal "Target", config[:label]
    assert_equal "#ef4444", config[:color]
    assert_equal true, config[:dashed]
  end

  def test_collects_reference_line_x
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.reference_line(x: "Mar", label: "Launch", dashed: false)

    config = builder.components[0].to_config
    assert_equal "x", config[:direction]
    assert_equal "Mar", config[:value]
    assert_equal false, config[:dashed]
  end

  def test_reference_line_defaults
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.reference_line(y: 100)

    config = builder.components[0].to_config
    assert_equal "#ef4444", config[:color]
    assert_equal 1.5, config[:stroke_width]
    assert_equal true, config[:dashed]
  end

  # ─── Format Helper Tests ──────────────────────────────────

  def test_axis_format_symbol_currency
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:y, format: :currency)

    config = builder.components[0].to_config
    assert_equal "currency", config[:format]
  end

  def test_axis_format_symbol_percent
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:y, format: :percent)

    config = builder.components[0].to_config
    assert_equal "percent", config[:format]
  end

  def test_axis_format_symbol_compact
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:y, format: :compact)

    config = builder.components[0].to_config
    assert_equal "compact", config[:format]
  end

  def test_axis_format_raw_string_passthrough
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:y, format: "$,.2f")

    config = builder.components[0].to_config
    assert_equal "$,.2f", config[:format]
  end

  def test_tooltip_format_symbol_currency
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.tooltip(format: :currency)

    config = builder.components[0].to_config
    assert_equal "currency", config[:format]
  end

  def test_tooltip_format_raw_string_passthrough
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.tooltip(format: ",.0f")

    config = builder.components[0].to_config
    assert_equal ",.0f", config[:format]
  end

  # ─── Stable ID for Turbo ──────────────────────────────────

  def test_custom_id_option
    builder = Trackplot::ChartBuilder.new(sample_data, id: "revenue-chart")
    assert_equal "revenue-chart", builder.options[:id]
  end

  def test_default_id_not_in_options
    builder = Trackplot::ChartBuilder.new(sample_data)
    assert_nil builder.options[:id]
  end

  # ─── Accessibility Tests ───────────────────────────────────

  def test_title_option_in_build_config
    builder = Trackplot::ChartBuilder.new(sample_data, title: "Revenue Chart")
    builder.line(:revenue)

    config = builder.send(:build_config)
    assert_equal "Revenue Chart", config[:title]
  end

  def test_description_option_in_build_config
    builder = Trackplot::ChartBuilder.new(sample_data, title: "Revenue", description: "Monthly revenue data")
    builder.line(:revenue)

    config = builder.send(:build_config)
    assert_equal "Revenue", config[:title]
    assert_equal "Monthly revenue data", config[:description]
  end

  def test_no_title_excludes_from_config
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue)

    config = builder.send(:build_config)
    refute config.key?(:title)
    refute config.key?(:description)
  end

  # ─── Empty State Tests ─────────────────────────────────────

  def test_empty_message_option_in_build_config
    builder = Trackplot::ChartBuilder.new([], empty_message: "Nothing here")
    config = builder.send(:build_config)
    assert_equal "Nothing here", config[:empty_message]
  end

  def test_empty_message_default_not_in_config
    builder = Trackplot::ChartBuilder.new(sample_data)
    config = builder.send(:build_config)
    refute config.key?(:empty_message)
  end

  def test_empty_data_is_normalized
    builder = Trackplot::ChartBuilder.new([])
    assert_equal [], builder.data
  end

  # ─── Data Label Tests ──────────────────────────────────────

  def test_collects_data_label_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.data_label(format: :currency, position: :top)

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "data_label", config[:type]
    assert_equal "currency", config[:format]
    assert_equal "top", config[:position]
    assert_equal 11, config[:font_size]
  end

  def test_data_label_defaults
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.data_label

    config = builder.components[0].to_config
    assert_equal "data_label", config[:type]
    assert_equal "top", config[:position]
    assert_equal 11, config[:font_size]
  end

  def test_data_label_center_position
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.data_label(position: :center)

    config = builder.components[0].to_config
    assert_equal "center", config[:position]
  end

  def test_data_label_custom_font_size
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.data_label(font_size: 14)

    config = builder.components[0].to_config
    assert_equal 14, config[:font_size]
  end

  # ─── Sparkline Tests ───────────────────────────────────────

  def test_sparkline_builder_normalizes_data
    raw = [{month: "Jan", revenue: 100}]
    builder = Trackplot::SparklineBuilder.new(raw, key: :revenue)

    assert_equal [{"month" => "Jan", "revenue" => 100}], builder.data
  end

  def test_sparkline_builder_build_config
    builder = Trackplot::SparklineBuilder.new(sample_data, key: :revenue, type: :bar, color: "#ff0000")
    config = builder.send(:build_config)

    assert_equal "revenue", config[:key]
    assert_equal "bar", config[:type]
    assert_equal "#ff0000", config[:color]
    assert_equal 1.5, config[:stroke_width]
  end

  def test_sparkline_builder_defaults
    builder = Trackplot::SparklineBuilder.new(sample_data, key: :revenue)
    config = builder.send(:build_config)

    assert_equal "line", config[:type]
    assert_equal "#6366f1", config[:color]
    assert_equal false, config[:dot]
  end

  # ─── Stacked Bar Tests ─────────────────────────────────────

  def test_bar_with_stack_option
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.bar(:revenue, stack: "main", color: "#6366f1")
    builder.bar(:profit, stack: "main", color: "#10b981")

    assert_equal 2, builder.components.length
    assert_equal "main", builder.components[0].to_config[:stack]
    assert_equal "main", builder.components[1].to_config[:stack]
  end

  # ─── Dual Y-Axis Tests ─────────────────────────────────────

  def test_axis_with_axis_id_right
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:y, axis_id: :right, format: :percent)

    config = builder.components[0].to_config
    assert_equal "axis", config[:type]
    assert_equal "y", config[:direction]
    assert_equal "right", config[:axis_id]
    assert_equal "percent", config[:format]
  end

  def test_axis_without_axis_id_excludes_it
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.axis(:y)

    config = builder.components[0].to_config
    refute config.key?(:axis_id)
  end

  def test_line_with_y_axis_right
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue, y_axis: :right)

    config = builder.components[0].to_config
    assert_equal "right", config[:y_axis]
  end

  def test_bar_with_y_axis_right
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.bar(:revenue, y_axis: :right)

    config = builder.components[0].to_config
    assert_equal "right", config[:y_axis]
  end

  def test_area_with_y_axis_right
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.area(:revenue, y_axis: :right)

    config = builder.components[0].to_config
    assert_equal "right", config[:y_axis]
  end

  def test_scatter_with_y_axis_right
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.scatter(:revenue, y_axis: :right)

    config = builder.components[0].to_config
    assert_equal "right", config[:y_axis]
  end

  def test_line_without_y_axis_excludes_it
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue)

    config = builder.components[0].to_config
    refute config.key?(:y_axis)
  end

  # ─── Series Name (custom label) Tests ──────────────────────

  def test_line_accepts_custom_name
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue, name: "Total Revenue")

    assert_equal "Total Revenue", builder.components[0].to_config[:name]
  end

  def test_series_name_defaults_to_data_key
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue)

    assert_equal :revenue, builder.components[0].to_config[:name]
  end

  def test_custom_name_supported_on_all_series_types
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue, name: "Rev")
    builder.bar(:revenue, name: "Rev")
    builder.area(:revenue, name: "Rev")
    builder.scatter(:revenue, name: "Rev")
    builder.radar(:revenue, name: "Rev")
    builder.horizontal_bar(:revenue, name: "Rev")

    builder.components.each do |component|
      assert_equal "Rev", component.to_config[:name], "#{component.to_config[:type]} should forward :name"
    end
  end

  def test_series_name_serializes_as_string
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.line(:revenue, name: "Total Revenue")

    parsed = JSON.parse(builder.send(:build_config).to_json)
    line = parsed["components"].find { |c| c["type"] == "line" }
    assert_equal "Total Revenue", line["name"]
  end

  # ─── Brush Tests ────────────────────────────────────────────

  def test_collects_brush_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.brush(axis: :x)

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "brush", config[:type]
    assert_equal "x", config[:axis]
    assert_equal 40, config[:height]
  end

  def test_brush_custom_height
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.brush(axis: :x, height: 60)

    config = builder.components[0].to_config
    assert_equal 60, config[:height]
  end

  # ─── Heatmap Tests ─────────────────────────────────────────

  def test_collects_heatmap_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.heatmap(x_key: :day, y_key: :hour, value_key: :count)

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "heatmap", config[:type]
    assert_equal :day, config[:x_key]
    assert_equal :hour, config[:y_key]
    assert_equal :count, config[:value_key]
  end

  def test_heatmap_defaults
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.heatmap(x_key: :day, y_key: :hour, value_key: :count)

    config = builder.components[0].to_config
    assert_equal ["#f0f9ff", "#1e40af"], config[:color_range]
    assert_equal 2, config[:radius]
  end

  def test_heatmap_custom_color_range
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.heatmap(x_key: :day, y_key: :hour, value_key: :count, color_range: ["#fff", "#000"])

    config = builder.components[0].to_config
    assert_equal ["#fff", "#000"], config[:color_range]
  end

  # ─── Treemap Tests ─────────────────────────────────────────

  def test_collects_treemap_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.treemap(value_key: :size, label_key: :name)

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "treemap", config[:type]
    assert_equal :size, config[:value_key]
    assert_equal :name, config[:label_key]
  end

  def test_treemap_with_parent_key
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.treemap(value_key: :size, label_key: :name, parent_key: :category)

    config = builder.components[0].to_config
    assert_equal :category, config[:parent_key]
  end

  def test_treemap_without_parent_key
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.treemap(value_key: :size, label_key: :name)

    config = builder.components[0].to_config
    refute config.key?(:parent_key)
  end

  # ─── Drilldown Tests ──────────────────────────────────────────

  def test_collects_drilldown_component
    builder = Trackplot::ChartBuilder.new(sample_data)
    result = builder.drilldown(:breakdown)

    assert_nil result
    config = builder.components[0].to_config
    assert_equal "drilldown", config[:type]
    assert_equal "breakdown", config[:key]
  end

  def test_drilldown_key_converts_to_string
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.drilldown(:details)

    config = builder.components[0].to_config
    assert_equal "details", config[:key]
  end

  def test_drilldown_in_full_config
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.bar(:revenue)
    builder.axis(:x, data_key: :month)
    builder.drilldown(:breakdown)

    config = builder.send(:build_config)
    types = config[:components].map { |c| c[:type] }
    assert_includes types, "bar"
    assert_includes types, "axis"
    assert_includes types, "drilldown"
  end

  def test_nested_data_survives_json_round_trip
    data = [
      {"region" => "North", "revenue" => 500, "breakdown" => [
        {"region" => "NYC", "revenue" => 200},
        {"region" => "Boston", "revenue" => 300}
      ]},
      {"region" => "South", "revenue" => 300, "breakdown" => [
        {"region" => "Atlanta", "revenue" => 300}
      ]}
    ]

    builder = Trackplot::ChartBuilder.new(data)
    builder.bar(:revenue)
    builder.drilldown(:breakdown)

    config = builder.send(:build_config)
    json = config.to_json
    parsed = JSON.parse(json)

    assert_equal 2, parsed["data"][0]["breakdown"].length
    assert_equal "NYC", parsed["data"][0]["breakdown"][0]["region"]
  end

  # ─── Config Round-trip Tests ────────────────────────────────

  def test_full_config_round_trip_cartesian
    builder = Trackplot::ChartBuilder.new(sample_data, theme: :dark, title: "Revenue Chart")
    builder.line(:revenue, color: "#6366f1", curve: true)
    builder.bar(:profit, color: "#10b981")
    builder.axis(:x, data_key: :month)
    builder.axis(:y, format: :currency)
    builder.tooltip(format: :currency)
    builder.legend
    builder.grid(horizontal: true)
    builder.reference_line(y: 75, label: "Target")
    builder.data_label(format: :currency, position: :top)

    config = builder.send(:build_config)

    # Verify structure
    assert_equal sample_data, config[:data]
    assert_equal true, config[:animate]
    assert_equal "Revenue Chart", config[:title]
    assert_equal "#1e1e2e", config[:theme][:background]

    # Verify components
    types = config[:components].map { |c| c[:type] }
    assert_includes types, "line"
    assert_includes types, "bar"
    assert_includes types, "axis"
    assert_includes types, "tooltip"
    assert_includes types, "legend"
    assert_includes types, "grid"
    assert_includes types, "reference_line"
    assert_includes types, "data_label"

    # Verify JSON serialization round-trip
    json = config.to_json
    parsed = JSON.parse(json)
    assert_equal sample_data.length, parsed["data"].length
    assert_equal "Revenue Chart", parsed["title"]
  end

  def test_full_config_round_trip_pie
    builder = Trackplot::ChartBuilder.new(sample_data)
    builder.pie(:revenue, label_key: :month, donut: true)
    builder.tooltip
    builder.legend

    config = builder.send(:build_config)
    json = config.to_json
    parsed = JSON.parse(json)

    pie_component = parsed["components"].find { |c| c["type"] == "pie" }
    assert pie_component
    assert_equal "revenue", pie_component["data_key"]
    assert_equal true, pie_component["donut"]
  end

  # ─── Edge Case Tests ────────────────────────────────────────

  def test_nil_values_in_data
    data = [{"month" => "Jan", "revenue" => 100}, {"month" => "Feb", "revenue" => nil}]
    builder = Trackplot::ChartBuilder.new(data)
    builder.line(:revenue)

    config = builder.send(:build_config)
    assert_equal 2, config[:data].length
    assert_nil config[:data][1]["revenue"]
  end

  def test_single_data_point
    data = [{"month" => "Jan", "revenue" => 100}]
    builder = Trackplot::ChartBuilder.new(data)
    builder.line(:revenue)
    builder.axis(:x, data_key: :month)

    config = builder.send(:build_config)
    assert_equal 1, config[:data].length
  end

  def test_large_dataset
    data = (1..1000).map { |i| {"x" => i, "y" => rand(100)} }
    builder = Trackplot::ChartBuilder.new(data)
    builder.line(:y)

    config = builder.send(:build_config)
    assert_equal 1000, config[:data].length
  end

  def test_empty_data_with_components
    builder = Trackplot::ChartBuilder.new([])
    builder.line(:revenue)
    builder.axis(:x, data_key: :month)
    builder.tooltip
    builder.legend

    config = builder.send(:build_config)
    assert_equal [], config[:data]
    assert_equal 4, config[:components].length
  end

  # ─── Theme Inheritance Tests ────────────────────────────────

  def test_custom_theme_inherits_all_default_keys
    custom = {colors: ["#ff0000"]}
    theme = Trackplot::Theme.resolve(custom)

    # All default keys should be present
    default = Trackplot::Theme::PRESETS[:default]
    default.keys.each do |key|
      assert theme.key?(key), "Expected theme to include key: #{key}"
    end
  end

  def test_custom_theme_overrides_specific_keys
    custom = {background: "#000", text_color: "#fff"}
    theme = Trackplot::Theme.resolve(custom)

    assert_equal "#000", theme[:background]
    assert_equal "#fff", theme[:text_color]
    # Non-overridden keys retain defaults
    assert_equal "#d1d5db", theme[:axis_color]
    assert_equal "#e5e7eb", theme[:grid_color]
  end

  def test_custom_theme_with_string_keys
    custom = {"background" => "#222", "text_color" => "#eee"}
    theme = Trackplot::Theme.resolve(custom)

    assert_equal "#222", theme[:background]
    assert_equal "#eee", theme[:text_color]
  end
end
