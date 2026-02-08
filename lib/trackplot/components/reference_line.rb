module Trackplot
  module Components
    class ReferenceLine < Base
      def initialize(**options)
        super
      end

      def to_config
        direction = options[:y] ? "y" : "x"
        value = options[:y] || options[:x]

        {
          type: "reference_line",
          direction: direction,
          value: value,
          label: options[:label],
          color: options[:color] || "#ef4444",
          dashed: options.fetch(:dashed, true),
          stroke_width: options[:stroke_width] || 1.5
        }.compact
      end
    end
  end
end
