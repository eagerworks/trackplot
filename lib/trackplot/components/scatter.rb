module Trackplot
  module Components
    class Scatter < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "scatter",
          data_key: data_key,
          x_key: options[:x_key],
          color: options[:color],
          dot_size: options[:dot_size] || 5,
          opacity: options[:opacity] || 0.7,
          shape: options[:shape] || "circle"
        }.compact
      end
    end
  end
end
