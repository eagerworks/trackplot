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
end
