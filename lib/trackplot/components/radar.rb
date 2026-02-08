module Trackplot
  module Components
    class Radar < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "radar",
          data_key: data_key,
          color: options[:color],
          opacity: options[:opacity] || 0.15,
          stroke_width: options[:stroke_width] || 2,
          dot: options.fetch(:dot, true),
          dot_size: options[:dot_size] || 4
        }.compact
      end
    end
  end
end
