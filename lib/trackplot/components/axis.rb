module Trackplot
  module Components
    class Axis < Base
      attr_reader :direction

      def initialize(direction, **options)
        @direction = direction.to_s
        super(**options)
      end

      def to_config
        {
          type: "axis",
          direction: direction,
          data_key: options[:data_key],
          label: options[:label],
          format: options[:format],
          tick_count: options[:tick_count],
          tick_rotation: options[:tick_rotation]
        }.compact
      end
    end
  end
end
