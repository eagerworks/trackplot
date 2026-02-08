require_relative "../test_helper"

class ColorScaleTest < Minitest::Test
  HEX_PATTERN = /\A#[0-9a-f]{6}\z/

  # ─── Sequential ─────────────────────────────────────────

  def test_sequential_returns_correct_count
    colors = Trackplot::ColorScale.sequential("#6366f1", count: 5)
    assert_equal 5, colors.length
  end

  def test_sequential_default_count
    colors = Trackplot::ColorScale.sequential("#6366f1")
    assert_equal 8, colors.length
  end

  def test_sequential_all_valid_hex
    colors = Trackplot::ColorScale.sequential("#6366f1", count: 6)
    colors.each { |c| assert_match HEX_PATTERN, c }
  end

  def test_sequential_lightness_ordering
    colors = Trackplot::ColorScale.sequential("#6366f1", count: 5)
    lightnesses = colors.map { |c| hsl_lightness(c) }
    # Should be monotonically decreasing (light to dark)
    lightnesses.each_cons(2) do |a, b|
      assert_operator a, :>, b, "Expected #{a} > #{b} for light-to-dark ordering"
    end
  end

  def test_sequential_count_zero
    assert_equal [], Trackplot::ColorScale.sequential("#6366f1", count: 0)
  end

  def test_sequential_count_one
    colors = Trackplot::ColorScale.sequential("#6366f1", count: 1)
    assert_equal 1, colors.length
    assert_match HEX_PATTERN, colors[0]
  end

  # ─── Diverging ──────────────────────────────────────────

  def test_diverging_returns_correct_count
    colors = Trackplot::ColorScale.diverging("#ef4444", "#3b82f6", count: 7)
    assert_equal 7, colors.length
  end

  def test_diverging_default_count
    colors = Trackplot::ColorScale.diverging("#ef4444", "#3b82f6")
    assert_equal 8, colors.length
  end

  def test_diverging_all_valid_hex
    colors = Trackplot::ColorScale.diverging("#ef4444", "#3b82f6", count: 5)
    colors.each { |c| assert_match HEX_PATTERN, c }
  end

  def test_diverging_midpoint_lightest
    colors = Trackplot::ColorScale.diverging("#ef4444", "#3b82f6", count: 9)
    lightnesses = colors.map { |c| hsl_lightness(c) }
    mid = lightnesses.length / 2
    # Midpoint should be the lightest
    assert_equal mid, lightnesses.index(lightnesses.max),
      "Expected midpoint (index #{mid}) to be lightest, got index #{lightnesses.index(lightnesses.max)}"
  end

  def test_diverging_count_zero
    assert_equal [], Trackplot::ColorScale.diverging("#ef4444", "#3b82f6", count: 0)
  end

  def test_diverging_count_one
    colors = Trackplot::ColorScale.diverging("#ef4444", "#3b82f6", count: 1)
    assert_equal 1, colors.length
    assert_match HEX_PATTERN, colors[0]
  end

  # ─── Categorical ────────────────────────────────────────

  def test_categorical_returns_correct_count
    colors = Trackplot::ColorScale.categorical("#6366f1", count: 6)
    assert_equal 6, colors.length
  end

  def test_categorical_default_count
    colors = Trackplot::ColorScale.categorical("#6366f1")
    assert_equal 8, colors.length
  end

  def test_categorical_all_valid_hex
    colors = Trackplot::ColorScale.categorical("#6366f1", count: 6)
    colors.each { |c| assert_match HEX_PATTERN, c }
  end

  def test_categorical_all_unique
    colors = Trackplot::ColorScale.categorical("#6366f1", count: 8)
    assert_equal colors.uniq.length, colors.length
  end

  def test_categorical_first_matches_base_hue
    base = "#6366f1"
    colors = Trackplot::ColorScale.categorical(base, count: 5)
    # First color should have the same hue as the base (within rounding)
    base_hue = hsl_hue(base)
    first_hue = hsl_hue(colors[0])
    assert_in_delta base_hue, first_hue, 1.5, "First color hue should match base"
  end

  def test_categorical_count_zero
    assert_equal [], Trackplot::ColorScale.categorical("#6366f1", count: 0)
  end

  def test_categorical_count_one
    colors = Trackplot::ColorScale.categorical("#6366f1", count: 1)
    assert_equal 1, colors.length
  end

  # ─── Shorthand / Uppercase Hex ──────────────────────────

  def test_shorthand_hex
    colors = Trackplot::ColorScale.sequential("#f00", count: 3)
    assert_equal 3, colors.length
    colors.each { |c| assert_match HEX_PATTERN, c }
  end

  def test_uppercase_hex
    colors = Trackplot::ColorScale.sequential("#FF6600", count: 3)
    assert_equal 3, colors.length
    colors.each { |c| assert_match HEX_PATTERN, c }
  end

  # ─── Invalid Hex ────────────────────────────────────────

  def test_invalid_hex_raises
    assert_raises(ArgumentError) { Trackplot::ColorScale.sequential("red") }
    assert_raises(ArgumentError) { Trackplot::ColorScale.sequential("#gg0000") }
    assert_raises(ArgumentError) { Trackplot::ColorScale.sequential("6366f1") }
    assert_raises(ArgumentError) { Trackplot::ColorScale.sequential("#12345") }
    assert_raises(ArgumentError) { Trackplot::ColorScale.diverging("bad", "#000") }
    assert_raises(ArgumentError) { Trackplot::ColorScale.categorical(nil) }
  end

  # ─── Achromatic (Gray) ─────────────────────────────────

  def test_sequential_with_gray
    colors = Trackplot::ColorScale.sequential("#808080", count: 4)
    assert_equal 4, colors.length
    colors.each { |c| assert_match HEX_PATTERN, c }
  end

  def test_categorical_with_gray
    # Gray has saturation 0 so all hues are equivalent — colors should still be returned
    colors = Trackplot::ColorScale.categorical("#808080", count: 4)
    assert_equal 4, colors.length
  end

  # ─── Integration with Theme.resolve ─────────────────────

  def test_sequential_works_with_theme_resolve
    palette = Trackplot::ColorScale.sequential("#6366f1", count: 5)
    theme = Trackplot::Theme.resolve(colors: palette)

    assert_equal 5, theme[:colors].length
    assert_equal palette, theme[:colors]
    # Still inherits other defaults
    assert_equal "transparent", theme[:background]
  end

  def test_categorical_works_with_theme_resolve
    palette = Trackplot::ColorScale.categorical("#10b981", count: 6)
    theme = Trackplot::Theme.resolve(colors: palette)

    assert_equal 6, theme[:colors].length
  end

  private

  # Extract HSL lightness from hex (for test assertions)
  def hsl_lightness(hex)
    r, g, b = hex.delete_prefix("#").scan(/../).map { |c| c.to_i(16) / 255.0 }
    max = [r, g, b].max
    min = [r, g, b].min
    (max + min) / 2.0
  end

  def hsl_hue(hex)
    r, g, b = hex.delete_prefix("#").scan(/../).map { |c| c.to_i(16) / 255.0 }
    max = [r, g, b].max
    min = [r, g, b].min
    return 0.0 if max == min

    d = max - min
    h = case max
        when r then ((g - b) / d + (g < b ? 6 : 0)) / 6.0
        when g then ((b - r) / d + 2) / 6.0
        when b then ((r - g) / d + 4) / 6.0
        end
    h * 360.0
  end
end
