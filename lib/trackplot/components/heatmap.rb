module Trackplot
  module Components
    class Heatmap < Base
      def to_config
        {
          type: "heatmap",
          x_key: options[:x_key],
          y_key: options[:y_key],
          value_key: options[:value_key],
          color_range: options[:color_range] || ["#f0f9ff", "#1e40af"],
          radius: options[:radius] || 2
        }.compact
      end
    end
  end
end
