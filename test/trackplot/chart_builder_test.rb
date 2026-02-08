require_relative "../test_helper"

class ChartBuilderTest < Minitest::Test
  def sample_data
    [{ "month" => "Jan", "revenue" => 100, "profit" => 50 }]
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
    raw = [{ month: "Jan", revenue: 100 }]
    builder = Trackplot::ChartBuilder.new(raw)

    assert_equal [{ "month" => "Jan", "revenue" => 100 }], builder.data
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
    theme = Trackplot::Theme.resolve({ colors: ["#ff0000"], background: "#111" })
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
end
