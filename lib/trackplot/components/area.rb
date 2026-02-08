module Trackplot
  module Components
    class Area < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "area",
          data_key: data_key,
          color: options[:color],
          curve: options.fetch(:curve, false),
          opacity: options[:opacity] || 0.3,
          stroke_width: options[:stroke_width] || 2,
          stack: options[:stack],
          y_axis: options[:y_axis]&.to_s
        }.compact
      end
    end
  end
end
