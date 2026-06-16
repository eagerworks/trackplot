module Trackplot
  module Components
    class Line < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "line",
          data_key: data_key,
          color: options[:color],
          curve: options.fetch(:curve, false),
          dashed: options.fetch(:dashed, false),
          stroke_width: options[:stroke_width] || 2,
          dot: options.fetch(:dot, true),
          dot_size: options[:dot_size] || 4,
          y_axis: options[:y_axis]&.to_s,
          name: options[:name] || data_key
        }.compact
      end
    end
  end
end
