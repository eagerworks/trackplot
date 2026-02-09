module Trackplot
  module ColorScale
    module_function

    # Light-to-dark palette from a single base color.
    # Extracts hue + saturation, varies lightness from 0.90 to 0.25.
    def sequential(hex, count: 8)
      validate_hex!(hex)
      return [] if count == 0

      h, s, _ = hex_to_hsl(hex)
      if count == 1
        return [hsl_to_hex(h, s, 0.5)]
      end

      (0...count).map do |i|
        l = lerp(0.90, 0.25, i.to_f / (count - 1))
        hsl_to_hex(h, s, l)
      end
    end

    # Two-color gradient with parabolic lightness curve peaking at 0.95 at midpoint.
    def diverging(hex1, hex2, count: 8)
      validate_hex!(hex1)
      validate_hex!(hex2)
      return [] if count == 0

      h1, s1, _ = hex_to_hsl(hex1)
      h2, s2, _ = hex_to_hsl(hex2)

      if count == 1
        return [hsl_to_hex(lerp_hue(h1, h2, 0.5), lerp(s1, s2, 0.5), 0.95)]
      end

      (0...count).map do |i|
        t = i.to_f / (count - 1)
        h = lerp_hue(h1, h2, t)
        s = lerp(s1, s2, t)
        # Parabolic curve: l = 0.95 at t=0.5, dropping to ~0.35 at edges
        l = 0.95 - 2.4 * (t - 0.5)**2
        hsl_to_hex(h, s, l)
      end
    end

    # Evenly-spaced hues, preserving base color's saturation and lightness.
    def categorical(hex, count: 8)
      validate_hex!(hex)
      return [] if count == 0

      h, s, l = hex_to_hsl(hex)
      step = 360.0 / count

      (0...count).map do |i|
        hue = (h + step * i) % 360
        hsl_to_hex(hue, s, l)
      end
    end

    # ── Private helpers ──────────────────────────────────────

    def validate_hex!(hex)
      unless hex.is_a?(String) && hex.match?(/\A#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\z/)
        raise ArgumentError, "Invalid hex color: #{hex.inspect}. Expected format: #RGB or #RRGGBB"
      end
    end

    def hex_to_rgb(hex)
      hex = hex.delete_prefix("#")
      if hex.length == 3
        hex = hex.chars.map { |c| c * 2 }.join
      end
      [hex[0..1], hex[2..3], hex[4..5]].map { |c| c.to_i(16) }
    end

    def rgb_to_hsl(r, g, b)
      r /= 255.0
      g /= 255.0
      b /= 255.0

      max = [r, g, b].max
      min = [r, g, b].min
      l = (max + min) / 2.0

      if max == min
        h = s = 0.0
      else
        d = max - min
        s = (l > 0.5) ? d / (2.0 - max - min) : d / (max + min)

        h = case max
        when r then ((g - b) / d + ((g < b) ? 6 : 0)) / 6.0
        when g then ((b - r) / d + 2) / 6.0
        when b then ((r - g) / d + 4) / 6.0
        end
      end

      [h * 360.0, s, l]
    end

    def hsl_to_rgb(h, s, l)
      h /= 360.0

      if s == 0
        val = (l * 255).round
        return [val, val, val]
      end

      q = (l < 0.5) ? l * (1 + s) : l + s - l * s
      p = 2 * l - q

      r = hue_to_rgb(p, q, h + 1.0 / 3)
      g = hue_to_rgb(p, q, h)
      b = hue_to_rgb(p, q, h - 1.0 / 3)

      [(r * 255).round, (g * 255).round, (b * 255).round]
    end

    def hue_to_rgb(p, q, t)
      t += 1.0 if t < 0
      t -= 1.0 if t > 1

      return p + (q - p) * 6 * t if t < 1.0 / 6
      return q if t < 1.0 / 2
      return p + (q - p) * (2.0 / 3 - t) * 6 if t < 2.0 / 3
      p
    end

    def rgb_to_hex(r, g, b)
      "#%02x%02x%02x" % [r.clamp(0, 255), g.clamp(0, 255), b.clamp(0, 255)]
    end

    def hex_to_hsl(hex)
      r, g, b = hex_to_rgb(hex)
      rgb_to_hsl(r, g, b)
    end

    def hsl_to_hex(h, s, l)
      r, g, b = hsl_to_rgb(h, s, l)
      rgb_to_hex(r, g, b)
    end

    def lerp(a, b, t)
      a + (b - a) * t
    end

    def lerp_hue(h1, h2, t)
      diff = h2 - h1
      if diff.abs > 180
        diff += (diff > 0) ? -360 : 360
      end
      (h1 + diff * t) % 360
    end

    private_class_method :validate_hex!, :hex_to_rgb, :rgb_to_hsl, :hsl_to_rgb,
      :hue_to_rgb, :rgb_to_hex, :hex_to_hsl, :hsl_to_hex,
      :lerp, :lerp_hue
  end
end
